import type { VercelRequest, VercelResponse } from '@vercel/node';
import { authFromRequest } from '../_lib/authTokens';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  const payload = authFromRequest(req);
  if (!payload) {
    return res.status(401).json({ ok: false, error: 'Sessão inválida ou expirada' });
  }

  return res.status(200).json({
    ok: true,
    user: {
      id: payload.sub,
      name: payload.name,
      email: payload.email,
      role: payload.role,
      workshop: payload.workshop,
      isAdmin: payload.isAdmin,
    },
    exp: payload.exp,
  });
}
