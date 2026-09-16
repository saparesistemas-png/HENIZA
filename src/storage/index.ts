/**
 * Factory do storage local.
 * VITE_STORAGE_BACKEND=dexie|sqlite
 */
import type { StoragePort } from './StoragePort';
import { DexieStorage } from './dexieStorage';

let singleton: StoragePort | null = null;
let initPromise: Promise<StoragePort> | null = null;

function preferredBackend(): 'dexie' | 'sqlite' {
  try {
    const v =
      (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_STORAGE_BACKEND) ||
      'dexie';
    return v === 'sqlite' ? 'sqlite' : 'dexie';
  } catch {
    return 'dexie';
  }
}

/**
 * Síncrono: retorna instância já criada, ou Dexie imediatamente.
 * Para garantir SQLite pronto, use `await ensureStorage()`.
 */
export function getStorage(): StoragePort {
  if (singleton) return singleton;
  // bootstrap síncrono: sempre Dexie até ensureStorage resolver SQLite
  singleton = new DexieStorage();
  if (preferredBackend() === 'sqlite') {
    void ensureStorage();
  }
  return singleton;
}

/** Inicializa SQLite se configurado; faz hot-swap do singleton. */
export async function ensureStorage(): Promise<StoragePort> {
  if (singleton && singleton.backend === preferredBackend()) {
    return singleton;
  }
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const want = preferredBackend();
    if (want === 'sqlite') {
      try {
        const { SqliteStorage } = await import('./sqliteStorage');
        const sql = new SqliteStorage();
        // força init (primeira op. leve)
        await sql.getMeta('__boot__');
        singleton = sql;
        console.info('[HENIZA] Storage backend: sqlite (sql.js + OPFS)');
        return singleton;
      } catch (e) {
        console.warn('[HENIZA] SQLite falhou, usando Dexie', e);
        singleton = new DexieStorage();
        return singleton;
      }
    }
    singleton = new DexieStorage();
    return singleton;
  })();

  return initPromise;
}

export function setStorageForTests(port: StoragePort | null) {
  singleton = port;
  initPromise = null;
}

export type { StoragePort, EnqueueInput } from './StoragePort';
export { DexieStorage } from './dexieStorage';
