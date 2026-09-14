import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  searchTechnicalNetwork,
  mergeNetworkIntoDiagnosis,
} from './_lib/networkSearch.js';

export const config = { maxDuration: 60 };

const REQUEST_TIMEOUT_MS = 50_000;

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

function parseBody(body: unknown): { ok: true; payload: Payload } | { ok: false; message: string } {
  if (!body || typeof body !== 'object') return { ok: false, message: 'Body invalido.' };
  const b = body as Record<string, unknown>;
  const description = b.description ? String(b.description).trim() : '';
  const image = typeof b.image === 'string' ? b.image : undefined;
  const audio = typeof b.audio === 'string' ? b.audio : undefined;
  const video = typeof b.video === 'string' ? b.video : undefined;
  const chassis = b.chassis ? String(b.chassis).trim() : '';
  if (!(description || image || audio || video || chassis)) {
    return { ok: false, message: 'Informe descricao, imagem, audio, video ou chassi.' };
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
    },
  };
}

function buildPrompt(p: Payload, networkSummary: string): string {
  return [
    'Você é o consultor técnico da oficina OficIA.',
    'Escreva para o MECÂNICO: português claro, frases curtas e concretas.',
    'Use a EVIDÊNCIA PÚBLICA/REDE abaixo.',
    '',
    'VEÍCULO:',
    '- Placa: ' + (p.plate || 'N/I'),
    '- Chassi: ' + (p.chassis || 'N/I'),
    '- Marca: ' + (p.make || 'Geral'),
    '- Modelo: ' + (p.model || 'Geral'),
    '- Relato: "' + (p.description || '') + '"',
    '',
    'EVIDÊNCIA:',
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
      diagnosticNotes: '1. Avisos na multimídia.\n2. Isolamento HV.\n3. Bateria 12V e HVIL.',
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
        'P0300: combustão irregular em mais de um cilindro. Causas: bobinas, velas, cabos, bicos, pressão combustível, ar falso, compressão.',
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
    : ((p.make || '') + ' ' + (p.model || '') + ' - ' + (p.description || 'análise').slice(0, 60)).trim();

  return {
    codeType: 'SCANNER_OBD2',
    codeTypeLabel: 'Diagnóstico OBD2',
    originBadge: 'Laudo de oficina',
    originExplanation: 'Análise preliminar + fontes públicas.',
    problemName: problem,
    supplierCategory: 'Powertrain / Elétrica',
    severity: 'Média',
    source: 'OficIA (local)',
    diagnosticNotes: '1. Confirmar código.\n2. Bateria e massas.\n3. Chicotes e conectores.',
    resetProcedure: '1. Registrar e apagar.\n2. Rodagem.\n3. Verificar se retorna.',
    correctiveChecklist: ['Ler códigos OBD2', 'Tensão da bateria', 'Conectores e massas', 'Testar componentes'],
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
    };

    try {
      network = await withTimeout(
        searchTechnicalNetwork(
          {
            description: payload.description,
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
          Object.assign({}, parsed, { source: 'OficIA / Gemini + fontes públicas' }),
          network
        );
        return res.status(200).json({
          ok: true,
          data,
          meta: {
            source: 'gemini+network',
            model: modelUsed,
            hasOpenLaborKey: hasOlp,
            networkGrounded: network.grounded,
            latencyMs: Date.now() - startedAt,
          },
        });
      }
    }

    const data = mergeNetworkIntoDiagnosis(localFallback(payload), network);
    return res.status(200).json({
      ok: true,
      data,
      meta: {
        source: network.hits?.length ? 'fallback+public' : 'fallback',
        hasOpenLaborKey: hasOlp,
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
