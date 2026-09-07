// Secure authentication — Web Crypto, no plaintext passwords in source

export type UserRole = 'Administrador' | 'Técnico Especialista' | 'Operador de Oficina';
export type UserStatus = 'aprovado' | 'pendente' | 'recusado';

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  salt: string;
  workshop?: string;
  role: UserRole;
  status: UserStatus;
  requestedAt: string;
  reviewedAt?: string;
  isAdmin?: boolean;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  workshop?: string;
  isAdmin?: boolean;
}

const USERS_KEY = 'heniza_users_v2';
const SESSION_KEY = 'heniza_session_v2';
const BOOTSTRAP_ADMIN_EMAIL = 'admin@heniza.local';

export const ADMIN_CREDENTIALS = {
  email: BOOTSTRAP_ADMIN_EMAIL,
};

async function generateSalt(): Promise<string> {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function hashPassword(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function verifyPassword(password: string, salt: string, expectedHash: string): Promise<boolean> {
  const hash = await hashPassword(password, salt);
  return hash === expectedHash;
}

function loadUsers(): SystemUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveUsers(users: SystemUser[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export async function ensureBootstrapAdmin(initialPassword: string): Promise<void> {
  const users = loadUsers();
  if (users.some((u) => u.isAdmin === true)) return;
  const salt = await generateSalt();
  const passwordHash = await hashPassword(initialPassword, salt);
  users.unshift({
    id: 'admin-01',
    name: 'Administrador HENIZA',
    email: BOOTSTRAP_ADMIN_EMAIL,
    passwordHash,
    salt,
    workshop: 'Diretoria Executiva',
    role: 'Administrador',
    status: 'aprovado',
    requestedAt: new Date().toISOString(),
    isAdmin: true,
  });
  saveUsers(users);
}

export function getStoredUsers(): SystemUser[] {
  return loadUsers();
}

export function getPendingCount(): number {
  return loadUsers().filter((u) => u.status === 'pendente').length;
}

export function getCurrentSession(): AuthUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSession(user: AuthUser | null): void {
  if (user) localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  else localStorage.removeItem(SESSION_KEY);
}

export async function requestRegistration(data: {
  name: string;
  email: string;
  password: string;
  workshop?: string;
}): Promise<{ success: boolean; message: string }> {
  const users = loadUsers();
  const email = data.email.trim().toLowerCase();
  if (users.some((u) => u.email === email)) {
    return { success: false, message: 'Este e-mail já possui cadastro ou pedido em análise.' };
  }
  const salt = await generateSalt();
  const passwordHash = await hashPassword(data.password.trim(), salt);
  users.push({
    id: 'req-' + Date.now(),
    name: data.name.trim(),
    email,
    passwordHash,
    salt,
    workshop: data.workshop?.trim() || 'Oficina Automotiva',
    role: 'Técnico Especialista',
    status: 'pendente',
    requestedAt: new Date().toISOString(),
    isAdmin: false,
  });
  saveUsers(users);
  return { success: true, message: 'Solicitação enviada. Aguarde aprovação do administrador.' };
}

export async function authenticateUser(
  email: string,
  password: string
): Promise<{ success: boolean; message: string; user?: AuthUser }> {
  const users = loadUsers();
  const normalized = email.trim().toLowerCase();
  const matched = users.find((u) => u.email === normalized);
  if (!matched) return { success: false, message: 'Usuário não encontrado.' };
  const valid = await verifyPassword(password.trim(), matched.salt, matched.passwordHash);
  if (!valid) return { success: false, message: 'Senha incorreta.' };
  if (matched.status === 'pendente') return { success: false, message: 'Cadastro pendente de aprovação.' };
  if (matched.status === 'recusado') return { success: false, message: 'Acesso recusado. Contate o administrador.' };
  const sessionUser: AuthUser = {
    id: matched.id,
    name: matched.name,
    email: matched.email,
    role: matched.role,
    workshop: matched.workshop,
    isAdmin: matched.isAdmin,
  };
  saveSession(sessionUser);
  return { success: true, message: `Bem-vindo, ${matched.name}!`, user: sessionUser };
}

export function setRequestStatus(userId: string, newStatus: 'aprovado' | 'recusado'): { success: boolean } {
  const users = loadUsers();
  const index = users.findIndex((u) => u.id === userId);
  if (index === -1) return { success: false };
  users[index].status = newStatus;
  users[index].reviewedAt = new Date().toISOString();
  saveUsers(users);
  return { success: true };
}

export function deleteUserRequest(userId: string): boolean {
  saveUsers(loadUsers().filter((u) => u.id !== userId));
  return true;
}

export function logout(): void {
  saveSession(null);
}

export async function migrateFromLegacyIfNeeded(): Promise<void> {
  const legacyKey = 'oficia_system_users';
  const legacyRaw = localStorage.getItem(legacyKey);
  if (!legacyRaw) return;
  try {
    const legacyUsers = JSON.parse(legacyRaw);
    const current = loadUsers();
    for (const old of legacyUsers) {
      if (current.some((u) => u.email === old.email?.toLowerCase())) continue;
      if (!old.password) continue;
      const salt = await generateSalt();
      const passwordHash = await hashPassword(old.password, salt);
      current.push({
        id: old.id || 'migrated-' + Date.now(),
        name: old.name,
        email: old.email.toLowerCase(),
        passwordHash,
        salt,
        workshop: old.workshop,
        role: old.role || 'Técnico Especialista',
        status: old.status || 'aprovado',
        requestedAt: old.requestedAt || new Date().toISOString(),
        isAdmin: old.isAdmin || false,
      });
    }
    saveUsers(current);
    localStorage.removeItem(legacyKey);
  } catch (err) {
    console.error('[HENIZA] Migration failed:', err);
  }
}
