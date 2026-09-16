import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  loadRemoteUsers,
  signToken,
  verifyRemotePassword,
} from '../_lib/authTokens';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '').trim();
    if (!email || !password) {
      return res.status(400).json({ ok: false, error: 'E-mail e senha obrigatórios' });
    }

    const users = loadRemoteUsers();
    const matched = users.find((u) => u.email.toLowerCase() === email);
    if (!matched || !verifyRemotePassword(matched, password)) {
      return res.status(401).json({ ok: false, error: 'Credenciais inválidas' });
    }

    const { token, exp } = signToken({
      id: matched.id,
      email: matched.email,
      name: matched.name,
      role: matched.role,
      workshop: matched.workshop,
      isAdmin: matched.isAdmin,
    });

    return res.status(200).json({
      ok: true,
      token,
      expiresAt: exp * 1000,
      user: {
        id: matched.id,
        name: matched.name,
        email: matched.email,
        role: matched.role,
        workshop: matched.workshop,
        isAdmin: matched.isAdmin,
      },
      mode: 'online',
    });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: e?.message || 'login error' });
  }
}
