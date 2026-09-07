const DB_NAME = 'heniza_offline_v1';
const DB_VERSION = 1;

export type StoreName =
  | 'inventory'
  | 'histories'
  | 'budgets'
  | 'agenda'
  | 'pieceStocks'
  | 'syncQueue';

interface StoreSchema {
  inventory: any[];
  histories: any[];
  budgets: any[];
  agenda: any[];
  pieceStocks: any[];
  syncQueue: SyncItem[];
}

export interface SyncItem {
  id: string;
  type: 'diagnosis' | 'budget' | 'stock' | 'history';
  payload: unknown;
  createdAt: string;
  retries: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      const stores: StoreName[] = [
        'inventory',
        'histories',
        'budgets',
        'agenda',
        'pieceStocks',
        'syncQueue',
      ];
      stores.forEach((name) => {
        if (!db.objectStoreNames.contains(name)) {
          if (name === 'syncQueue') db.createObjectStore(name, { keyPath: 'id' });
          else db.createObjectStore(name);
        }
      });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getStoreData<K extends StoreName>(
  storeName: K
): Promise<StoreSchema[K] | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    if (storeName === 'syncQueue') {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result as StoreSchema[K]);
      request.onerror = () => reject(request.error);
    } else {
      const request = store.get('data');
      request.onsuccess = () => resolve(request.result ?? null);
      request.onerror = () => reject(request.error);
    }
  });
}

async function setStoreData<K extends StoreName>(
  storeName: K,
  value: StoreSchema[K]
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    if (storeName === 'syncQueue') {
      store.clear();
      (value as SyncItem[]).forEach((item) => store.put(item));
    } else {
      store.put(value, 'data');
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export const offlineStore = {
  async getInventory<T = any[]>(): Promise<T> {
    return ((await getStoreData('inventory')) ?? []) as T;
  },
  async getHistories<T = any[]>(): Promise<T> {
    return ((await getStoreData('histories')) ?? []) as T;
  },
  async getBudgets<T = any[]>(): Promise<T> {
    return ((await getStoreData('budgets')) ?? []) as T;
  },
  async getAgenda<T = any[]>(): Promise<T> {
    return ((await getStoreData('agenda')) ?? []) as T;
  },
  async getPieceStocks<T = any[]>(): Promise<T> {
    return ((await getStoreData('pieceStocks')) ?? []) as T;
  },
  async getSyncQueue(): Promise<SyncItem[]> {
    return (await getStoreData('syncQueue')) ?? [];
  },
  async saveInventory(data: any[]): Promise<void> {
    await setStoreData('inventory', data);
  },
  async saveHistories(data: any[]): Promise<void> {
    await setStoreData('histories', data);
  },
  async saveBudgets(data: any[]): Promise<void> {
    await setStoreData('budgets', data);
  },
  async saveAgenda(data: any[]): Promise<void> {
    await setStoreData('agenda', data);
  },
  async savePieceStocks(data: any[]): Promise<void> {
    await setStoreData('pieceStocks', data);
  },
  async enqueue(item: Omit<SyncItem, 'id' | 'createdAt' | 'retries'>): Promise<void> {
    const queue = await this.getSyncQueue();
    queue.push({
      id: 'sync-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
      createdAt: new Date().toISOString(),
      retries: 0,
      ...item,
    });
    await setStoreData('syncQueue', queue);
  },
  async dequeue(id: string): Promise<void> {
    const queue = await this.getSyncQueue();
    await setStoreData(
      'syncQueue',
      queue.filter((item) => item.id !== id)
    );
  },
  async incrementRetry(id: string): Promise<void> {
    const queue = await this.getSyncQueue();
    await setStoreData(
      'syncQueue',
      queue.map((item) =>
        item.id === id ? { ...item, retries: item.retries + 1 } : item
      )
    );
  },
  async clearQueue(): Promise<void> {
    await setStoreData('syncQueue', []);
  },
  async migrateFromLocalStorage(): Promise<void> {
    const map: Record<string, StoreName> = {
      auto_inventory_sys: 'inventory',
      auto_hist_sys: 'histories',
      auto_mobile_budgets: 'budgets',
      auto_agenda_events: 'agenda',
      auto_piece_stocks: 'pieceStocks',
      auto_sync_queue: 'syncQueue',
    };
    for (const [oldKey, storeName] of Object.entries(map)) {
      const raw = localStorage.getItem(oldKey);
      if (!raw) continue;
      try {
        const parsed = JSON.parse(raw);
        if (storeName === 'syncQueue') {
          const items: SyncItem[] = Array.isArray(parsed)
            ? parsed.map((p: any, i: number) => ({
                id: p.id || `migrated-${i}`,
                type: p.type || 'diagnosis',
                payload: p.payload ?? p,
                createdAt: p.createdAt || new Date().toISOString(),
                retries: p.retries || 0,
              }))
            : [];
          await setStoreData('syncQueue', items);
        } else {
          await setStoreData(storeName as any, parsed);
        }
        localStorage.removeItem(oldKey);
      } catch (err) {
        console.warn(`[HENIZA] Failed to migrate ${oldKey}`, err);
      }
    }
  },
};
