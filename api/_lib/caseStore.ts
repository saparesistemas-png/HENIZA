/**
 * OS / cases no Postgres — merge por rev (last-write-wins com detecção de conflito).
 */
import { isPostgresEnabled, query } from './pg';

export type StoredCase = {
  id: string;
  plate?: string;
  chassis?: string;
  make?: string;
  model?: string;
  currentStage?: string;
  rev: number;
  snapshot: unknown;
  deviceId?: string;
  syncedAt: string;
  updatedAt: string;
};

declare global {
  // eslint-disable-next-line no-var
  var __henizaCases: Map<string, StoredCase> | undefined;
  // eslint-disable-next-line no-var
  var __henizaCaseSchemaReady: boolean | undefined;
}

function mem(): Map<string, StoredCase> {
  if (!global.__henizaCases) global.__henizaCases = new Map();
  return global.__henizaCases;
}

async function ensureSchema(): Promise<void> {
  if (!isPostgresEnabled() || global.__henizaCaseSchemaReady) return;
  await query(`
    CREATE TABLE IF NOT EXISTS heniza_cases (
      id            TEXT PRIMARY KEY,
      plate         TEXT,
      chassis       TEXT,
      make          TEXT,
      model         TEXT,
      current_stage TEXT,
      rev           INTEGER NOT NULL DEFAULT 1,
      snapshot      JSONB,
      device_id     TEXT,
      synced_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_heniza_cases_plate ON heniza_cases (plate);
    CREATE INDEX IF NOT EXISTS idx_heniza_cases_updated ON heniza_cases (updated_at DESC);
  `);
  global.__henizaCaseSchemaReady = true;
}

function fromDb(r: Record<string, unknown>): StoredCase {
  let snapshot = r.snapshot;
  if (typeof snapshot === 'string') {
    try {
      snapshot = JSON.parse(snapshot);
    } catch {
      /* */
    }
  }
  return {
    id: String(r.id),
    plate: r.plate ? String(r.plate) : undefined,
    chassis: r.chassis ? String(r.chassis) : undefined,
    make: r.make ? String(r.make) : undefined,
    model: r.model ? String(r.model) : undefined,
    currentStage: r.current_stage ? String(r.current_stage) : undefined,
    rev: Number(r.rev || 1),
    snapshot,
    deviceId: r.device_id ? String(r.device_id) : undefined,
    syncedAt: new Date(r.synced_at as string).toISOString(),
    updatedAt: new Date(r.updated_at as string).toISOString(),
  };
}

export type UpsertResult = {
  ok: boolean;
  conflict?: boolean;
  case: StoredCase;
  serverRev: number;
};

export async function upsertCase(input: {
  id: string;
  plate?: string;
  chassis?: string;
  make?: string;
  model?: string;
  currentStage?: string;
  rev?: number;
  snapshot: unknown;
  deviceId?: string;
}): Promise<UpsertResult> {
  const now = new Date().toISOString();
  const clientRev = input.rev ?? 1;

  if (isPostgresEnabled()) {
    await ensureSchema();
    const existing = await query(`SELECT * FROM heniza_cases WHERE id = $1`, [input.id]);
    const prev = existing?.rows?.[0]
      ? fromDb(existing.rows[0] as Record<string, unknown>)
      : null;

    if (prev && clientRev < prev.rev) {
      return { ok: false, conflict: true, case: prev, serverRev: prev.rev };
    }

    const nextRev = prev ? Math.max(prev.rev, clientRev) + (clientRev >= prev.rev ? 0 : 0) : clientRev;
    // Aceita se clientRev >= serverRev; grava clientRev se maior, senão server+1
    const revToStore = prev
      ? clientRev > prev.rev
        ? clientRev
        : clientRev === prev.rev
          ? prev.rev + 1
          : prev.rev
      : clientRev;

    if (prev && clientRev < prev.rev) {
      return { ok: false, conflict: true, case: prev, serverRev: prev.rev };
    }

    const res = await query(
      `INSERT INTO heniza_cases (
        id, plate, chassis, make, model, current_stage, rev, snapshot, device_id, synced_at, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10,$11)
      ON CONFLICT (id) DO UPDATE SET
        plate = EXCLUDED.plate,
        chassis = EXCLUDED.chassis,
        make = EXCLUDED.make,
        model = EXCLUDED.model,
        current_stage = EXCLUDED.current_stage,
        rev = EXCLUDED.rev,
        snapshot = EXCLUDED.snapshot,
        device_id = EXCLUDED.device_id,
        synced_at = EXCLUDED.synced_at,
        updated_at = EXCLUDED.updated_at
      RETURNING *`,
      [
        input.id,
        input.plate || null,
        input.chassis || null,
        input.make || null,
        input.model || null,
        input.currentStage || null,
        revToStore,
        JSON.stringify(input.snapshot),
        input.deviceId || null,
        now,
        now,
      ]
    );
    const stored = res?.rows?.[0]
      ? fromDb(res.rows[0] as Record<string, unknown>)
      : {
          id: input.id,
          plate: input.plate,
          chassis: input.chassis,
          make: input.make,
          model: input.model,
          currentStage: input.currentStage,
          rev: revToStore,
          snapshot: input.snapshot,
          deviceId: input.deviceId,
          syncedAt: now,
          updatedAt: now,
        };
    return { ok: true, case: stored, serverRev: stored.rev };
  }

  const prev = mem().get(input.id);
  if (prev && clientRev < prev.rev) {
    return { ok: false, conflict: true, case: prev, serverRev: prev.rev };
  }
  const revToStore = prev
    ? clientRev > prev.rev
      ? clientRev
      : prev.rev + 1
    : clientRev;
  const stored: StoredCase = {
    id: input.id,
    plate: input.plate,
    chassis: input.chassis,
    make: input.make,
    model: input.model,
    currentStage: input.currentStage,
    rev: revToStore,
    snapshot: input.snapshot,
    deviceId: input.deviceId,
    syncedAt: now,
    updatedAt: now,
  };
  mem().set(input.id, stored);
  return { ok: true, case: stored, serverRev: stored.rev };
}

export async function getCase(id: string): Promise<StoredCase | null> {
  if (isPostgresEnabled()) {
    await ensureSchema();
    const res = await query(`SELECT * FROM heniza_cases WHERE id = $1`, [id]);
    if (res?.rows?.[0]) return fromDb(res.rows[0] as Record<string, unknown>);
  }
  return mem().get(id) || null;
}

export async function listCasesSince(since?: string, limit = 50): Promise<StoredCase[]> {
  if (isPostgresEnabled()) {
    await ensureSchema();
    if (since) {
      const res = await query(
        `SELECT * FROM heniza_cases WHERE updated_at > $1 ORDER BY updated_at DESC LIMIT $2`,
        [since, limit]
      );
      return (res?.rows || []).map((r) => fromDb(r as Record<string, unknown>));
    }
    const res = await query(
      `SELECT * FROM heniza_cases ORDER BY updated_at DESC LIMIT $1`,
      [limit]
    );
    return (res?.rows || []).map((r) => fromDb(r as Record<string, unknown>));
  }
  return Array.from(mem().values())
    .filter((c) => !since || c.updatedAt > since)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, limit);
}

export async function caseCount(): Promise<number> {
  if (isPostgresEnabled()) {
    await ensureSchema();
    const res = await query(`SELECT COUNT(*)::int AS c FROM heniza_cases`);
    return Number(res?.rows?.[0]?.c || 0);
  }
  return mem().size;
}
