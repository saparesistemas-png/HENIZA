/**
 * Store de pedidos de aprovação.
 * - Com DATABASE_URL / POSTGRES_URL → Postgres
 * - Sem URL → memória (dev / fallback)
 */
import { isPostgresEnabled, query } from './pg';

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
  // eslint-disable-next-line no-var
  var __henizaApprovalSchemaReady: boolean | undefined;
}

function byId(): Map<string, ApprovalRequest> {
  if (!global.__henizaApprovals) global.__henizaApprovals = new Map();
  return global.__henizaApprovals;
}

function byToken(): Map<string, string> {
  if (!global.__henizaApprovalByToken) global.__henizaApprovalByToken = new Map();
  return global.__henizaApprovalByToken;
}

function newToken(): string {
  const a = Math.random().toString(36).slice(2, 10);
  const b = Math.random().toString(36).slice(2, 10);
  return `${a}${b}`;
}

function newId(): string {
  return `apv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function rowFromDb(r: Record<string, unknown>): ApprovalRequest {
  let budgetItems = r.budget_items as ApprovalRequest['budgetItems'];
  if (typeof budgetItems === 'string') {
    try {
      budgetItems = JSON.parse(budgetItems);
    } catch {
      budgetItems = [];
    }
  }
  return {
    id: String(r.id),
    token: String(r.token),
    caseId: r.case_id ? String(r.case_id) : undefined,
    plate: String(r.plate),
    chassis: r.chassis ? String(r.chassis) : undefined,
    vehicleLabel: String(r.vehicle_label || ''),
    workshop: r.workshop ? String(r.workshop) : undefined,
    problemName: r.problem_name ? String(r.problem_name) : undefined,
    diagnosticNotes: r.diagnostic_notes ? String(r.diagnostic_notes) : undefined,
    budgetTotal: r.budget_total != null ? Number(r.budget_total) : undefined,
    budgetItems: budgetItems || undefined,
    status: String(r.status) as ApprovalStatus,
    createdAt: new Date(r.created_at as string).toISOString(),
    updatedAt: new Date(r.updated_at as string).toISOString(),
    expiresAt: new Date(r.expires_at as string).toISOString(),
    decidedBy: r.decided_by ? String(r.decided_by) : undefined,
    decisionNote: r.decision_note ? String(r.decision_note) : undefined,
    requesterName: r.requester_name ? String(r.requester_name) : undefined,
  };
}

export async function ensureApprovalSchema(): Promise<boolean> {
  if (!isPostgresEnabled()) return false;
  if (global.__henizaApprovalSchemaReady) return true;
  const res = await query(`
    CREATE TABLE IF NOT EXISTS heniza_approvals (
      id              TEXT PRIMARY KEY,
      token           TEXT NOT NULL UNIQUE,
      case_id         TEXT,
      plate           TEXT NOT NULL,
      chassis         TEXT,
      vehicle_label   TEXT NOT NULL DEFAULT '',
      workshop        TEXT,
      problem_name    TEXT,
      diagnostic_notes TEXT,
      budget_total    DOUBLE PRECISION,
      budget_items    JSONB,
      status          TEXT NOT NULL DEFAULT 'pending',
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expires_at      TIMESTAMPTZ NOT NULL,
      decided_by      TEXT,
      decision_note   TEXT,
      requester_name  TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_heniza_approvals_token ON heniza_approvals (token);
    CREATE INDEX IF NOT EXISTS idx_heniza_approvals_plate ON heniza_approvals (plate);
    CREATE INDEX IF NOT EXISTS idx_heniza_approvals_status ON heniza_approvals (status);
  `);
  if (res) global.__henizaApprovalSchemaReady = true;
  return Boolean(res);
}

function expireIfNeeded(row: ApprovalRequest): ApprovalRequest {
  if (row.status === 'pending' && Date.parse(row.expiresAt) < Date.now()) {
    return { ...row, status: 'expired', updatedAt: new Date().toISOString() };
  }
  return row;
}

export async function createApproval(
  input: Omit<
    ApprovalRequest,
    'id' | 'token' | 'status' | 'createdAt' | 'updatedAt' | 'expiresAt'
  > & { ttlHours?: number }
): Promise<ApprovalRequest> {
  const now = new Date();
  const ttl = (input.ttlHours ?? 72) * 3600 * 1000;
  const row: ApprovalRequest = {
    ...input,
    id: newId(),
    token: newToken(),
    status: 'pending',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + ttl).toISOString(),
  };

  if (isPostgresEnabled()) {
    await ensureApprovalSchema();
    const res = await query(
      `INSERT INTO heniza_approvals (
        id, token, case_id, plate, chassis, vehicle_label, workshop,
        problem_name, diagnostic_notes, budget_total, budget_items,
        status, created_at, updated_at, expires_at, requester_name
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12,$13,$14,$15,$16
      ) RETURNING *`,
      [
        row.id,
        row.token,
        row.caseId || null,
        row.plate,
        row.chassis || null,
        row.vehicleLabel,
        row.workshop || null,
        row.problemName || null,
        row.diagnosticNotes || null,
        row.budgetTotal ?? null,
        JSON.stringify(row.budgetItems || []),
        row.status,
        row.createdAt,
        row.updatedAt,
        row.expiresAt,
        row.requesterName || null,
      ]
    );
    if (res?.rows?.[0]) return rowFromDb(res.rows[0] as Record<string, unknown>);
  }

  byId().set(row.id, row);
  byToken().set(row.token, row.id);
  return row;
}

export async function getByToken(tok: string): Promise<ApprovalRequest | null> {
  if (isPostgresEnabled()) {
    await ensureApprovalSchema();
    const res = await query(`SELECT * FROM heniza_approvals WHERE token = $1 LIMIT 1`, [tok]);
    if (res?.rows?.[0]) {
      let row = rowFromDb(res.rows[0] as Record<string, unknown>);
      const next = expireIfNeeded(row);
      if (next.status === 'expired' && row.status === 'pending') {
        await query(
          `UPDATE heniza_approvals SET status = 'expired', updated_at = NOW() WHERE id = $1`,
          [row.id]
        );
        row = next;
      }
      return row;
    }
  }

  const id = byToken().get(tok);
  if (!id) return null;
  const row = byId().get(id);
  if (!row) return null;
  const next = expireIfNeeded(row);
  if (next !== row) byId().set(next.id, next);
  return next;
}

export async function getById(id: string): Promise<ApprovalRequest | null> {
  if (isPostgresEnabled()) {
    await ensureApprovalSchema();
    const res = await query(`SELECT * FROM heniza_approvals WHERE id = $1 LIMIT 1`, [id]);
    if (res?.rows?.[0]) {
      return expireIfNeeded(rowFromDb(res.rows[0] as Record<string, unknown>));
    }
  }
  const row = byId().get(id);
  return row ? expireIfNeeded(row) : null;
}

export async function decide(
  tok: string,
  decision: 'approved' | 'rejected',
  note?: string,
  decidedBy?: string
): Promise<ApprovalRequest | null> {
  const current = await getByToken(tok);
  if (!current || current.status !== 'pending') return current;

  const updated: ApprovalRequest = {
    ...current,
    status: decision,
    decisionNote: note?.slice(0, 500),
    decidedBy: decidedBy?.slice(0, 120) || 'locadora',
    updatedAt: new Date().toISOString(),
  };

  if (isPostgresEnabled()) {
    const res = await query(
      `UPDATE heniza_approvals
       SET status = $1, decision_note = $2, decided_by = $3, updated_at = $4
       WHERE token = $5 AND status = 'pending'
       RETURNING *`,
      [
        updated.status,
        updated.decisionNote || null,
        updated.decidedBy || null,
        updated.updatedAt,
        tok,
      ]
    );
    if (res?.rows?.[0]) return rowFromDb(res.rows[0] as Record<string, unknown>);
  }

  byId().set(updated.id, updated);
  return updated;
}

export async function listRecent(limit = 40): Promise<ApprovalRequest[]> {
  if (isPostgresEnabled()) {
    await ensureApprovalSchema();
    const res = await query(
      `SELECT * FROM heniza_approvals ORDER BY created_at DESC LIMIT $1`,
      [limit]
    );
    if (res?.rows) {
      return res.rows.map((r) => expireIfNeeded(rowFromDb(r as Record<string, unknown>)));
    }
  }
  return Array.from(byId().values())
    .map(expireIfNeeded)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}

export async function healthPostgres(): Promise<{ ok: boolean; mode: string; error?: string }> {
  if (!isPostgresEnabled()) return { ok: true, mode: 'memory' };
  try {
    await ensureApprovalSchema();
    const res = await query(`SELECT COUNT(*)::int AS c FROM heniza_approvals`);
    return { ok: true, mode: 'postgres', error: res ? undefined : 'query null' };
  } catch (e: any) {
    return { ok: false, mode: 'postgres', error: e?.message || 'pg error' };
  }
}
