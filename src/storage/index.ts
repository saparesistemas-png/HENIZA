/**
 * Factory do storage local.
 * Troca futura: VITE_STORAGE_BACKEND=sqlite → SQLiteStorage
 */
import type { StoragePort } from './StoragePort';
import { DexieStorage } from './dexieStorage';

let singleton: StoragePort | null = null;

export function getStorage(): StoragePort {
  if (singleton) return singleton;

  const backend =
    (typeof import.meta !== 'undefined' &&
      (import.meta as any).env?.VITE_STORAGE_BACKEND) ||
    'dexie';

  if (backend === 'sqlite') {
    // Placeholder — implementar SQLiteStorage depois
    console.warn('[HENIZA] VITE_STORAGE_BACKEND=sqlite ainda não implementado; usando Dexie.');
  }

  singleton = new DexieStorage();
  return singleton;
}

/** Testes / hot-swap */
export function setStorageForTests(port: StoragePort | null) {
  singleton = port;
}

export type { StoragePort, EnqueueInput } from './StoragePort';
export { DexieStorage } from './dexieStorage';
