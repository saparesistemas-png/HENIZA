import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    status: 'ok',
    service: 'HENIZA OficIA',
    aiConnected: Boolean(process.env.GEMINI_API_KEY),
    model: 'gemini-2.5-flash',
  });
}
