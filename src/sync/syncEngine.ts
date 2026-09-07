import { offlineStore, type SyncItem } from '../store/offlineStore';

type SyncStatus = 'idle' | 'syncing' | 'error';

export interface SyncResult {
  processed: number;
  failed: number;
  remaining: number;
}

export type SyncListener = (status: SyncStatus, result?: SyncResult) => void;

const MAX_RETRIES = 5;

let isRunning = false;
let listeners: SyncListener[] = [];
let onlineHandlerAttached = false;

function notify(status: SyncStatus, result?: SyncResult): void {
  listeners.forEach((fn) => {
    try {
      fn(status, result);
    } catch (err) {
      console.error('[HENIZA Sync] Listener error:', err);
    }
  });
}

function resolveEndpoint(type: SyncItem['type']): string | null {
  const map: Record<SyncItem['type'], string> = {
    diagnosis: '/api/diagnose',
    budget: '/api/budgets',
    stock: '/api/stock',
    history: '/api/history',
  };
  return map[type] ?? null;
}

async function processItem(item: SyncItem): Promise<boolean> {
  const endpoint = resolveEndpoint(item.type);
  if (!endpoint) return false;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...(item.payload as object),
        clientId: item.id,
        offlineCreatedAt: item.createdAt,
      }),
    });
    if (!response.ok) return false;
    const json = await response.json();
    return json?.ok === true || response.status === 200;
  } catch {
    return false;
  }
}

export const syncEngine = {
  subscribe(listener: SyncListener): () => void {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  },

  start(): void {
    if (onlineHandlerAttached) return;
    onlineHandlerAttached = true;
    window.addEventListener('online', () => {
      console.info('[HENIZA Sync] Network restored');
      this.run();
    });
    if (navigator.onLine) this.run();
  },

  async run(): Promise<SyncResult> {
    if (isRunning) {
      return { processed: 0, failed: 0, remaining: await this.remaining() };
    }
    if (!navigator.onLine) {
      notify('idle');
      return { processed: 0, failed: 0, remaining: await this.remaining() };
    }

    isRunning = true;
    notify('syncing');
    let processed = 0;
    let failed = 0;

    try {
      const queue = await offlineStore.getSyncQueue();
      for (const item of queue) {
        if (!navigator.onLine) break;
        const success = await processItem(item);
        if (success) {
          await offlineStore.dequeue(item.id);
          processed++;
        } else {
          await offlineStore.incrementRetry(item.id);
          failed++;
          if (item.retries + 1 >= MAX_RETRIES) {
            await offlineStore.dequeue(item.id);
          }
        }
      }
    } catch (err) {
      console.error('[HENIZA Sync]', err);
      notify('error');
    } finally {
      isRunning = false;
    }

    const remaining = await this.remaining();
    const result = { processed, failed, remaining };
    notify(remaining > 0 && failed > 0 ? 'error' : 'idle', result);
    return result;
  },

  async remaining(): Promise<number> {
    return (await offlineStore.getSyncQueue()).length;
  },
};
