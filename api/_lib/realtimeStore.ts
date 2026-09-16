/**
 * Feed em tempo real — Postgres se DATABASE_URL, senão memória.
 */
import { isPostgresEnabled, query } from './pg';

export type FeedEvent = {
  id: string;
  type: 'diagnosis' | 'case' | 'photo' | 'approval' | 'system' | string;
  workshopId?: string;
  plate?: string;
  chassis?: string;
  vehicleId?: string;
  caseId?: string;
  title: string;
  body?: string;
  codes?: string[];
  odometerKm?: number;
  authorId?: string;
  authorName?: string;
  at: string;
  payload?: unknown;
};

declare global {
  // eslint-disable-next-line no-var
  var __henizaFeed: FeedEvent[] | undefined;
  // eslint-disable-next-line no-var
  var __henizaFeedSchemaReady: boolean | undefined;
}

function mem(): FeedEvent[] {
  if (!global.__henizaFeed) global.__henizaFeed = [];
  return global.__henizaFeed;
}

async function ensureFeedSchema(): Promise<void> {
  if (!isPostgresEnabled() || global.__henizaFeedSchemaReady) return;
  await query(`
    CREATE TABLE IF NOT EXISTS heniza_feed (
      id           TEXT PRIMARY KEY,
      type         TEXT NOT NULL,
      workshop_id  TEXT,
      plate        TEXT,
      chassis      TEXT,
      vehicle_id   TEXT,
      case_id      TEXT,
      title        TEXT NOT NULL,
      body         TEXT,
      codes        JSONB,
      odometer_km  DOUBLE PRECISION,
      author_id    TEXT,
      author_name  TEXT,
      at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      payload      JSONB
    );
    CREATE INDEX IF NOT EXISTS idx_heniza_feed_at ON heniza_feed (at DESC);
    CREATE INDEX IF NOT EXISTS idx_heniza_feed_plate ON heniza_feed (plate);
  `);
  global.__henizaFeedSchemaReady = true;
}

function fromDb(r: Record<string, unknown>): FeedEvent {
  let codes = r.codes as string[] | undefined;
  if (typeof codes === 'string') {
    try {
      codes = JSON.parse(codes);
    } catch {
      codes = [];
    }
  }
  let payload = r.payload;
  if (typeof payload === 'string') {
    try {
      payload = JSON.parse(payload);
    } catch {
      /* */
    }
  }
  return {
    id: String(r.id),
    type: String(r.type),
    workshopId: r.workshop_id ? String(r.workshop_id) : undefined,
    plate: r.plate ? String(r.plate) : undefined,
    chassis: r.chassis ? String(r.chassis) : undefined,
    vehicleId: r.vehicle_id ? String(r.vehicle_id) : undefined,
    caseId: r.case_id ? String(r.case_id) : undefined,
    title: String(r.title || ''),
    body: r.body ? String(r.body) : undefined,
    codes,
    odometerKm: r.odometer_km != null ? Number(r.odometer_km) : undefined,
    authorId: r.author_id ? String(r.author_id) : undefined,
    authorName: r.author_name ? String(r.author_name) : undefined,
    at: new Date(r.at as string).toISOString(),
    payload,
  };
}

export async function publishFeedEvent(
  evt: Omit<FeedEvent, 'id' | 'at'> & { id?: string; at?: string }
): Promise<FeedEvent> {
  const full: FeedEvent = {
    ...evt,
    id: evt.id || `feed-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    at: evt.at || new Date().toISOString(),
  };

  if (isPostgresEnabled()) {
    try {
      await ensureFeedSchema();
      await query(
        `INSERT INTO heniza_feed (
          id, type, workshop_id, plate, chassis, vehicle_id, case_id,
          title, body, codes, odometer_km, author_id, author_name, at, payload
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11,$12,$13,$14,$15::jsonb)
        ON CONFLICT (id) DO NOTHING`,
        [
          full.id,
          full.type,
          full.workshopId || null,
          full.plate || null,
          full.chassis || null,
          full.vehicleId || null,
          full.caseId || null,
          full.title,
          full.body || null,
          JSON.stringify(full.codes || []),
          full.odometerKm ?? null,
          full.authorId || null,
          full.authorName || null,
          full.at,
          JSON.stringify(full.payload ?? null),
        ]
      );
      return full;
    } catch {
      /* fallback memória */
    }
  }

  const s = mem();
  s.unshift(full);
  if (s.length > 500) s.length = 500;
  return full;
}

export async function listFeedSince(opts: {
  since?: string;
  plate?: string;
  chassis?: string;
  workshopId?: string;
  limit?: number;
}): Promise<FeedEvent[]> {
  const limit = opts.limit ?? 50;

  if (isPostgresEnabled()) {
    try {
      await ensureFeedSchema();
      const clauses: string[] = [];
      const params: unknown[] = [];
      let i = 1;
      if (opts.since) {
        clauses.push(`at > $${i++}`);
        params.push(opts.since);
      }
      if (opts.plate) {
        clauses.push(`plate = $${i++}`);
        params.push(opts.plate.toUpperCase());
      }
      if (opts.chassis) {
        clauses.push(`chassis = $${i++}`);
        params.push(opts.chassis.toUpperCase());
      }
      if (opts.workshopId) {
        clauses.push(`workshop_id = $${i++}`);
        params.push(opts.workshopId);
      }
      const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
      params.push(limit);
      const res = await query(
        `SELECT * FROM heniza_feed ${where} ORDER BY at DESC LIMIT $${i}`,
        params
      );
      if (res?.rows) return res.rows.map((r) => fromDb(r as Record<string, unknown>));
    } catch {
      /* memory */
    }
  }

  const sinceTs = opts.since ? Date.parse(opts.since) : 0;
  return mem()
    .filter((e) => {
      if (sinceTs && Date.parse(e.at) <= sinceTs) return false;
      if (opts.plate && e.plate && e.plate !== opts.plate.toUpperCase()) return false;
      if (opts.chassis && e.chassis && e.chassis !== opts.chassis.toUpperCase()) return false;
      if (opts.workshopId && e.workshopId && e.workshopId !== opts.workshopId) return false;
      return true;
    })
    .slice(0, limit);
}
