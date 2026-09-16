/**
 * Cliente — pedidos de aprovação locadora/seguradora.
 */
import { authHeaders } from './onlineSession';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'expired';

export type ApprovalItem = {
  id: string;
  token: string;
  plate: string;
  status: ApprovalStatus;
  problemName?: string;
  budgetTotal?: number;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  decidedBy?: string;
  decisionNote?: string;
};

const LOCAL_KEY = 'heniza_approvals_local_v1';

function loadLocal(): Array<ApprovalItem & { url?: string }> {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveLocal(rows: Array<ApprovalItem & { url?: string }>) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(rows.slice(0, 40)));
}

export async function createApprovalRequest(input: {
  caseId?: string;
  plate: string;
  chassis?: string;
  vehicleLabel: string;
  problemName?: string;
  diagnosticNotes?: string;
  budgetTotal?: number;
  budgetItems?: Array<{ item: string; category?: string; estimatedCost: number }>;
  requesterName?: string;
}): Promise<{ ok: boolean; url?: string; item?: ApprovalItem; error?: string }> {
  try {
    const res = await fetch('/api/approval', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ action: 'create', ...input }),
    });
    const json = await res.json();
    if (!json?.ok) return { ok: false, error: json?.error || 'Falha ao criar' };
    const local = loadLocal();
    local.unshift({ ...json.item, url: json.url });
    saveLocal(local);
    return { ok: true, url: json.url, item: json.item };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'offline' };
  }
}

export async function refreshApproval(id: string): Promise<ApprovalItem | null> {
  try {
    const res = await fetch(`/api/approval?id=${encodeURIComponent(id)}`, {
      headers: authHeaders(),
    });
    const json = await res.json();
    if (!json?.ok || !json.item) return null;
    const local = loadLocal();
    const idx = local.findIndex((x) => x.id === id);
    if (idx >= 0) {
      local[idx] = { ...local[idx], ...json.item };
      saveLocal(local);
    }
    return json.item;
  } catch {
    return null;
  }
}

export function listLocalApprovals() {
  return loadLocal();
}

export function whatsappApprovalLink(url: string, plate: string, total?: number): string {
  const text = [
    'OficIA / HENIZA — pedido de aprovação de serviço',
    `Placa: ${plate}`,
    total != null ? `Total estimado: R$ ${total.toFixed(2)}` : '',
    '',
    'Abrir e aprovar/recusar:',
    url,
  ]
    .filter(Boolean)
    .join('\n');
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
