import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  searchTechnicalNetwork,
  mergeNetworkIntoDiagnosis,
} from './_lib/networkSearch.js';

export const config = { maxDuration: 60 };

const REQUEST_TIMEOUT_MS = 50_000;

type LiveObdReading = {
  id: string;
  name?: string;
  value: number | null;
  unit?: string;
  ok?: boolean;
};

type Payload = {
  description?: string;
  image?: string;
  audio?: string;
  video?: string;
  plate?: string;
  chassis?: string;
  make?: string;
  model?: string;
  propulsionType?: string;
  isEvAlternative?: boolean;
  clientId?: string;
  liveObd?: LiveObdReading[];
};

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('TIMEOUT')), ms);
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

function extractJson(text: string): Record<string, unknown> | null {
  try {
    return JSON.parse(text.trim());
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

function formatLiveObd(list?: LiveObdReading[]): string {
  if (!list?.length) return '';
  const lines = list
    .filter((r) => r.value != null && !Number.isNaN(Number(r.value)))
    .map((r) => `- ${r.name || r.id}: ${r.value}${r.unit ? ' ' + r.unit : ''}`);
  if (!lines.length) return '';
  return ['DADOS OBD AO VIVO (scanner/ELM327):', ...lines].join('\n');
}

function liveObdHints(list?: LiveObdReading[]): string[] {
  if (!list?.length) return [];
  const hints: string[] = [];
  const byId = Object.fromEntries(list.map((r) => [r.id, r]));
  const cool = byId.coolant?.value;
  const iat = byId.iat?.value;
  const rpm = byId.rpm?.value;
  const stft = byId.stft_b1?.value;
  const volt = byId.voltage?.value;
  if (cool != null && cool >= 110) hints.push('ECT elevada — risco de superaquecimento');
  if (cool != null && cool < 70 && rpm != null && rpm > 500)
    hints.push('ECT baixa com motor girando — termostato/ECT');
  if (stft != null && Math.abs(stft) > 15) hints.push('STFT fora de faixa — mistura irregular');
  if (volt != null && volt < 12.2) hints.push('Tensão do módulo baixa');
  if (iat != null && cool != null && Math.abs(iat - cool) > 40 && rpm != null && rpm < 1000)
    hints.push('IAT vs ECT com grande diferença em idle — validar sensores');
  return hints;
}

function parseBody(body: unknown): { ok: true; payload: Payload } | { ok: false; message: string } {
  if (!body || typeof body !== 'object') return { ok: false, message: 'Body invalido.' };
  const b = body as Record<string, unknown>;
  const description = b.description ? String(b.description).trim() : '';
  const image = typeof b.image === 'string' ? b.image : undefined;
  const audio = typeof b.audio === 'string' ? b.audio : undefined;
  const video = typeof b.video === 'string' ? b.video : undefined;
  const chassis = b.chassis ? String(b.chassis).trim() : '';
  const liveObd = Array.isArray(b.liveObd)
    ? (b.liveObd as any[])
        .slice(0, 24)
        .map((r) => ({
          id: String(r?.id || ''),
          name: r?.name ? String(r.name) : undefined,
          value: r?.value == null || r?.value === '' ? null : Number(r.value),
          unit: r?.unit ? String(r.unit) : undefined,
          ok: r?.ok !== false,
        }))
        .filter((r) => r.id)
    : undefined;

  if (!(description || image || audio || video || chassis || (liveObd && liveObd.length))) {
    return { ok: false, message: 'Informe descricao, OBD ao vivo, imagem, audio, video ou chassi.' };
  }
  return {
    ok: true,
    payload: {
      description,
      image,
      audio,
      video,
      chassis,
      plate: b.plate ? String(b.plate).trim() : '',
      make: b.make ? String(b.make).trim() : '',
      model: b.model ? String(b.model).trim() : '',
      propulsionType: b.propulsionType ? String(b.propulsionType) : '',
      isEvAlternative: Boolean(b.isEvAlternative),
      clientId: b.clientId ? String(b.clientId) : undefined,
      liveObd,
    },
  };
}

function buildPrompt(p: Payload, networkSummary: string): string {
  return [
    'Você é o consultor técnico da oficina OficIA.',
    'Escreva para o MECÂNICO: português claro, frases curtas e concretas.',
    'Use a EVIDÊNCIA e os DADOS OBD AO VIVO quando existirem (ECT, IAT, RPM, STFT, tensão).',
    'Não invente valores de PID que não foram informados.',
    '',
    'VEÍCULO:',
    '- Placa: ' + (p.plate || 'N/I'),
    '- Chassi: ' + (p.chassis || 'N/I'),
    '- Marca: ' + (p.make || 'Geral'),
    '- Modelo: ' + (p.model || 'Geral'),
    '- Relato: "' + (p.description || '') + '"',
    formatLiveObd(p.liveObd) || '- OBD ao vivo: não informado',
    '',
    'EVIDÊNCIA DA REDE/OBD:',
    networkSummary || 'Sem evidência nesta execução.',
    '',
    'Retorne SOMENTE JSON com:',
    'problemName, severity (Alta|Média|Baixa), originBadge,',
    'diagnosticNotes, resetProcedure, correctiveChecklist[],',
    'preventiveChecklist[], budgetItems[{item,category,estimatedCost}],',
    'codeType, codeTypeLabel, originExplanation, supplierCategory, source.',
  ].join('\n');
}

function localFallback(p: Payload): Record<string, unknown> {
  const q = ((p.description || '') + ' ' + (p.make || '') + ' ' + (p.model || '')).toLowerCase();
  const liveHints = liveObdHints(p.liveObd);
  const liveBlock = formatLiveObd(p.liveObd);

  if (/byd|dolphin|gwm|ora|eletr|bateria|isolamento|doip|hvil/.test(q) || p.isEvAlternative) {
    return {
      codeType: 'DIAGNOSTICO_EV_ALTA_TENSAO',
      codeTypeLabel: 'Diagnóstico EV',
      originBadge: 'EV / Alta tensão',
      originExplanation: 'Protocolo EV/híbrido.',
      problemName: ((p.make || 'EV') + ' ' + (p.model || '') + ' - verificar alta tensão / BMS').trim(),
      supplierCategory: 'BMS / Alta tensão',
      severity: 'Alta',
      source: 'OficIA (local)',
      diagnosticNotes:
        (liveBlock ? liveBlock + '\n\n' : '') +
        '1. Avisos na multimídia.\n2. Isolamento HV.\n3. Bateria 12V e HVIL.',
      resetProcedure: '1. Negativo 12V.\n2. MSD com EPI.\n3. Aguardar 10 min.',
      correctiveChecklist: ['Medir isolamento HV', 'Desbalanceamento de células', 'Testar HVIL', 'Bateria 12V'],
      preventiveChecklist: ['Carga AC semanal'],
      budgetItems: [{ item: 'Diagnóstico EV', category: 'Mão de Obra', estimatedCost: 450 }],
    };
  }

  if (/p0300|falha de combust|misfire|falhando|engasg|vibra/.test(q)) {
    return {
      codeType: 'SCANNER_OBD2',
      codeTypeLabel: 'Scanner OBD2',
      originBadge: 'P0300 - misfire',
      originExplanation: 'Falha de combustão em vários cilindros.',
      problemName: 'P0300 - falha de combustão (misfire) em vários cilindros',
      supplierCategory: 'Ignição / Injeção / Mecânica',
      severity: 'Alta',
      source: 'OficIA (local)',
      diagnosticNotes:
        (liveBlock ? liveBlock + '\n\n' : '') +
        'P0300: combustão irregular em mais de um cilindro. Causas: bobinas, velas, cabos, bicos, pressão combustível, ar falso, compressão.' +
        (liveHints.length ? '\n' + liveHints.join('\n') : ''),
      resetProcedure:
        '1. Freeze frame.\n2. Bobinas e velas.\n3. Pressão combustível e vácuo.\n4. Corrigir, apagar, testar.',
      correctiveChecklist: [
        'Confirmar P0300 e P0301–P0304',
        'Velas e bobinas',
        'Pressão da bomba',
        'Ar falso',
        'Compressão se necessário',
      ],
      preventiveChecklist: ['Velas no intervalo', 'Combustível de qualidade'],
      budgetItems: [
        { item: 'Diagnóstico eletrônico', category: 'Mão de Obra', estimatedCost: 220 },
        { item: 'Jogo de velas (estimativa)', category: 'Peça', estimatedCost: 180 },
        { item: 'Bobina (se necessária)', category: 'Peça', estimatedCost: 250 },
      ],
    };
  }

  const codeMatch = q.match(/\b([pcbu]\d{4})\b/i);
  const problem = codeMatch
    ? codeMatch[1].toUpperCase() + ' - código relatado'
    : liveHints[0] ||
      ((p.make || '') + ' ' + (p.model || '') + ' - ' + (p.description || 'análise OBD').slice(0, 60)).trim();

  return {
    codeType: 'SCANNER_OBD2',
    codeTypeLabel: 'Diagnóstico OBD2',
    originBadge: liveBlock ? 'OBD ao vivo + laudo' : 'Laudo de oficina',
    originExplanation: liveBlock
      ? 'Análise com dados OBD em tempo real e fontes públicas.'
      : 'Análise preliminar + fontes públicas.',
    problemName: problem,
    supplierCategory: 'Powertrain / Elétrica',
    severity: liveHints.some((h) => /superaquec|tensão baixa/i.test(h)) ? 'Alta' : 'Média',
    source: 'OficIA (local)',
    diagnosticNotes:
      (liveBlock ? liveBlock + '\n\n' : '') +
      (liveHints.length ? liveHints.join('\n') + '\n\n' : '') +
      '1. Confirmar código.\n2. Bateria e massas.\n3. Chicotes e conectores.',
    resetProcedure: '1. Registrar e apagar.\n2. Rodagem.\n3. Verificar se retorna.',
    correctiveChecklist: [
      ...(liveHints.length ? liveHints : []),
      'Ler códigos OBD2',
      'Tensão da bateria',
      'Conectores e massas',
      'Testar componentes',
    ].slice(0, 8),
    preventiveChecklist: ['Revisões no prazo'],
    budgetItems: [
      { item: 'Diagnóstico eletrônico', category: 'Mão de Obra', estimatedCost: 180 },
      { item: 'Mão de obra de reparo', category: 'Mão de Obra', estimatedCost: 200 },
    ],
  };
}

async function callGemini(
  payload: Payload,
  apiKey: string,
  networkSummary: string
): Promise<Record<string, unknown> | null> {
  try {
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey });
    const parts: any[] = [{ text: buildPrompt(payload, networkSummary) }];
    if (payload.image && payload.image.indexOf('data:image') === 0) {
      const m = payload.image.match(/^data:(image\/\w+);base64,(.+)$/);
      if (m) parts.push({ inlineData: { mimeType: m[1], data: m[2] } });
    }
    for (const model of ['gemini-2.5-flash', 'gemini-2.0-flash']) {
      try {
        const response: any = await withTimeout(
          ai.models.generateContent({
            model,
            contents: [{ role: 'user', parts }],
            config: { responseMimeType: 'application/json', temperature: 0.3 },
          }),
          REQUEST_TIMEOUT_MS
        );
        const text =
          response.text ||
          response.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '').join('') ||
          '';
        if (text) {
          const parsed = extractJson(text);
          if (parsed) return Object.assign({}, parsed, { _model: model });
        }
      } catch (err: any) {
        console.error('[diagnose] model', model, err?.message || err);
      }
    }
  } catch (err: any) {
    console.error('[diagnose] gemini', err?.message || err);
  }
  return null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const startedAt = Date.now();
  const hasOlp = Boolean(process.env.OPEN_LABOR_API_KEY);

  try {
    const validation = parseBody(req.body);
    if (!validation.ok) {
      return res.status(400).json({ ok: false, error: validation.message });
    }

    const payload = validation.payload;
    const apiKey = process.env.GEMINI_API_KEY;

    let network = {
      summary: '',
      sources: [] as string[],
      hits: [] as any[],
      queries: [] as string[],
      grounded: false,
      torqueSpecs: undefined as any,
      laborTimes: undefined as any,
      temperature: undefined as any,
    };

    try {
      network = await withTimeout(
        searchTechnicalNetwork(
          {
            description: [payload.description, formatLiveObd(payload.liveObd)]
              .filter(Boolean)
              .join('\n'),
            make: payload.make,
            model: payload.model,
            chassis: payload.chassis,
            isEv: payload.isEvAlternative,
          },
          apiKey
        ),
        40_000
      );
    } catch (err: any) {
      console.error('[diagnose] network', err?.message || err);
      network.summary = 'Rede indisponível: ' + String(err?.message || err).slice(0, 150);
    }

    if (apiKey) {
      const parsed = await callGemini(payload, apiKey, network.summary);
      if (parsed) {
        const modelUsed = parsed._model;
        delete parsed._model;
        const data = mergeNetworkIntoDiagnosis(
          Object.assign({}, parsed, {
            source: 'OficIA / Gemini + OBD ao vivo + fontes públicas',
            liveObd: payload.liveObd,
          }),
          network
        );
        return res.status(200).json({
          ok: true,
          data,
          meta: {
            source: 'gemini+network',
            model: modelUsed,
            hasOpenLaborKey: hasOlp,
            liveObdCount: payload.liveObd?.length || 0,
            networkGrounded: network.grounded,
            latencyMs: Date.now() - startedAt,
          },
        });
      }
    }

    const data = mergeNetworkIntoDiagnosis(
      Object.assign({}, localFallback(payload), { liveObd: payload.liveObd }),
      network
    );
    return res.status(200).json({
      ok: true,
      data,
      meta: {
        source: network.hits?.length ? 'fallback+public' : 'fallback',
        hasOpenLaborKey: hasOlp,
        liveObdCount: payload.liveObd?.length || 0,
        networkGrounded: network.grounded,
        latencyMs: Date.now() - startedAt,
      },
    });
  } catch (err: any) {
    console.error('[diagnose] fatal', err);
    return res.status(200).json({
      ok: true,
      data: {
        problemName: 'Diagnóstico local (safe mode)',
        severity: 'Média',
        diagnosticNotes: 'Erro interno: ' + String(err?.message || err).slice(0, 200),
        correctiveChecklist: ['Repetir diagnóstico', 'Confirmar no scanner'],
        budgetItems: [{ item: 'Diagnóstico eletrônico', category: 'Mão de Obra', estimatedCost: 180 }],
        source: 'OficIA (safe)',
      },
      meta: {
        source: 'safe-mode',
        hasOpenLaborKey: hasOlp,
        error: String(err?.message || err).slice(0, 200),
        latencyMs: Date.now() - startedAt,
      },
    });
  }
}
