/**
 * POST /api/ocr — extrai placa, km e códigos DTC de foto de evidência (Gemini).
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = { maxDuration: 30 };

type OcrResult = {
  plate?: string | null;
  odometerKm?: number | null;
  dtcCodes?: string[];
  rawText?: string;
  confidence?: number;
  notes?: string;
};

function extractJson(text: string): OcrResult | null {
  try {
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) return null;
    return JSON.parse(m[0]) as OcrResult;
  } catch {
    return null;
  }
}

function localFallback(hint?: string): OcrResult {
  const codes = (hint || '').match(/\b[PCBU][0-9A-Fa-f]{4}\b/g) || [];
  const plate = (hint || '').match(/\b[A-Z]{3}[0-9][A-Z0-9][0-9]{2}\b/i)?.[0];
  const km = (hint || '').match(/\b(\d{4,7})\s*km\b/i)?.[1];
  return {
    plate: plate ? plate.toUpperCase() : null,
    odometerKm: km ? Number(km) : null,
    dtcCodes: codes.map((c) => c.toUpperCase()),
    rawText: hint || '',
    confidence: 0.2,
    notes: 'Fallback local (sem Gemini)',
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const image = body.image as string | undefined;
    const slotId = String(body.slotId || '');
    const hint = String(body.hint || '');

    if (!image || !image.startsWith('data:image')) {
      return res.status(400).json({ ok: false, error: 'Envie dataUrl de imagem' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(200).json({ ok: true, data: localFallback(hint), mode: 'local' });
    }

    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey });

    const base64 = image.replace(/^data:image\/\w+;base64,/, '');
    const mime = image.match(/^data:(image\/\w+)/)?.[1] || 'image/jpeg';

    const prompt = `Você é OCR automotivo brasileiro. Analise a foto de evidência de oficina.
Slot: ${slotId || 'geral'}
Extraia APENAS JSON válido:
{
  "plate": "placa Mercosul ou antiga ou null",
  "odometerKm": número inteiro do odômetro ou null,
  "dtcCodes": ["P0xxx", ...],
  "rawText": "texto legível principal",
  "confidence": 0.0 a 1.0,
  "notes": "observação curta"
}
Regras: placa em maiúsculas sem hífen; DTCs no padrão OBD; se não legível use null/[].`;

    const response = await ai.models.generateContent({
      model: process.env.GEMINI_OCR_MODEL || 'gemini-2.0-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            { inlineData: { mimeType: mime, data: base64 } },
          ],
        },
      ],
    });

    const text =
      (response as any)?.text ||
      (response as any)?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('') ||
      '';

    const parsed = extractJson(text) || localFallback(text || hint);
    if (parsed.plate) parsed.plate = String(parsed.plate).replace(/[^A-Z0-9]/gi, '').toUpperCase();
    if (Array.isArray(parsed.dtcCodes)) {
      parsed.dtcCodes = parsed.dtcCodes.map((c) => String(c).toUpperCase());
    }

    return res.status(200).json({ ok: true, data: parsed, mode: 'gemini' });
  } catch (e: any) {
    return res.status(200).json({
      ok: true,
      data: localFallback(),
      mode: 'error-fallback',
      error: e?.message || 'ocr failed',
    });
  }
}
