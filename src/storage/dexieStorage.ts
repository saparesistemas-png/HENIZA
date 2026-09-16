/**
 * Implementação StoragePort sobre Dexie / IndexedDB.
 */
import {
  henizaDb,
  getDeviceId as dexieGetDeviceId,
  type OutboxItem,
  type LocalCaseRow,
  type LocalPhotoMeta,
  type VehicleProfileRow,
  type DiagnosisEventRow,
  type PidBaselineRow,
} from '../db/henizaDb';
import type { EnqueueInput, StoragePort } from './StoragePort';

const DEFAULT_MAX_ATTEMPTS = 8;

function uuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `obx-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export class DexieStorage implements StoragePort {
  readonly backend = 'dexie' as const;

  getDeviceId(): Promise<string> {
    return dexieGetDeviceId();
  }

  async getMeta(key: string): Promise<string | null> {
    const row = await henizaDb.syncMeta.get(key);
    return row?.value ?? null;
  }

  async setMeta(key: string, value: string): Promise<void> {
    await henizaDb.syncMeta.put({ key, value });
  }

  async enqueue(input: EnqueueInput): Promise<OutboxItem> {
    const now = new Date().toISOString();
    const idempotencyKey =
      input.idempotencyKey ||
      `${input.type}:${input.caseId || 'na'}:${JSON.stringify(input.payload).slice(0, 80)}`;

    const existing = await henizaDb.outbox
      .where('status')
      .anyOf(['pending', 'in_flight'])
      .filter((i) => i.idempotencyKey === idempotencyKey)
      .first();

    if (existing) {
      const updated: OutboxItem = {
        ...existing,
        payload: input.payload,
        updatedAt: now,
        status: 'pending',
        nextRetryAt: Date.now(),
      };
      await henizaDb.outbox.put(updated);
      return updated;
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
    await henizaDb.outbox.add(item);
    return item;
  }

  async listPendingOutbox(limit = 50): Promise<OutboxItem[]> {
    const now = Date.now();
    const rows = await henizaDb.outbox
      .where('status')
      .anyOf(['pending', 'failed'])
      .sortBy('createdAt');
    return rows.filter((r) => r.nextRetryAt <= now).slice(0, limit);
  }

  countPendingOutbox(): Promise<number> {
    return henizaDb.outbox.where('status').anyOf(['pending', 'in_flight', 'failed']).count();
  }

  getOutbox(id: string): Promise<OutboxItem | undefined> {
    return henizaDb.outbox.get(id);
  }

  async putOutbox(item: OutboxItem): Promise<void> {
    await henizaDb.outbox.put(item);
  }

  async updateOutbox(id: string, patch: Partial<OutboxItem>): Promise<void> {
    await henizaDb.outbox.update(id, { ...patch, updatedAt: new Date().toISOString() });
  }

  async deleteOutbox(ids: string[]): Promise<void> {
    await henizaDb.outbox.bulkDelete(ids);
  }

  listOutboxRecent(limit = 40): Promise<OutboxItem[]> {
    return henizaDb.outbox.orderBy('createdAt').reverse().limit(limit).toArray();
  }

  getCase(id: string): Promise<LocalCaseRow | undefined> {
    return henizaDb.cases.get(id);
  }

  async putCase(row: LocalCaseRow): Promise<void> {
    await henizaDb.cases.put(row);
  }

  async updateCase(id: string, patch: Partial<LocalCaseRow>): Promise<void> {
    await henizaDb.cases.update(id, patch);
  }

  listCases(): Promise<LocalCaseRow[]> {
    return henizaDb.cases.toArray();
  }

  getPhoto(id: string): Promise<LocalPhotoMeta | undefined> {
    return henizaDb.photos.get(id);
  }

  async putPhoto(row: LocalPhotoMeta): Promise<void> {
    await henizaDb.photos.put(row);
  }

  async updatePhoto(id: string, patch: Partial<LocalPhotoMeta>): Promise<void> {
    await henizaDb.photos.update(id, patch);
  }

  getVehicleProfile(id: string): Promise<VehicleProfileRow | undefined> {
    return henizaDb.vehicleProfiles.get(id);
  }

  async putVehicleProfile(row: VehicleProfileRow): Promise<void> {
    await henizaDb.vehicleProfiles.put(row);
  }

  async addDiagnosisEvent(row: DiagnosisEventRow): Promise<void> {
    await henizaDb.diagnosisEvents.add(row);
  }

  async listDiagnosisEventsByVehicle(vehicleId: string): Promise<DiagnosisEventRow[]> {
    return henizaDb.diagnosisEvents.where('vehicleId').equals(vehicleId).sortBy('at');
  }

  getPidBaseline(id: string): Promise<PidBaselineRow | undefined> {
    return henizaDb.pidBaselines.get(id);
  }

  async putPidBaseline(row: PidBaselineRow): Promise<void> {
    await henizaDb.pidBaselines.put(row);
  }

  listPidBaselinesByVehicle(vehicleId: string): Promise<PidBaselineRow[]> {
    return henizaDb.pidBaselines.where('vehicleId').equals(vehicleId).toArray();
  }
}
