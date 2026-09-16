/**
 * Porta de armazenamento local offline-first.
 * Implementações: Dexie (atual), futuro SQLite WASM / Capacitor SQLite.
 */
import type {
  OutboxItem,
  OutboxType,
  LocalCaseRow,
  LocalPhotoMeta,
  VehicleProfileRow,
  DiagnosisEventRow,
  PidBaselineRow,
} from '../db/henizaDb';

export type { OutboxItem, OutboxType, LocalCaseRow, LocalPhotoMeta, VehicleProfileRow, DiagnosisEventRow, PidBaselineRow };

export type EnqueueInput = {
  type: OutboxType;
  payload: unknown;
  caseId?: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};

/**
 * Contrato único — UI e serviços não importam Dexie/SQLite diretamente.
 */
export interface StoragePort {
  readonly backend: 'dexie' | 'sqlite' | 'memory';

  // --- device / meta ---
  getDeviceId(): Promise<string>;
  getMeta(key: string): Promise<string | null>;
  setMeta(key: string, value: string): Promise<void>;

  // --- outbox ---
  enqueue(input: EnqueueInput): Promise<OutboxItem>;
  listPendingOutbox(limit?: number): Promise<OutboxItem[]>;
  countPendingOutbox(): Promise<number>;
  getOutbox(id: string): Promise<OutboxItem | undefined>;
  putOutbox(item: OutboxItem): Promise<void>;
  updateOutbox(id: string, patch: Partial<OutboxItem>): Promise<void>;
  deleteOutbox(ids: string[]): Promise<void>;
  listOutboxRecent(limit?: number): Promise<OutboxItem[]>;

  // --- cases ---
  getCase(id: string): Promise<LocalCaseRow | undefined>;
  putCase(row: LocalCaseRow): Promise<void>;
  updateCase(id: string, patch: Partial<LocalCaseRow>): Promise<void>;
  listCases(): Promise<LocalCaseRow[]>;

  // --- photos (metadados; blob em OPFS) ---
  getPhoto(id: string): Promise<LocalPhotoMeta | undefined>;
  putPhoto(row: LocalPhotoMeta): Promise<void>;
  updatePhoto(id: string, patch: Partial<LocalPhotoMeta>): Promise<void>;

  // --- vehicle memory ---
  getVehicleProfile(id: string): Promise<VehicleProfileRow | undefined>;
  putVehicleProfile(row: VehicleProfileRow): Promise<void>;
  addDiagnosisEvent(row: DiagnosisEventRow): Promise<void>;
  listDiagnosisEventsByVehicle(vehicleId: string): Promise<DiagnosisEventRow[]>;
  getPidBaseline(id: string): Promise<PidBaselineRow | undefined>;
  putPidBaseline(row: PidBaselineRow): Promise<void>;
  listPidBaselinesByVehicle(vehicleId: string): Promise<PidBaselineRow[]>;
}
