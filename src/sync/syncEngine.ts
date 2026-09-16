/**
 * Sync engine — usa outbox Dexie como fonte da fila.
 * Mantém API subscribe/start/run compatível com o app.
 */
import {
  flushOutbox,
  countPending,
  enqueueOutbox,
  getOutboxSnapshot,
  type OutboxFlushResult,
} from '../db/outbox';
import type { OutboxType } from '../db/henizaDb';

type SyncStatus = 'idle' | 'syncing' | 'error';

export interface SyncResult {
  processed: number;
  failed: number;
  remaining: number;
}

export type SyncListener = (status: SyncStatus, result?: SyncResult) => void;

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
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.info('[HENIZA Sync] Network restored — flushing outbox');
        void this.run();
      });
      // flush periódico leve
      window.setInterval(() => {
        if (navigator.onLine) void this.run();
      }, 60_000);
    }
    if (typeof navigator !== 'undefined' && navigator.onLine) void this.run();
  },

  async run(): Promise<SyncResult> {
    if (isRunning) {
      return { processed: 0, failed: 0, remaining: await countPending() };
    }
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      notify('idle');
      return { processed: 0, failed: 0, remaining: await countPending() };
    }

    isRunning = true;
    notify('syncing');
    let result: OutboxFlushResult = { processed: 0, failed: 0, remaining: 0 };
    try {
      result = await flushOutbox();
    } catch (err) {
      console.error('[HENIZA Sync]', err);
      notify('error');
      isRunning = false;
      return { processed: 0, failed: 1, remaining: await countPending() };
    } finally {
      isRunning = false;
    }

    const syncResult: SyncResult = {
      processed: result.processed,
      failed: result.failed,
      remaining: result.remaining,
    };
    notify(
      result.remaining > 0 && result.failed > 0 ? 'error' : 'idle',
      syncResult
    );
    return syncResult;
  },

  async remaining(): Promise<number> {
    return countPending();
  },

  async snapshot() {
    return getOutboxSnapshot();
  },

  /** Compat: enfileira item legado (diagnosis/budget/...) */
  async enqueue(type: OutboxType, payload: unknown, caseId?: string) {
    return enqueueOutbox({ type, payload, caseId });
  },
};
