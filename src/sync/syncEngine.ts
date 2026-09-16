/**
 * Sync engine — outbox Dexie + agendamento por backoff exponencial.
 */
import {
  flushOutbox,
  countPending,
  enqueueOutbox,
  getOutboxSnapshot,
  soonestRetryAt,
  type OutboxFlushResult,
} from '../db/outbox';
import type { OutboxType } from '../db/henizaDb';

type SyncStatus = 'idle' | 'syncing' | 'error';

export interface SyncResult {
  processed: number;
  failed: number;
  remaining: number;
  nextRetryAt?: number | null;
}

export type SyncListener = (status: SyncStatus, result?: SyncResult) => void;

let isRunning = false;
let listeners: SyncListener[] = [];
let onlineHandlerAttached = false;
let scheduledTimer: ReturnType<typeof setTimeout> | null = null;

function notify(status: SyncStatus, result?: SyncResult): void {
  listeners.forEach((fn) => {
    try {
      fn(status, result);
    } catch (err) {
      console.error('[HENIZA Sync] Listener error:', err);
    }
  });
}

/** Agenda próximo flush no horário do menor nextRetryAt da fila. */
async function scheduleNextFlush(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (scheduledTimer) {
    clearTimeout(scheduledTimer);
    scheduledTimer = null;
  }
  const when = await soonestRetryAt();
  if (when == null) return;
  const delay = Math.max(500, Math.min(when - Date.now(), 30 * 60 * 1000)); // cap 30min no timer
  scheduledTimer = setTimeout(() => {
    scheduledTimer = null;
    if (typeof navigator === 'undefined' || navigator.onLine) {
      void syncEngine.run();
    }
  }, delay);
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
      // safety net a cada 2 min (backoff controla o que realmente sai)
      window.setInterval(() => {
        if (navigator.onLine) void this.run();
      }, 120_000);
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
    let result: OutboxFlushResult = {
      processed: 0,
      failed: 0,
      remaining: 0,
      nextRetryAt: null,
    };
    try {
      result = await flushOutbox();
    } catch (err) {
      console.error('[HENIZA Sync]', err);
      notify('error');
      isRunning = false;
      void scheduleNextFlush();
      return { processed: 0, failed: 1, remaining: await countPending() };
    } finally {
      isRunning = false;
    }

    const syncResult: SyncResult = {
      processed: result.processed,
      failed: result.failed,
      remaining: result.remaining,
      nextRetryAt: result.nextRetryAt,
    };
    notify(
      result.remaining > 0 && result.failed > 0 ? 'error' : 'idle',
      syncResult
    );
    void scheduleNextFlush();
    return syncResult;
  },

  async remaining(): Promise<number> {
    return countPending();
  },

  async snapshot() {
    return getOutboxSnapshot();
  },

  async enqueue(type: OutboxType, payload: unknown, caseId?: string) {
    return enqueueOutbox({ type, payload, caseId });
  },
};
