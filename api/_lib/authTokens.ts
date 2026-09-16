/**
 * Tokens JWT-like (HMAC-SHA256) para APIs HENIZA.
 * AUTH_SECRET em env; fallback de bootstrap só para demo.
 */
import crypto from 'crypto';

export type TokenPayload = {
  sub: string;
  email: string;
  name: string;
  role: string;
  workshop?: string;
  isAdmin?: boolean;
  iat: number;
  exp: number;
};

function secret(): string {
  return (
    process.env.AUTH_SECRET ||
    process.env.HENIZA_AUTH_SECRET ||
    process.env.GEMINI_API_KEY ||
    'heniza-dev-secret-change-me'
  );
}

function b64url(input: Buffer | string): string {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return buf
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function fromB64url(s: string): Buffer {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + pad;
  return Buffer.from(b64, 'base64');
}

export function signToken(
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    workshop?: string;
    isAdmin?: boolean;
  },
  ttlSec = 60 * 60 * 12
): { token: string; exp: number } {
  const now = Math.floor(Date.now() / 1000);
  const payload: TokenPayload = {
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    workshop: user.workshop,
    isAdmin: user.isAdmin,
    iat: now,
    exp: now + ttlSec,
  };
  const body = b64url(JSON.stringify(payload));
  const sig = b64url(crypto.createHmac('sha256', secret()).update(body).digest());
  return { token: `${body}.${sig}`, exp: payload.exp };
}

export function verifyToken(token: string | null | undefined): TokenPayload | null {
  if (!token) return null;
  const raw = token.startsWith('Bearer ') ? token.slice(7).trim() : token.trim();
  const [body, sig] = raw.split('.');
  if (!body || !sig) return null;
  const expected = b64url(crypto.createHmac('sha256', secret()).update(body).digest());
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(fromB64url(body).toString('utf8')) as TokenPayload;
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function authFromRequest(req: { headers?: Record<string, unknown> }): TokenPayload | null {
  const h = req.headers || {};
  const auth =
    (h.authorization as string) ||
    (h.Authorization as string) ||
    '';
  return verifyToken(auth);
}

export type RemoteUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  workshop?: string;
  isAdmin?: boolean;
  /** sha256 hex of password+salt or plain only for env bootstrap */
  passwordPlain?: string;
  passwordHash?: string;
  salt?: string;
};

export function loadRemoteUsers(): RemoteUser[] {
  const list: RemoteUser[] = [];
  const adminEmail = (process.env.HENIZA_ADMIN_EMAIL || 'admin@heniza.local').toLowerCase();
  const adminPass = process.env.HENIZA_ADMIN_PASSWORD || 'Heniza@2025';
  list.push({
    id: 'admin-online',
    email: adminEmail,
    name: process.env.HENIZA_ADMIN_NAME || 'Administrador HENIZA',
    role: 'Administrador',
    workshop: 'Diretoria',
    isAdmin: true,
    passwordPlain: adminPass,
  });
  try {
    if (process.env.HENIZA_USERS_JSON) {
      const extra = JSON.parse(process.env.HENIZA_USERS_JSON) as RemoteUser[];
      if (Array.isArray(extra)) list.push(...extra);
    }
  } catch {
    /* ignore */
  }
  return list;
}

export function verifyRemotePassword(user: RemoteUser, password: string): boolean {
  if (user.passwordPlain) {
    return user.passwordPlain === password;
  }
  if (user.passwordHash && user.salt) {
    const hash = crypto.createHash('sha256').update(password + user.salt).digest('hex');
    return hash === user.passwordHash;
  }
  return false;
}
