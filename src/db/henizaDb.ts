/**
 * HENIZA IndexedDB via Dexie — source of truth offline.
 */
import Dexie, { type Table } from 'dexie';

export type OutboxType =
  | 'CASE_UPSERT'
  | 'PHOTO_UPLOAD'
  | 'DIAGNOSIS_ENRICH'
  | 'BUDGET_CONFIRM'
  | 'ERP_MANIFEST'
  | 'diagnosis'
  | 'budget'
  | 'stock'
  | 'history';

export type OutboxStatus = 'pending' | 'in_flight' | 'acked' | 'failed';

export interface OutboxItem {
  id: string;
  type: OutboxType;
  /** Chave de idempotência enviada ao servidor */
  idempotencyKey: string;
  payload: unknown;
  status: OutboxStatus;
  attempts: number;
  maxAttempts: number;
  nextRetryAt: number;
  lastError?: string;
  caseId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LocalCaseRow {
  id: string;
  plate: string;
  chassis: string;
  make: string;
  model: string;
  currentStage: string;
  /** JSON serializado leve (sem dataUrls pesados) */
  snapshot: unknown;
  rev: number;
  updatedAt: string;
  createdAt: string;
  syncStatus: 'local' | 'pending' | 'synced' | 'conflict';
}

export interface LocalPhotoMeta {
  id: string;
  caseId: string;
  stage: string;
  slotId: string;
  /** dataUrl temporário ou path futuro OPFS */
  dataUrl?: string;
  hash?: string;
  validationOk: boolean;
  width?: number;
  height?: number;
  createdAt: string;
  uploaded: boolean;
}

export interface SyncMetaRow {
  key: string;
  value: string;
}

export class HenizaDB extends Dexie {
  outbox!: Table<OutboxItem, string>;
  cases!: Table<LocalCaseRow, string>;
  photos!: Table<LocalPhotoMeta, string>;
  syncMeta!: Table<SyncMetaRow, string>;

  constructor() {
    super('heniza_dexie_v1');
    this.version(1).stores({
      outbox: 'id, type, status, nextRetryAt, caseId, createdAt',
      cases: 'id, plate, currentStage, updatedAt, syncStatus',
      photos: 'id, caseId, slotId, [caseId+slotId], uploaded',
      syncMeta: 'key',
    });
  }
}

export const henizaDb = new HenizaDB();

export async function getDeviceId(): Promise<string> {
  const row = await henizaDb.syncMeta.get('deviceId');
  if (row?.value) return row.value;
  const id =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `dev-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  await henizaDb.syncMeta.put({ key: 'deviceId', value: id });
  return id;
}
