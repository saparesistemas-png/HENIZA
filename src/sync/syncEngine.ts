/**
 * Sync engine — outbox Dexie + backoff + circuit breaker.
 */
import {
  flushOutbox,
  countPending,
  enqueueOutbox,
  getOutboxSnapshot,
  soonestRetryAt,
  syncCircuit,
  type OutboxFlushResult,
} from '../db/outbox';
import type { OutboxType } from '../db/henizaDb';

type SyncStatus = 'idle' | 'syncing' | 'error' | 'circuit_open';

export interface SyncResult {
  processed: number;
  failed: number;
  remaining: number;
  nextRetryAt?: number | null;
  circuitOpen?: boolean;
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

async function scheduleNextFlush(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (scheduledTimer) {
    clearTimeout(scheduledTimer);
    scheduledTimer = null;
  }
  const when = await soonestRetryAt();
  if (when == null) return;
  const delay = Math.max(500, Math.min(when - Date.now(), 30 * 60 * 1000));
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
        // rede voltou: não força se circuit ainda OPEN
        const snap = syncCircuit.snapshot();
        if (snap.state === 'OPEN' && Date.now() < snap.openUntil) {
          console.info('[HENIZA Sync] Online, but circuit OPEN until', new Date(snap.openUntil));
          void scheduleNextFlush();
          return;
        }
        console.info('[HENIZA Sync] Network restored — flushing outbox');
        void this.run();
      });
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
      circuitOpen: result.circuitOpen,
    };

    if (result.circuitOpen) {
      notify('circuit_open', syncResult);
    } else {
      notify(
        result.remaining > 0 && result.failed > 0 ? 'error' : 'idle',
        syncResult
      );
    }
    void scheduleNextFlush();
    return syncResult;
  },

  async remaining(): Promise<number> {
    return countPending();
  },

  async snapshot() {
    return getOutboxSnapshot();
  },

  circuitSnapshot() {
    return syncCircuit.snapshot();
  },

  /** Admin / debug: fecha o circuito na mão */
  resetCircuit() {
    syncCircuit.reset();
  },

  async enqueue(type: OutboxType, payload: unknown, caseId?: string) {
    return enqueueOutbox({ type, payload, caseId });
  },
};
