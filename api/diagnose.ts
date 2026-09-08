import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getGenAIClient, withTimeout, extractJson } from './_lib/gemini';
import { validateDiagnosePayload, type DiagnosePayload } from './_lib/validate';
import { resolveAutomotiveFaultKnowledge } from './_lib/fallback';

export const config = {
  maxDuration: 60,
};

const REQUEST_TIMEOUT_MS = 45_000;

function buildPrompt(p: DiagnosePayload): string {
  return `
Você é o Consultor Técnico Sênior em Engenharia Automotiva & EV da OficIA / HENIZA.

DADOS:
- Placa: ${p.plate || 'N/I'}
- Chassi: ${p.chassis || 'N/I'}
- Montadora: ${p.make || 'Geral'}
- Modelo: ${p.model || 'Geral'}
- Propulsão: ${p.propulsionType || (p.isEvAlternative ? 'Elétrico/Híbrido' : 'Flex')}
- EV alternativo: ${p.isEvAlternative ? 'SIM' : 'NÃO'}
- Relato: "${p.description || 'Análise multimodal'}"
- Modo: ${p.mode || 'Multimodal'}

REGRAS:
1. Código 1-3 dígitos = PAINEL_INSTRUMENTOS (não scanner).
2. P/C/B/U + 4 dígitos = SCANNER_OBD2.
3. Ruído/sintoma = SINTOMA_MECANICO ou ANALISE_ACUSTICA.
4. Alta tensão EV = DIAGNOSTICO_EV_ALTA_TENSAO.

RETORNE SOMENTE JSON:
{
  "codeType": "PAINEL_INSTRUMENTOS|SCANNER_OBD2|SINTOMA_MECANICO|ANALISE_ACUSTICA|DIAGNOSTICO_EV_ALTA_TENSAO",
  "codeTypeLabel": "string",
  "originBadge": "string",
  "originExplanation": "string",
  "problemName": "string",
  "supplierCategory": "string",
  "severity": "Alta|Média|Baixa",
  "source": "string",
  "diagnosticNotes": "string",
  "resetProcedure": "string",
  "correctiveChecklist": ["string"],
  "preventiveChecklist": ["string"],
  "budgetItems": [{"item":"string","category":"Peça|Mão de Obra","estimatedCost":0}],
  "suggestedBestPractices": ["string"]
}
`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed', code: 'VALIDATION' });
  }

  const startedAt = Date.now();
  const validation = validateDiagnosePayload(req.body);

  if (validation.ok === false) {
    return res.status(400).json({
      ok: false,
      error: validation.message,
      code: 'VALIDATION',
    });
  }

  const payload = validation.payload;
  const ai = getGenAIClient();

  if (ai) {
    try {
      const parts: any[] = [{ text: buildPrompt(payload) }];

      if (payload.image?.startsWith('data:image')) {
        const m = payload.image.match(/^data:(image\/\w+);base64,(.+)$/);
        if (m) parts.push({ inlineData: { mimeType: m[1], data: m[2] } });
      } else if (payload.image?.startsWith('IMAGE_PRESET_')) {
        parts.push({ text: `[IMAGEM PRESET] ${payload.image}` });
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
              'Engenheiro automotivo sênior. Responda somente JSON válido no schema pedido.',
          },
        }),
        REQUEST_TIMEOUT_MS
      );

      if (response.text) {
        const parsed = extractJson(response.text);
        if (parsed) {
          return res.status(200).json({
            ok: true,
            data: {
              ...parsed,
              source: 'Inteligência Artificial Gemini — Base OficIA',
            },
            meta: {
              source: 'gemini',
              latencyMs: Date.now() - startedAt,
              clientId: payload.clientId,
            },
          });
        }
      }
    } catch (err: any) {
      console.error('[diagnose]', err?.message === 'TIMEOUT' ? 'timeout' : err?.message || err);
    }
  }

  try {
    const data = resolveAutomotiveFaultKnowledge(
      (payload.description || '').toLowerCase(),
      payload.plate || '',
      payload.chassis || '',
      payload.make || '',
      payload.model || '',
      Boolean(payload.isEvAlternative)
    );

    return res.status(200).json({
      ok: true,
      data,
      meta: {
        source: 'fallback',
        latencyMs: Date.now() - startedAt,
        clientId: payload.clientId,
      },
    });
  } catch (err) {
    console.error('[diagnose] fallback', err);
    return res.status(500).json({
      ok: false,
      error: 'Erro interno no diagnóstico.',
      code: 'INTERNAL',
    });
  }
}
