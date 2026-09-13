import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  searchTechnicalNetwork,
  mergeNetworkIntoDiagnosis,
} from './_lib/networkSearch';

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
    'Use a EVIDÊNCIA DA REDE abaixo para cruzar com o relato. Não invente manuais pagos como grátis.',
    '',
    'VEÍCULO:',
    '- Placa: ' + (p.plate || 'N/I'),
    '- Chassi: ' + (p.chassis || 'N/I'),
    '- Marca: ' + (p.make || 'Geral'),
    '- Modelo: ' + (p.model || 'Geral'),
    '- Relato: "' + (p.description || '') + '"',
    '',
    'EVIDÊNCIA DA REDE (busca pública / grounding):',
    networkSummary || 'Sem evidência de rede nesta execução.',
    '',
    'Retorne SOMENTE JSON com:',
    'problemName, severity (Alta|Média|Baixa), originBadge curto,',
    'diagnosticNotes, resetProcedure, correctiveChecklist[],',
    'preventiveChecklist[], budgetItems[{item,category,estimatedCost}],',
    'codeType, codeTypeLabel, originExplanation, supplierCategory, source.',
    'Não use termos: Rede Neural, Base Mundial, AutoOps.',
  ].join('\n');
}

function localFallback(p: Payload): Record<string, unknown> {
  const q = ((p.description || '') + ' ' + (p.make || '') + ' ' + (p.model || '')).toLowerCase();

  if (/byd|dolphin|gwm|ora|eletr|bateria|isolamento|doip|hvil/.test(q) || p.isEvAlternative) {
    return {
      codeType: 'DIAGNOSTICO_EV_ALTA_TENSAO',
      codeTypeLabel: 'Diagnóstico EV',
      originBadge: 'EV / Alta tensão',
      originExplanation: 'Protocolo para veículo elétrico ou híbrido.',
      problemName: ((p.make || 'EV') + ' ' + (p.model || '') + ' - verificar alta tensão / BMS').trim(),
      supplierCategory: 'BMS / Alta tensão',
      severity: 'Alta',
      source: 'OficIA (local)',
      diagnosticNotes:
        '1. Conferir avisos na multimídia.\n2. Medir isolamento HV (> 500 kOhm).\n3. Checar bateria 12V e HVIL.',
      resetProcedure:
        '1. Negativo 12V.\n2. Remover MSD com EPI 1000V.\n3. Aguardar 10 min e religar.',
      correctiveChecklist: [
        'Medir isolamento HV',
        'Verificar desbalanceamento de células',
        'Testar HVIL',
        'Validar bateria 12V',
      ],
      preventiveChecklist: ['Carga AC completa semanal', 'Inspecionar cabos HV'],
      budgetItems: [{ item: 'Diagnóstico EV', category: 'Mão de Obra', estimatedCost: 450 }],
      suggestedBestPractices: ['Usar luva isolante 1000V (NR-10).'],
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
        'P0300 indica combustão irregular em mais de um cilindro. Causas comuns: bobinas, velas, cabos, bicos, baixa pressão de combustível, admissão com ar falso, compressão baixa. Em marcha lenta com vibração, priorize velas/bobinas e pressão de combustível.',
      resetProcedure:
        '1. Ler códigos e congelamento de quadro.\n2. Testar bobinas e velas.\n3. Medir pressão de combustível e vazamento de vácuo.\n4. Corrigir a causa, apagar códigos e fazer teste de rodagem.',
      correctiveChecklist: [
        'Confirmar P0300 e cilindros relacionados (P0301-P0304)',
        'Inspecionar e medir velas e bobinas',
        'Medir pressão da bomba de combustível',
        'Procurar entrada de ar falso (admissão/mangueiras)',
        'Testar compressão se elétrico/combustível estiver ok',
      ],
      preventiveChecklist: [
        'Trocar velas no intervalo da montadora',
        'Usar combustível de qualidade',
      ],
      budgetItems: [
        { item: 'Diagnóstico eletrônico + teste de bobinas/velas', category: 'Mão de Obra', estimatedCost: 220 },
        { item: 'Jogo de velas (estimativa)', category: 'Peça', estimatedCost: 180 },
        { item: 'Bobina de ignição (se necessária)', category: 'Peça', estimatedCost: 250 },
      ],
      suggestedBestPractices: ['Não apague o código antes de registrar os dados do scanner.'],
    };
  }

  const codeMatch = q.match(/\b([pcbu]\d{4})\b/i);
  const problem = codeMatch
    ? codeMatch[1].toUpperCase() + ' - código relatado no scanner'
    : ((p.make || '') + ' ' + (p.model || '') + ' - ' + (p.description || 'análise de falha').slice(0, 60)).trim();

  return {
    codeType: 'SCANNER_OBD2',
    codeTypeLabel: 'Diagnóstico OBD2 / sintoma',
    originBadge: 'Laudo de oficina',
    originExplanation: 'Análise preliminar com base no relato.',
    problemName: problem,
    supplierCategory: 'Powertrain / Elétrica',
    severity: 'Média',
    source: 'OficIA (local)',
    diagnosticNotes:
      '1. Confirmar o código no scanner.\n2. Verificar bateria e massas.\n3. Inspecionar chicotes e conectores do sistema indicado.',
    resetProcedure:
      '1. Registrar e apagar códigos.\n2. Fazer teste de rodagem.\n3. Confirmar se o código retorna.',
    correctiveChecklist: [
      'Ler e gravar códigos OBD2',
      'Medir tensão da bateria (parado e ligado)',
      'Inspecionar conectores e massas',
      'Testar componentes do sistema apontado',
    ],
    preventiveChecklist: ['Revisões no prazo', 'Usar peças de qualidade'],
    budgetItems: [
      { item: 'Diagnóstico eletrônico', category: 'Mão de Obra', estimatedCost: 180 },
      { item: 'Mão de obra de reparo', category: 'Mão de Obra', estimatedCost: 200 },
    ],
    suggestedBestPractices: ['Anotar placa, chassi e sintomas com foto.'],
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
    if (payload.audio && payload.audio.indexOf('data:audio') === 0) {
      const m = payload.audio.match(/^data:(audio\/\w+);base64,(.+)$/);
      if (m) parts.push({ inlineData: { mimeType: m[1], data: m[2] } });
    }

    const models = ['gemini-2.5-flash', 'gemini-2.0-flash'];
    for (const model of models) {
      try {
        const response: any = await withTimeout(
          ai.models.generateContent({
            model,
            contents: [{ role: 'user', parts }],
            config: {
              responseMimeType: 'application/json',
              temperature: 0.3,
            },
          }),
          REQUEST_TIMEOUT_MS
        );
        const text =
          response.text ||
          (response.candidates &&
            response.candidates[0] &&
            response.candidates[0].content &&
            response.candidates[0].content.parts &&
            response.candidates[0].content.parts
              .map(function (p: any) {
                return p.text || '';
              })
              .join('')) ||
          '';
        if (text) {
          const parsed = extractJson(text);
          if (parsed) return Object.assign({}, parsed, { _model: model });
        }
      } catch (err: any) {
        console.error('[diagnose] model fail', model, err && err.message ? err.message : err);
      }
    }
  } catch (err: any) {
    console.error('[diagnose] gemini import/call', err && err.message ? err.message : err);
  }
  return null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const startedAt = Date.now();

  try {
    const validation = parseBody(req.body);
    if (!validation.ok) {
      return res.status(400).json({ ok: false, error: validation.message });
    }

    const payload = validation.payload;
    const apiKey = process.env.GEMINI_API_KEY;

    // 1) Busca na rede (YouTube, OEM EU, TSB públicos, engenharia)
    let network = {
      summary: 'Busca na rede não executada (sem chave Gemini).',
      sources: [] as string[],
      hits: [] as any[],
      queries: [] as string[],
      grounded: false,
    };

    if (apiKey) {
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
          35_000
        );
      } catch (err) {
        console.error('[diagnose] network search', err);
      }
    }

    // 2) Laudo da IA cruzando com evidência da rede
    if (apiKey) {
      const parsed = await callGemini(payload, apiKey, network.summary);
      if (parsed) {
        const modelUsed = parsed._model;
        delete parsed._model;
        const data = mergeNetworkIntoDiagnosis(
          Object.assign({}, parsed, { source: 'OficIA / Gemini + Rede' }),
          network
        );
        return res.status(200).json({
          ok: true,
          data,
          meta: {
            source: 'gemini+network',
            model: modelUsed,
            networkGrounded: network.grounded,
            latencyMs: Date.now() - startedAt,
            clientId: payload.clientId,
          },
        });
      }
    }

    // 3) Fallback local + o que a rede trouxe
    const data = mergeNetworkIntoDiagnosis(localFallback(payload), network);
    return res.status(200).json({
      ok: true,
      data,
      meta: {
        source: network.grounded ? 'fallback+network' : 'fallback',
        networkGrounded: network.grounded,
        latencyMs: Date.now() - startedAt,
        clientId: payload.clientId,
      },
    });
  } catch (err) {
    console.error('[diagnose] fatal', err);
    return res.status(500).json({ ok: false, error: 'Erro interno no diagnostico.' });
  }
}
