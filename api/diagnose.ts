import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

export const config = {
  maxDuration: 60,
};

const REQUEST_TIMEOUT_MS = 45_000;

type Payload = {
  description?: string;
  mode?: string;
  image?: string;
  audio?: string;
  video?: string;
  lang?: string;
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
    promise
      .then((v) => {
        clearTimeout(timer);
        resolve(v);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
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
  if (!body || typeof body !== 'object') return { ok: false, message: 'Body inválido.' };
  const b = body as Record<string, unknown>;
  const description = b.description ? String(b.description).trim() : '';
  const image = typeof b.image === 'string' ? b.image : undefined;
  const audio = typeof b.audio === 'string' ? b.audio : undefined;
  const video = typeof b.video === 'string' ? b.video : undefined;
  const chassis = b.chassis ? String(b.chassis).trim() : '';
  if (!(description || image || audio || video || chassis)) {
    return { ok: false, message: 'Informe descrição, imagem, áudio, vídeo ou chassi.' };
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
      mode: b.mode ? String(b.mode) : 'Multimodal',
      lang: b.lang ? String(b.lang) : 'pt',
      propulsionType: b.propulsionType ? String(b.propulsionType) : '',
      isEvAlternative: Boolean(b.isEvAlternative),
      clientId: b.clientId ? String(b.clientId) : undefined,
    },
  };
}

function buildPrompt(p: Payload): string {
  return `Você é o consultor técnico da oficina OficIA.
Escreva para o MECÂNICO: português claro, frases curtas, sem jargão de sistema.

VEÍCULO:
- Placa: ${p.plate || 'N/I'}
- Chassi: ${p.chassis || 'N/I'}
- Marca: ${p.make || 'Geral'}
- Modelo: ${p.model || 'Geral'}
- Propulsão: ${p.propulsionType || (p.isEvAlternative ? 'Elétrico/Híbrido' : 'Flex')}
- Relato: "${p.description || 'Análise multimodal'}"

REGRAS:
1. problemName: uma linha objetiva.
2. diagnosticNotes: 3 a 6 frases curtas.
3. resetProcedure: passos 1. 2. 3.
4. correctiveChecklist: até 6 ações com verbo no início.
5. originBadge: máximo 40 caracteres.
6. originExplanation: no máximo 1 frase.
7. Não use "Rede Neural", "Base Mundial", "AutoOps".

RETORNE SOMENTE JSON:
{
  "codeType": "SCANNER_OBD2",
  "codeTypeLabel": "string",
  "originBadge": "string",
  "originExplanation": "string",
  "problemName": "string",
  "supplierCategory": "string",
  "severity": "Alta|Média|Baixa",
  "source": "OficIA",
  "diagnosticNotes": "string",
  "resetProcedure": "string",
  "correctiveChecklist": ["string"],
  "preventiveChecklist": ["string"],
  "budgetItems": [{"item":"string","category":"Peça|Mão de Obra","estimatedCost":0}],
  "suggestedBestPractices": ["string"]
}`;
}

function localFallback(p: Payload): Record<string, unknown> {
  const q = (p.description || '').toLowerCase();
  const isEv =
    p.isEvAlternative ||
    /byd|dolphin|gwm|ora|el[eé]tric|bateria|isolamento|doip|hvil/.test(
      `${q} ${p.make || ''} ${p.model || ''}`
    );

  if (isEv) {
    return {
      codeType: 'DIAGNOSTICO_EV_ALTA_TENSAO',
      codeTypeLabel: 'Diagnóstico EV',
      originBadge: 'EV / Alta tensão',
      originExplanation: 'Protocolo para veículo elétrico ou híbrido.',
      problemName: `${p.make || 'EV'} ${p.model || ''} — verificar alta tensão / BMS`.trim(),
      supplierCategory: 'BMS / Alta tensão',
      severity: 'Alta',
      source: 'OficIA (local)',
      diagnosticNotes:
        '1. Conferir avisos na multimídia.\n2. Medir isolamento HV (> 500 kΩ).\n3. Checar bateria 12V e HVIL.',
      resetProcedure:
        '1. Desligar e tirar negativo 12V.\n2. Remover MSD com EPI 1000V.\n3. Aguardar 10 min e religar.',
      correctiveChecklist: [
        'Medir isolamento HV',
        'Verificar desbalanceamento de células',
        'Testar HVIL',
        'Validar bateria 12V',
      ],
      preventiveChecklist: ['Carga AC completa semanal', 'Inspecionar cabos HV'],
      budgetItems: [
        { item: 'Diagnóstico EV', category: 'Mão de Obra', estimatedCost: 450 },
      ],
      suggestedBestPractices: ['Usar luva isolante 1000V (NR-10).'],
    };
  }

  const codeMatch = q.match(/\b([pcbu]\d{4})\b/i);
  const problem = codeMatch
    ? `${codeMatch[1].toUpperCase()} — falha relatada no scanner`
    : `${p.make || ''} ${p.model || ''} — ${ (p.description || 'análise de falha').slice(0, 60) }`.trim();

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
      'Medir tensão da bateria (motor ligado e parado)',
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

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const parts: any[] = [{ text: buildPrompt(payload) }];

        if (payload.image?.startsWith('data:image')) {
          const m = payload.image.match(/^data:(image\/\w+);base64,(.+)$/);
          if (m) parts.push({ inlineData: { mimeType: m[1], data: m[2] } });
        }
        if (payload.audio?.startsWith('data:audio')) {
          const m = payload.audio.match(/^data:(audio\/\w+);base64,(.+)$/);
          if (m) parts.push({ inlineData: { mimeType: m[1], data: m[2] } });
        }

        const response = await withTimeout(
          ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts },
            config: {
              responseMimeType: 'application/json',
              systemInstruction:
                'Técnico de oficina. Responda somente JSON. Texto curto e prático.',
            },
          }),
          REQUEST_TIMEOUT_MS
        );

        if (response.text) {
          const parsed = extractJson(response.text);
          if (parsed) {
            return res.status(200).json({
              ok: true,
              data: { ...parsed, source: 'OficIA / Gemini' },
              meta: {
                source: 'gemini',
                latencyMs: Date.now() - startedAt,
                clientId: payload.clientId,
              },
            });
          }
        }
      } catch (err: any) {
        console.error('[diagnose] gemini', err?.message || err);
      }
    }

    return res.status(200).json({
      ok: true,
      data: localFallback(payload),
      meta: {
        source: 'fallback',
        latencyMs: Date.now() - startedAt,
        clientId: payload.clientId,
      },
    });
  } catch (err) {
    console.error('[diagnose] fatal', err);
    return res.status(500).json({ ok: false, error: 'Erro interno no diagnóstico.' });
  }
}
