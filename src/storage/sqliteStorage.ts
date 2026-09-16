/**
 * StoragePort sobre sql.js (SQLite WASM) + OPFS.
 */
import type {
  OutboxItem,
  LocalCaseRow,
  LocalPhotoMeta,
  VehicleProfileRow,
  DiagnosisEventRow,
  PidBaselineRow,
} from '../db/henizaDb';
import type { EnqueueInput, StoragePort } from './StoragePort';
import { SQLITE_SCHEMA } from './sqliteSchema';
import { loadSqliteBytes, saveSqliteBytes } from './sqlitePersist';

type SqlJsDatabase = import('sql.js').Database;

const DEFAULT_MAX_ATTEMPTS = 8;

function uuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `obx-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function json(v: unknown): string {
  return JSON.stringify(v ?? null);
}

function parseJson<T>(s: unknown, fallback: T): T {
  if (s == null || s === '') return fallback;
  try {
    return JSON.parse(String(s)) as T;
  } catch {
    return fallback;
  }
}

export class SqliteStorage implements StoragePort {
  readonly backend = 'sqlite' as const;

  private db: SqlJsDatabase | null = null;
  private ready: Promise<void>;
  private persistTimer: ReturnType<typeof setTimeout> | null = null;
  private dirty = false;

  constructor() {
    this.ready = this.init();
  }

  private async init(): Promise<void> {
    const initSqlJs = (await import('sql.js')).default;
    const SQL = await initSqlJs({
      locateFile: (file: string) =>
        `https://cdn.jsdelivr.net/npm/sql.js@1.12.0/dist/${file}`,
    });

    const bytes = await loadSqliteBytes();
    this.db = bytes ? new SQL.Database(bytes) : new SQL.Database();
    this.db.run(SQLITE_SCHEMA);
  }

  private async ensure(): Promise<SqlJsDatabase> {
    await this.ready;
    if (!this.db) throw new Error('SQLite não inicializado');
    return this.db;
  }

  private schedulePersist() {
    this.dirty = true;
    if (this.persistTimer) clearTimeout(this.persistTimer);
    this.persistTimer = setTimeout(() => {
      void this.persistNow();
    }, 400);
  }

  private async persistNow() {
    if (!this.db || !this.dirty) return;
    try {
      const data = this.db.export();
      await saveSqliteBytes(data);
      this.dirty = false;
    } catch (e) {
      console.warn('[SqliteStorage] falha ao persistir OPFS', e);
    }
  }

  private run(sql: string, params: unknown[] = []) {
    if (!this.db) throw new Error('no db');
    this.db.run(sql, params as any[]);
    this.schedulePersist();
  }

  private all(sql: string, params: unknown[] = []): Record<string, unknown>[] {
    if (!this.db) return [];
    const stmt = this.db.prepare(sql);
    stmt.bind(params as any[]);
    const rows: Record<string, unknown>[] = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject() as Record<string, unknown>);
    }
    stmt.free();
    return rows;
  }

  private one(sql: string, params: unknown[] = []): Record<string, unknown> | undefined {
    return this.all(sql, params)[0];
  }

  async getDeviceId(): Promise<string> {
    const existing = await this.getMeta('deviceId');
    if (existing) return existing;
    const id =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `dev-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    await this.setMeta('deviceId', id);
    return id;
  }

  async getMeta(key: string): Promise<string | null> {
    await this.ensure();
    const row = this.one(`SELECT value FROM sync_meta WHERE key = ?`, [key]);
    return row?.value != null ? String(row.value) : null;
  }

  async setMeta(key: string, value: string): Promise<void> {
    await this.ensure();
    this.run(
      `INSERT INTO sync_meta (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      [key, value]
    );
  }

  async enqueue(input: EnqueueInput): Promise<OutboxItem> {
    await this.ensure();
    const now = new Date().toISOString();
    const idempotencyKey =
      input.idempotencyKey ||
      `${input.type}:${input.caseId || 'na'}:${JSON.stringify(input.payload).slice(0, 80)}`;

    const existing = this.one(
      `SELECT * FROM outbox WHERE idempotency_key = ? AND status IN ('pending','in_flight') LIMIT 1`,
      [idempotencyKey]
    );
    if (existing) {
      const item = this.mapOutbox(existing);
      item.payload = input.payload;
      item.updatedAt = now;
      item.status = 'pending';
      item.nextRetryAt = Date.now();
      await this.putOutbox(item);
      return item;
    }

    const item: OutboxItem = {
      id: uuid(),
      type: input.type,
      idempotencyKey,
      payload: input.payload,
      status: 'pending',
      attempts: 0,
      maxAttempts: input.maxAttempts ?? DEFAULT_MAX_ATTEMPTS,
      nextRetryAt: Date.now(),
      caseId: input.caseId,
      createdAt: now,
      updatedAt: now,
    };
    await this.putOutbox(item);
    return item;
  }

  private mapOutbox(r: Record<string, unknown>): OutboxItem {
    return {
      id: String(r.id),
      type: r.type as OutboxItem['type'],
      idempotencyKey: String(r.idempotency_key),
      payload: parseJson(r.payload_json, {}),
      status: r.status as OutboxItem['status'],
      attempts: Number(r.attempts || 0),
      maxAttempts: Number(r.max_attempts || 8),
      nextRetryAt: Number(r.next_retry_at || 0),
      lastError: r.last_error ? String(r.last_error) : undefined,
      caseId: r.case_id ? String(r.case_id) : undefined,
      createdAt: String(r.created_at),
      updatedAt: String(r.updated_at),
    };
  }

  async listPendingOutbox(limit = 50): Promise<OutboxItem[]> {
    await this.ensure();
    const now = Date.now();
    const rows = this.all(
      `SELECT * FROM outbox
       WHERE status IN ('pending','failed') AND next_retry_at <= ?
       ORDER BY created_at ASC LIMIT ?`,
      [now, limit]
    );
    return rows.map((r) => this.mapOutbox(r));
  }

  async countPendingOutbox(): Promise<number> {
    await this.ensure();
    const row = this.one(
      `SELECT COUNT(*) AS c FROM outbox WHERE status IN ('pending','in_flight','failed')`
    );
    return Number(row?.c || 0);
  }

  async getOutbox(id: string): Promise<OutboxItem | undefined> {
    await this.ensure();
    const row = this.one(`SELECT * FROM outbox WHERE id = ?`, [id]);
    return row ? this.mapOutbox(row) : undefined;
  }

  async putOutbox(item: OutboxItem): Promise<void> {
    await this.ensure();
    this.run(
      `INSERT INTO outbox (
        id, type, idempotency_key, payload_json, status, attempts, max_attempts,
        next_retry_at, last_error, case_id, created_at, updated_at
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
      ON CONFLICT(id) DO UPDATE SET
        type=excluded.type, idempotency_key=excluded.idempotency_key,
        payload_json=excluded.payload_json, status=excluded.status,
        attempts=excluded.attempts, max_attempts=excluded.max_attempts,
        next_retry_at=excluded.next_retry_at, last_error=excluded.last_error,
        case_id=excluded.case_id, updated_at=excluded.updated_at`,
      [
        item.id,
        item.type,
        item.idempotencyKey,
        json(item.payload),
        item.status,
        item.attempts,
        item.maxAttempts,
        item.nextRetryAt,
        item.lastError || null,
        item.caseId || null,
        item.createdAt,
        item.updatedAt,
      ]
    );
  }

  async updateOutbox(id: string, patch: Partial<OutboxItem>): Promise<void> {
    const cur = await this.getOutbox(id);
    if (!cur) return;
    await this.putOutbox({
      ...cur,
      ...patch,
      updatedAt: new Date().toISOString(),
    });
  }

  async deleteOutbox(ids: string[]): Promise<void> {
    await this.ensure();
    for (const id of ids) {
      this.run(`DELETE FROM outbox WHERE id = ?`, [id]);
    }
  }

  async listOutboxRecent(limit = 40): Promise<OutboxItem[]> {
    await this.ensure();
    return this.all(`SELECT * FROM outbox ORDER BY created_at DESC LIMIT ?`, [limit]).map((r) =>
      this.mapOutbox(r)
    );
  }

  private mapCase(r: Record<string, unknown>): LocalCaseRow {
    return {
      id: String(r.id),
      plate: String(r.plate || ''),
      chassis: String(r.chassis || ''),
      make: String(r.make || ''),
      model: String(r.model || ''),
      currentStage: String(r.current_stage || 'entrada'),
      snapshot: parseJson(r.snapshot_json, {}),
      rev: Number(r.rev || 1),
      updatedAt: String(r.updated_at),
      createdAt: String(r.created_at),
      syncStatus: (r.sync_status as LocalCaseRow['syncStatus']) || 'local',
    };
  }

  async getCase(id: string): Promise<LocalCaseRow | undefined> {
    await this.ensure();
    const row = this.one(`SELECT * FROM cases WHERE id = ?`, [id]);
    return row ? this.mapCase(row) : undefined;
  }

  async putCase(row: LocalCaseRow): Promise<void> {
    await this.ensure();
    this.run(
      `INSERT INTO cases (
        id, plate, chassis, make, model, current_stage, snapshot_json, rev,
        updated_at, created_at, sync_status
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?)
      ON CONFLICT(id) DO UPDATE SET
        plate=excluded.plate, chassis=excluded.chassis, make=excluded.make,
        model=excluded.model, current_stage=excluded.current_stage,
        snapshot_json=excluded.snapshot_json, rev=excluded.rev,
        updated_at=excluded.updated_at, sync_status=excluded.sync_status`,
      [
        row.id,
        row.plate,
        row.chassis,
        row.make,
        row.model,
        row.currentStage,
        json(row.snapshot),
        row.rev,
        row.updatedAt,
        row.createdAt,
        row.syncStatus,
      ]
    );
  }

  async updateCase(id: string, patch: Partial<LocalCaseRow>): Promise<void> {
    const cur = await this.getCase(id);
    if (!cur) return;
    await this.putCase({ ...cur, ...patch });
  }

  async listCases(): Promise<LocalCaseRow[]> {
    await this.ensure();
    return this.all(`SELECT * FROM cases ORDER BY updated_at DESC`).map((r) => this.mapCase(r));
  }

  private mapPhoto(r: Record<string, unknown>): LocalPhotoMeta {
    return {
      id: String(r.id),
      caseId: String(r.case_id),
      stage: String(r.stage),
      slotId: String(r.slot_id),
      dataUrl: r.data_url ? String(r.data_url) : undefined,
      hash: r.hash ? String(r.hash) : undefined,
      validationOk: Boolean(r.validation_ok),
      width: r.width != null ? Number(r.width) : undefined,
      height: r.height != null ? Number(r.height) : undefined,
      createdAt: String(r.created_at),
      uploaded: Boolean(r.uploaded),
    };
  }

  async getPhoto(id: string): Promise<LocalPhotoMeta | undefined> {
    await this.ensure();
    const row = this.one(`SELECT * FROM photos WHERE id = ?`, [id]);
    return row ? this.mapPhoto(row) : undefined;
  }

  async putPhoto(row: LocalPhotoMeta): Promise<void> {
    await this.ensure();
    this.run(
      `INSERT INTO photos (
        id, case_id, stage, slot_id, data_url, hash, validation_ok, width, height, created_at, uploaded
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?)
      ON CONFLICT(id) DO UPDATE SET
        case_id=excluded.case_id, stage=excluded.stage, slot_id=excluded.slot_id,
        data_url=excluded.data_url, hash=excluded.hash, validation_ok=excluded.validation_ok,
        width=excluded.width, height=excluded.height, uploaded=excluded.uploaded`,
      [
        row.id,
        row.caseId,
        row.stage,
        row.slotId,
        row.dataUrl || null,
        row.hash || null,
        row.validationOk ? 1 : 0,
        row.width ?? null,
        row.height ?? null,
        row.createdAt,
        row.uploaded ? 1 : 0,
      ]
    );
  }

  async updatePhoto(id: string, patch: Partial<LocalPhotoMeta>): Promise<void> {
    const cur = await this.getPhoto(id);
    if (!cur) return;
    await this.putPhoto({ ...cur, ...patch });
  }

  private mapProfile(r: Record<string, unknown>): VehicleProfileRow {
    return {
      id: String(r.id),
      plate: String(r.plate || ''),
      chassis: String(r.chassis || ''),
      make: String(r.make || ''),
      model: String(r.model || ''),
      lastOdometerKm: r.last_odometer_km != null ? Number(r.last_odometer_km) : undefined,
      firstSeenAt: String(r.first_seen_at),
      lastSeenAt: String(r.last_seen_at),
      visitCount: Number(r.visit_count || 0),
    };
  }

  async getVehicleProfile(id: string): Promise<VehicleProfileRow | undefined> {
    await this.ensure();
    const row = this.one(`SELECT * FROM vehicle_profiles WHERE id = ?`, [id]);
    return row ? this.mapProfile(row) : undefined;
  }

  async putVehicleProfile(row: VehicleProfileRow): Promise<void> {
    await this.ensure();
    this.run(
      `INSERT INTO vehicle_profiles (
        id, plate, chassis, make, model, last_odometer_km, first_seen_at, last_seen_at, visit_count
      ) VALUES (?,?,?,?,?,?,?,?,?)
      ON CONFLICT(id) DO UPDATE SET
        plate=excluded.plate, chassis=excluded.chassis, make=excluded.make, model=excluded.model,
        last_odometer_km=excluded.last_odometer_km, last_seen_at=excluded.last_seen_at,
        visit_count=excluded.visit_count`,
      [
        row.id,
        row.plate,
        row.chassis,
        row.make,
        row.model,
        row.lastOdometerKm ?? null,
        row.firstSeenAt,
        row.lastSeenAt,
        row.visitCount,
      ]
    );
  }

  async addDiagnosisEvent(row: DiagnosisEventRow): Promise<void> {
    await this.ensure();
    this.run(
      `INSERT INTO diagnosis_events (
        id, vehicle_id, plate, chassis, case_id, at, odometer_km, problem_name,
        severity, codes_json, parts_json, source, notes
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        row.id,
        row.vehicleId,
        row.plate,
        row.chassis,
        row.caseId || null,
        row.at,
        row.odometerKm ?? null,
        row.problemName,
        row.severity || null,
        json(row.codes || []),
        json(row.partsMentioned || []),
        row.source,
        row.notes || null,
      ]
    );
  }

  async listDiagnosisEventsByVehicle(vehicleId: string): Promise<DiagnosisEventRow[]> {
    await this.ensure();
    return this.all(
      `SELECT * FROM diagnosis_events WHERE vehicle_id = ? ORDER BY at ASC`,
      [vehicleId]
    ).map((r) => ({
      id: String(r.id),
      vehicleId: String(r.vehicle_id),
      plate: String(r.plate || ''),
      chassis: String(r.chassis || ''),
      caseId: r.case_id ? String(r.case_id) : undefined,
      at: String(r.at),
      odometerKm: r.odometer_km != null ? Number(r.odometer_km) : undefined,
      problemName: String(r.problem_name || ''),
      severity: r.severity ? String(r.severity) : undefined,
      codes: parseJson<string[]>(r.codes_json, []),
      partsMentioned: parseJson<string[]>(r.parts_json, []),
      source: String(r.source || ''),
      notes: r.notes ? String(r.notes) : undefined,
    }));
  }

  private mapPid(r: Record<string, unknown>): PidBaselineRow {
    return {
      id: String(r.id),
      vehicleId: String(r.vehicle_id),
      pidId: String(r.pid_id),
      pidName: String(r.pid_name || ''),
      unit: r.unit ? String(r.unit) : undefined,
      samples: Number(r.samples || 0),
      mean: Number(r.mean || 0),
      min: Number(r.min || 0),
      max: Number(r.max || 0),
      m2: Number(r.m2 || 0),
      lastValue: Number(r.last_value || 0),
      updatedAt: String(r.updated_at),
    };
  }

  async getPidBaseline(id: string): Promise<PidBaselineRow | undefined> {
    await this.ensure();
    const row = this.one(`SELECT * FROM pid_baselines WHERE id = ?`, [id]);
    return row ? this.mapPid(row) : undefined;
  }

  async putPidBaseline(row: PidBaselineRow): Promise<void> {
    await this.ensure();
    this.run(
      `INSERT INTO pid_baselines (
        id, vehicle_id, pid_id, pid_name, unit, samples, mean, min, max, m2, last_value, updated_at
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
      ON CONFLICT(id) DO UPDATE SET
        pid_name=excluded.pid_name, unit=excluded.unit, samples=excluded.samples,
        mean=excluded.mean, min=excluded.min, max=excluded.max, m2=excluded.m2,
        last_value=excluded.last_value, updated_at=excluded.updated_at`,
      [
        row.id,
        row.vehicleId,
        row.pidId,
        row.pidName,
        row.unit || null,
        row.samples,
        row.mean,
        row.min,
        row.max,
        row.m2,
        row.lastValue,
        row.updatedAt,
      ]
    );
  }

  async listPidBaselinesByVehicle(vehicleId: string): Promise<PidBaselineRow[]> {
    await this.ensure();
    return this.all(`SELECT * FROM pid_baselines WHERE vehicle_id = ?`, [vehicleId]).map((r) =>
      this.mapPid(r)
    );
  }
}
