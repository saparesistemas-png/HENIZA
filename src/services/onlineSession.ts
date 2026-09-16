/**
 * Sessão online (JWT) + helpers de Authorization.
 */

const TOKEN_KEY = 'heniza_online_token';
const TOKEN_EXP_KEY = 'heniza_online_token_exp';
const ONLINE_USER_KEY = 'heniza_online_user';

export type OnlineUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  workshop?: string;
  isAdmin?: boolean;
};

export function getOnlineToken(): string | null {
  try {
    const t = localStorage.getItem(TOKEN_KEY);
    const exp = Number(localStorage.getItem(TOKEN_EXP_KEY) || 0);
    if (!t || !exp || Date.now() > exp) {
      clearOnlineSession();
      return null;
    }
    return t;
  } catch {
    return null;
  }
}

export function getOnlineUser(): OnlineUser | null {
  try {
    if (!getOnlineToken()) return null;
    const raw = localStorage.getItem(ONLINE_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveOnlineSession(token: string, expiresAt: number, user: OnlineUser) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(TOKEN_EXP_KEY, String(expiresAt));
  localStorage.setItem(ONLINE_USER_KEY, JSON.stringify(user));
}

export function clearOnlineSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXP_KEY);
  localStorage.removeItem(ONLINE_USER_KEY);
}

export function authHeaders(extra?: Record<string, string>): Record<string, string> {
  const t = getOnlineToken();
  const h: Record<string, string> = { 'Content-Type': 'application/json', ...extra };
  if (t) h.Authorization = `Bearer ${t}`;
  return h;
}

export async function loginOnline(
  email: string,
  password: string
): Promise<{ ok: boolean; message: string; user?: OnlineUser }> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json();
    if (!res.ok || !json?.ok || !json?.token) {
      return { ok: false, message: json?.error || 'Falha no login online' };
    }
    saveOnlineSession(json.token, json.expiresAt || Date.now() + 12 * 3600 * 1000, json.user);
    return { ok: true, message: 'Login online OK', user: json.user };
  } catch {
    return { ok: false, message: 'Servidor online indisponível' };
  }
}

export async function refreshOnlineSession(): Promise<boolean> {
  const t = getOnlineToken();
  if (!t) return false;
  try {
    const res = await fetch('/api/auth/session', {
      headers: { Authorization: `Bearer ${t}` },
    });
    const json = await res.json();
    if (!json?.ok) {
      clearOnlineSession();
      return false;
    }
    return true;
  } catch {
    return false;
  }
}
