export type UserRole = 'Administrador' | 'Técnico Especialista' | 'Operador de Oficina';
export type UserStatus = 'aprovado' | 'pendente' | 'recusado';
export interface SystemUser { id: string; name: string; email: string; passwordHash: string; salt: string; workshop?: string; role: UserRole; status: UserStatus; requestedAt: string; reviewedAt?: string; isAdmin?: boolean; lastSeenAt?: string; }
export interface AuthUser { id: string; name: string; email: string; role: UserRole; workshop?: string; isAdmin?: boolean; }
export const ADMIN_CREDENTIALS = { email: 'Use o e-mail definido pelo administrador' };
const SESSION_EVENT = 'heniza-session-changed';
function emit(user: AuthUser | null) { window.dispatchEvent(new CustomEvent(SESSION_EVENT, { detail: user })); }
async function api(path: string, options?: RequestInit) { const response = await fetch(`/api/auth/${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) } }); const data = await response.json(); return { response, data }; }
export async function requestRegistration(data: { name: string; email: string; password: string; workshop?: string }): Promise<{ success: boolean; message: string }> { const { data: result } = await api('register', { method: 'POST', body: JSON.stringify(data) }); return result; }
export async function authenticateUser(email: string, password: string): Promise<{ success: boolean; message: string; user?: AuthUser }> { const { data: result } = await api('login', { method: 'POST', body: JSON.stringify({ email, password }) }); if (result.success) emit(result.user); return result; }
export async function getCurrentSession(): Promise<AuthUser | null> { try { const { response, data } = await api('session'); if (!response.ok) return null; return data.user || null; } catch { return null; } }
export async function logout(): Promise<void> { await api('logout', { method: 'POST' }); emit(null); }
export async function getStoredUsers(): Promise<SystemUser[]> { const response = await fetch('/api/admin/users'); if (!response.ok) return []; const data = await response.json(); return data.users || []; }
export async function setRequestStatus(userId: string, newStatus: 'aprovado' | 'recusado'): Promise<{ success: boolean }> { const response = await fetch(`/api/admin/users/${userId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) }); return { success: response.ok }; }
export async function deleteUserRequest(userId: string): Promise<boolean> { const response = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' }); return response.ok; }
export async function ensureBootstrapAdmin(): Promise<void> { return; }
export function getPendingCount(): number { return 0; }
export async function migrateFromLegacyIfNeeded(): Promise<void> { return; }
export { SESSION_EVENT };
