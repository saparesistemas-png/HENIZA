import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getGenAIClient, withTimeout, extractJson } from './_lib/gemini';

export const config = { maxDuration: 60 };

function promptFor(mode: 'chat' | 'synthesis', message: string, domain: string) {
  if (mode === 'synthesis') {
    return `Você é o OricIA, especialista técnico da HENIZA. Analise o problema abaixo no domínio ${domain}. Retorne SOMENTE JSON válido com: problem (string), probabilities (array de 3 objetos {name:string,val:number}, somando 100), steps (array de strings), summary (string), warnings (array de strings). Não invente certeza: sinalize quando for necessária medição ou manual do fabricante. Problema: ${message}`;
  }
  return `Você é o OricIA, um consultor técnico claro e seguro da HENIZA. Responda em português, em Markdown, para esta pergunta do domínio ${domain}: ${message}. Estruture com diagnóstico provável, verificações práticas e alertas de segurança. Não alegue ter pesquisado a internet em tempo real e não invente valores específicos sem contexto.`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const { message, domain = 'geral', mode = 'chat' } = req.body ?? {};
  if (typeof message !== 'string' || message.trim().length < 2 || message.length > 8000) {
    return res.status(400).json({ ok: false, error: 'Mensagem inválida.' });
  }
  if (mode !== 'chat' && mode !== 'synthesis') {
    return res.status(400).json({ ok: false, error: 'Modo inválido.' });
  }

  const ai = getGenAIClient();
  if (!ai) return res.status(503).json({ ok: false, error: 'IA indisponível.' });

  try {
    const response = await withTimeout(ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: promptFor(mode, message.trim(), String(domain)),
      config: mode === 'synthesis' ? { responseMimeType: 'application/json' } : undefined,
    }), 45_000);
    const text = response.text?.trim();
    if (!text) throw new Error('EMPTY_RESPONSE');
    const data = mode === 'synthesis' ? extractJson(text) : { answer: text };
    if (!data) throw new Error('INVALID_JSON');
    return res.status(200).json({ ok: true, data, meta: { source: 'gemini' } });
  } catch (error) {
    console.error('[chat]', error instanceof Error ? error.message : error);
    return res.status(502).json({ ok: false, error: 'Não foi possível obter resposta da IA agora.' });
  }
}
