// Centralized Authentication and Access Authorization Service for OficIA

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  password?: string;
  workshop?: string;
  role: 'Administrador' | 'Técnico Especialista' | 'Operador de Oficina';
  status: 'aprovado' | 'pendente' | 'recusado';
  requestedAt: string;
  reviewedAt?: string;
  isAdmin?: boolean;
}

export const ADMIN_CREDENTIALS = {
  email: 'natanaelmessiasdesouza@gmail.com',
  password: '721634@Smn',
  name: 'Natanael Messias (Administrador)',
  role: 'Administrador' as const,
  workshop: 'Diretoria Executiva HENIZA / OficIA',
  isAdmin: true
};

const USERS_STORAGE_KEY = 'oficia_system_users';
const CURRENT_USER_KEY = 'oficia_auth_user';

// Initialize pre-seeded users (Admin + default demo technicians)
export function getStoredUsers(): SystemUser[] {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (raw) {
      const parsed: SystemUser[] = JSON.parse(raw);
      // Ensure admin is always present and updated
      const hasAdmin = parsed.some(u => u.email.toLowerCase() === ADMIN_CREDENTIALS.email.toLowerCase());
      if (!hasAdmin) {
        parsed.unshift({
          id: 'admin-01',
          name: ADMIN_CREDENTIALS.name,
          email: ADMIN_CREDENTIALS.email,
          password: ADMIN_CREDENTIALS.password,
          workshop: ADMIN_CREDENTIALS.workshop,
          role: 'Administrador',
          status: 'aprovado',
          requestedAt: new Date().toISOString(),
          isAdmin: true
        });
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(parsed));
      }
      return parsed;
    }
  } catch (err) {
    console.error('Error reading users from storage:', err);
  }

  // Initial seed
  const initialUsers: SystemUser[] = [
    {
      id: 'admin-01',
      name: ADMIN_CREDENTIALS.name,
      email: ADMIN_CREDENTIALS.email,
      password: ADMIN_CREDENTIALS.password,
      workshop: ADMIN_CREDENTIALS.workshop,
      role: 'Administrador',
      status: 'aprovado',
      requestedAt: new Date().toISOString(),
      isAdmin: true
    },
    {
      id: 'user-demo-01',
      name: 'Carlos Alberto Mecânico',
      email: 'carlos.mecanico@oficia.com.br',
      password: '123',
      workshop: 'Auto Center Paulista',
      role: 'Técnico Especialista',
      status: 'aprovado',
      requestedAt: new Date(Date.now() - 86400000).toISOString(),
      isAdmin: false
    },
    {
      id: 'user-pendente-01',
      name: 'Eduardo Martins',
      email: 'eduardo.martins@autofrota.com.br',
      password: '123',
      workshop: 'Locadora & Frotas Sul',
      role: 'Operador de Oficina',
      status: 'pendente',
      requestedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      isAdmin: false
    }
  ];

  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(initialUsers));
  } catch (e) {
    console.error(e);
  }

  return initialUsers;
}

export function saveUsers(users: SystemUser[]): void {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (err) {
    console.error('Error saving users to storage:', err);
  }
}

// Check current user session
export function getCurrentSession(): SystemUser | null {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveCurrentSession(user: SystemUser | null): void {
  try {
    if (user) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  } catch (err) {
    console.error(err);
  }
}

// Request new registration (pending authorization)
export function requestRegistration(data: {
  name: string;
  email: string;
  password: string;
  workshop?: string;
}): { success: boolean; message: string; user?: SystemUser } {
  const users = getStoredUsers();
  const normalizedEmail = data.email.trim().toLowerCase();

  // Check if admin
  if (normalizedEmail === ADMIN_CREDENTIALS.email.toLowerCase()) {
    return {
      success: false,
      message: 'Este e-mail pertence ao Administrador do Sistema. Por favor, faça login diretamente.'
    };
  }

  const existing = users.find(u => u.email.toLowerCase() === normalizedEmail);
  if (existing) {
    if (existing.status === 'pendente') {
      return {
        success: false,
        message: 'Já existe um pedido de acesso em análise com este e-mail. Aguarde a liberação do administrador.'
      };
    }
    if (existing.status === 'aprovado') {
      return {
        success: false,
        message: 'Este e-mail já possui cadastro aprovado. Realize o login com sua senha.'
      };
    }
    if (existing.status === 'recusado') {
      return {
        success: false,
        message: 'Este cadastro foi recusado anteriormente pelo administrador. Entre em contato para reavaliação.'
      };
    }
  }

  const newUser: SystemUser = {
    id: 'req-' + Date.now(),
    name: data.name.trim(),
    email: normalizedEmail,
    password: data.password.trim(),
    workshop: data.workshop?.trim() || 'Oficina Automotiva',
    role: 'Técnico Especialista',
    status: 'pendente',
    requestedAt: new Date().toISOString(),
    isAdmin: false
  };

  users.push(newUser);
  saveUsers(users);

  return {
    success: true,
    message: 'Solicitação de cadastro registrada com sucesso! O pedido de acesso foi enviado ao Administrador (natanaelmessiasdesouza@gmail.com). Aguarde a autorização para efetuar o login.',
    user: newUser
  };
}

// Authenticate user
export function authenticateUser(email: string, password: string): {
  success: boolean;
  message: string;
  user?: SystemUser;
} {
  const normalizedEmail = email.trim().toLowerCase();
  const pass = password.trim();

  // 1. Direct Admin validation
  if (
    normalizedEmail === ADMIN_CREDENTIALS.email.toLowerCase() &&
    pass === ADMIN_CREDENTIALS.password
  ) {
    const adminUser: SystemUser = {
      id: 'admin-01',
      name: ADMIN_CREDENTIALS.name,
      email: ADMIN_CREDENTIALS.email,
      role: 'Administrador',
      workshop: ADMIN_CREDENTIALS.workshop,
      status: 'aprovado',
      requestedAt: new Date().toISOString(),
      isAdmin: true
    };
    saveCurrentSession(adminUser);
    return {
      success: true,
      message: 'Autenticado com sucesso como Administrador do Sistema OficIA.',
      user: adminUser
    };
  }

  // 2. Check other stored accounts
  const users = getStoredUsers();
  const matched = users.find(u => u.email.toLowerCase() === normalizedEmail);

  if (!matched) {
    return {
      success: false,
      message: 'Usuário não cadastrado. Caso tenha acabado de solicitar, aguarde a aprovação do Administrador.'
    };
  }

  // Password check
  if (matched.password !== pass) {
    return {
      success: false,
      message: 'Senha incorreta. Verifique suas credenciais.'
    };
  }

  // Status check
  if (matched.status === 'pendente') {
    return {
      success: false,
      message: 'Seu cadastro está PENDENTE DE AUTORIZAÇÃO pelo Administrador (natanaelmessiasdesouza@gmail.com). Você será notificado assim que o acesso for liberado.'
    };
  }

  if (matched.status === 'recusado') {
    return {
      success: false,
      message: 'Seu pedido de acesso foi RECUSADO pelo administrador. Contate o suporte para mais informações.'
    };
  }

  // Approved
  saveCurrentSession(matched);
  return {
    success: true,
    message: `Acesso autorizado. Bem-vindo, ${matched.name}!`,
    user: matched
  };
}

// Administrator actions: Approve or Reject
export function setRequestStatus(
  userId: string,
  newStatus: 'aprovado' | 'recusado'
): { success: boolean; user?: SystemUser } {
  const users = getStoredUsers();
  const index = users.findIndex(u => u.id === userId);
  if (index === -1) return { success: false };

  users[index].status = newStatus;
  users[index].reviewedAt = new Date().toISOString();
  saveUsers(users);

  return { success: true, user: users[index] };
}

// Administrator action: Delete user request
export function deleteUserRequest(userId: string): boolean {
  let users = getStoredUsers();
  users = users.filter(u => u.id !== userId);
  saveUsers(users);
  return true;
}

// Count pending requests
export function getPendingCount(): number {
  const users = getStoredUsers();
  return users.filter(u => u.status === 'pendente').length;
}
