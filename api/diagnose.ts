import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getGenAIClient, withTimeout, extractJson } from './_lib/gemini';
import { validateDiagnosePayload, type DiagnosePayload } from './_lib/validate';
import { resolveAutomotiveFaultKnowledge } from './_lib/fallback';

export const config = {
  maxDuration: 60,
};

const REQUEST_TIMEOUT_MS = 45_000;

function buildPrompt(p: DiagnosePayload, approvedKnowledge: string): string {
  return `
Você é o consultor técnico da oficina OficIA / HENIZA.
Escreva para o MECÂNICO na bancada: português claro, frases curtas, sem jargão de sistema.

VEÍCULO:
- Placa: ${p.plate || 'N/I'}
- Chassi: ${p.chassis || 'N/I'}
- Marca: ${p.make || 'Geral'}
- Modelo: ${p.model || 'Geral'}
- Propulsão: ${p.propulsionType || (p.isEvAlternative ? 'Elétrico/Híbrido' : 'Flex')}
- Relato do cliente: "${p.description || 'Análise multimodal'}"

BASE INTERNA (opcional):
${approvedKnowledge}

CLASSIFICAÇÃO (escolha uma):
- PAINEL_INSTRUMENTOS = código de 1 a 3 dígitos no painel
- SCANNER_OBD2 = código P/C/B/U + 4 dígitos
- SINTOMA_MECANICO / ANALISE_ACUSTICA = ruído ou sintoma sem código
- DIAGNOSTICO_EV_ALTA_TENSAO = veículo elétrico / alta tensão

REGRAS DE ESCRITA:
1. problemName: uma linha objetiva (ex.: "P0300 — falha de combustão em vários cilindros").
2. diagnosticNotes: 3 a 6 frases curtas do que está acontecendo e o que medir.
3. resetProcedure: passos numerados 1. 2. 3. (o que fazer na oficina).
4. correctiveChecklist: ações práticas (máx. 6), começando com verbo.
5. preventiveChecklist: 2 a 4 itens simples.
6. budgetItems: 2 a 5 itens realistas em R$ (mão de obra e peças).
7. originBadge: curto (máx. 40 caracteres), sem texto longo.
8. originExplanation: no máximo 1 frase.
9. NÃO invente códigos que o cliente não relatou.
10. NÃO use termos como "Rede Neural", "Base Mundial", "AutoOps".

RETORNE SOMENTE JSON:
{
  "codeType": "PAINEL_INSTRUMENTOS|SCANNER_OBD2|SINTOMA_MECANICO|ANALISE_ACUSTICA|DIAGNOSTICO_EV_ALTA_TENSAO",
  "codeTypeLabel": "string curta",
  "originBadge": "string curta",
  "originExplanation": "uma frase",
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
}
`;
}

async function loadApprovedKnowledge(make: string, model: string): Promise<string> {
  try {
    const mod = await import('./_lib/knowledge');
    const entries = await mod.getApprovedKnowledge(make, model);
    return mod.formatKnowledgeForPrompt(entries);
  } catch (err) {
    console.warn('[diagnose] knowledge skip', err);
    return 'Nenhum conhecimento interno aprovado foi encontrado.';
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed', code: 'VALIDATION' });
  }

  const startedAt = Date.now();

  try {
    const validation = validateDiagnosePayload(req.body);

    if (validation.ok === false) {
      return res.status(400).json({
        ok: false,
        error: validation.message,
        code: 'VALIDATION',
      });
    }

    const payload = validation.payload;
    const approvedKnowledge = await loadApprovedKnowledge(payload.make || '', payload.model || '');
    const ai = getGenAIClient();

    if (ai) {
      try {
        const parts: any[] = [{ text: buildPrompt(payload, approvedKnowledge) }];

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
                'Técnico de oficina. Responda só JSON. Texto curto e prático para o mecânico.',
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
                source: parsed.source || 'OficIA / Gemini',
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
        console.error(
          '[diagnose] gemini',
          err?.message === 'TIMEOUT' ? 'timeout' : err?.message || err
        );
      }
    }

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
    console.error('[diagnose] fatal', err);
    return res.status(500).json({
      ok: false,
      error: 'Erro interno no diagnóstico.',
      code: 'INTERNAL',
    });
  }
}
