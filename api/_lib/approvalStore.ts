/**
 * Store de pedidos de aprovação (warm instance).
 * Produção multi-região: Postgres/Redis.
 */

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'expired';

export type ApprovalRequest = {
  id: string;
  token: string;
  caseId?: string;
  plate: string;
  chassis?: string;
  vehicleLabel: string;
  workshop?: string;
  problemName?: string;
  diagnosticNotes?: string;
  budgetTotal?: number;
  budgetItems?: Array<{ item: string; category?: string; estimatedCost: number }>;
  status: ApprovalStatus;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  decidedBy?: string;
  decisionNote?: string;
  requesterName?: string;
};

declare global {
  // eslint-disable-next-line no-var
  var __henizaApprovals: Map<string, ApprovalRequest> | undefined;
  // eslint-disable-next-line no-var
  var __henizaApprovalByToken: Map<string, string> | undefined;
}

function byId(): Map<string, ApprovalRequest> {
  if (!global.__henizaApprovals) global.__henizaApprovals = new Map();
  return global.__henizaApprovals;
}

function byToken(): Map<string, string> {
  if (!global.__henizaApprovalByToken) global.__henizaApprovalByToken = new Map();
  return global.__henizaApprovalByToken;
}

function token(): string {
  const a = Math.random().toString(36).slice(2, 10);
  const b = Math.random().toString(36).slice(2, 10);
  return `${a}${b}`;
}

export function createApproval(
  input: Omit<
    ApprovalRequest,
    'id' | 'token' | 'status' | 'createdAt' | 'updatedAt' | 'expiresAt'
  > &
    { ttlHours?: number }
): ApprovalRequest {
  const now = new Date();
  const ttl = (input.ttlHours ?? 72) * 3600 * 1000;
  const id = `apv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const tok = token();
  const row: ApprovalRequest = {
    ...input,
    id,
    token: tok,
    status: 'pending',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + ttl).toISOString(),
  };
  byId().set(id, row);
  byToken().set(tok, id);
  return row;
}

export function getByToken(tok: string): ApprovalRequest | null {
  const id = byToken().get(tok);
  if (!id) return null;
  const row = byId().get(id) || null;
  if (!row) return null;
  if (row.status === 'pending' && Date.parse(row.expiresAt) < Date.now()) {
    row.status = 'expired';
    row.updatedAt = new Date().toISOString();
    byId().set(row.id, row);
  }
  return row;
}

export function getById(id: string): ApprovalRequest | null {
  return byId().get(id) || null;
}

export function decide(
  tok: string,
  decision: 'approved' | 'rejected',
  note?: string,
  decidedBy?: string
): ApprovalRequest | null {
  const row = getByToken(tok);
  if (!row || row.status !== 'pending') return row;
  row.status = decision;
  row.decisionNote = note?.slice(0, 500);
  row.decidedBy = decidedBy?.slice(0, 120) || 'locadora';
  row.updatedAt = new Date().toISOString();
  byId().set(row.id, row);
  return row;
}

export function listRecent(limit = 40): ApprovalRequest[] {
  return Array.from(byId().values())
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}
