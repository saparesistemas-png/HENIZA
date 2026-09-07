import crypto from 'node:crypto';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL });
const SESSION_DAYS = 30;

type UserRow = { id: string; name: string; email: string; workshop?: string; role: string; status: string; is_admin: boolean };

function publicUser(user: UserRow) {
  return { id: user.id, name: user.name, email: user.email, workshop: user.workshop, role: user.role, isAdmin: user.is_admin };
}
function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}
function verifyPassword(password: string, stored: string) {
  const [salt, expected] = stored.split(':');
  if (!salt || !expected) return false;
  const actual = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(actual, 'hex'), Buffer.from(expected, 'hex'));
}
function cookie(token: string, maxAge: number) {
  return `heniza_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
}
function tokenFrom(req: any) {
  const value = req.headers.cookie?.split(';').find((part: string) => part.trim().startsWith('heniza_session='));
  return value?.split('=')[1];
}

export default async function auth(req: any, res: any) {
  const action = req.path?.split('/').pop() || '';
  if (req.method === 'POST' && action === 'register') {
    const { name, email, password, workshop } = req.body || {};
    if (!name?.trim() || !email?.trim() || !password || password.length < 8) return res.status(400).json({ success: false, message: 'Informe nome, e-mail e uma senha com no mínimo 8 caracteres.' });
    const normalized = email.trim().toLowerCase();
    const exists = await pool.query('SELECT id FROM heniza_users WHERE email = $1', [normalized]);
    if (exists.rowCount) return res.status(409).json({ success: false, message: 'Este e-mail já possui cadastro ou pedido em análise.' });
    await pool.query('INSERT INTO heniza_users (name, email, password_hash, workshop) VALUES ($1, $2, $3, $4)', [name.trim(), normalized, hashPassword(password), workshop?.trim() || 'Oficina Automotiva']);
    return res.json({ success: true, message: 'Solicitação enviada. Aguarde aprovação do administrador.' });
  }
  if (req.method === 'POST' && action === 'login') {
    const { email, password } = req.body || {};
    const result = await pool.query<UserRow & { password_hash: string }>('SELECT id, name, email, workshop, role, status, is_admin, password_hash FROM heniza_users WHERE email = $1', [email?.trim().toLowerCase()]);
    const user = result.rows[0];
    if (!user || !verifyPassword(password || '', user.password_hash)) return res.status(401).json({ success: false, message: 'E-mail ou senha inválidos.' });
    if (user.status !== 'aprovado') return res.status(403).json({ success: false, message: user.status === 'pendente' ? 'Cadastro pendente de aprovação.' : 'Acesso recusado. Contate o administrador.' });
    const token = crypto.randomBytes(32).toString('hex');
    await pool.query("INSERT INTO heniza_sessions (token, user_id, expires_at) VALUES ($1, $2, now() + interval '30 days')", [token, user.id]);
    await pool.query('UPDATE heniza_users SET last_seen_at = now() WHERE id = $1', [user.id]);
    res.setHeader('Set-Cookie', cookie(token, SESSION_DAYS * 86400));
    return res.json({ success: true, message: `Bem-vindo, ${user.name}!`, user: publicUser(user) });
  }
  if (req.method === 'POST' && action === 'logout') {
    const token = tokenFrom(req);
    if (token) await pool.query('DELETE FROM heniza_sessions WHERE token = $1', [token]);
    res.setHeader('Set-Cookie', cookie('', 0));
    return res.json({ success: true });
  }
  const token = tokenFrom(req);
  if (!token) return res.status(401).json({ success: false, message: 'Não autenticado.' });
  const result = await pool.query<UserRow>('SELECT u.id, u.name, u.email, u.workshop, u.role, u.status, u.is_admin FROM heniza_users u JOIN heniza_sessions s ON s.user_id = u.id WHERE s.token = $1 AND s.expires_at > now()', [token]);
  if (!result.rows[0]) return res.status(401).json({ success: false, message: 'Sessão expirada.' });
  await pool.query('UPDATE heniza_users SET last_seen_at = now() WHERE id = $1', [result.rows[0].id]);
  return res.json({ success: true, user: publicUser(result.rows[0]) });
}

export { pool, hashPassword };

export async function getAuthenticatedUser(req: any) {
  const token = tokenFrom(req);
  if (!token) return null;
  const result = await pool.query<UserRow>('SELECT u.id, u.name, u.email, u.workshop, u.role, u.status, u.is_admin FROM heniza_users u JOIN heniza_sessions s ON s.user_id = u.id WHERE s.token = $1 AND s.expires_at > now()', [token]);
  return result.rows[0] || null;
}

export function sessionCookie(req: any) { return tokenFrom(req); }
const _unused = sessionCookie;
void _unused;

export async function requireAdmin(req: any, res: any) {
  const user = await getAuthenticatedUser(req);
  if (!user?.is_admin) { res.status(403).json({ success: false, message: 'Acesso administrativo necessário.' }); return null; }
  return user;
}

export async function listUsers() { const result = await pool.query<UserRow>('SELECT id, name, email, workshop, role, status, is_admin, requested_at, reviewed_at, last_seen_at FROM heniza_users ORDER BY requested_at DESC'); return result.rows; }
export async function updateUserStatus(id: string, status: string) { await pool.query('UPDATE heniza_users SET status = $1, reviewed_at = now() WHERE id = $2', [status, id]); }
export async function removeUser(id: string) { await pool.query('DELETE FROM heniza_users WHERE id = $1', [id]); }
