/**
 * Alimentação em tempo real — polling autenticado do /api/feed
 * e publicação de eventos de diagnóstico/OS.
 */
import { authHeaders, getOnlineToken } from './onlineSession';
import { recordDiagnosisEvent, vehicleKey } from './vehicleMemory';

export type FeedEvent = {
  id: string;
  type: string;
  plate?: string;
  chassis?: string;
  title: string;
  body?: string;
  codes?: string[];
  odometerKm?: number;
  authorName?: string;
  at: string;
};

type Listener = (events: FeedEvent[]) => void;

let timer: ReturnType<typeof setInterval> | null = null;
let lastSince = new Date(0).toISOString();
let listeners: Listener[] = [];
let lastEvents: FeedEvent[] = [];
let plateFilter = '';
let chassisFilter = '';

function notify() {
  listeners.forEach((fn) => {
    try {
      fn(lastEvents);
    } catch {
      /* */
    }
  });
}

export const realtimeFeed = {
  subscribe(fn: Listener): () => void {
    listeners.push(fn);
    fn(lastEvents);
    return () => {
      listeners = listeners.filter((l) => l !== fn);
    };
  },

  setVehicleFilter(plate: string, chassis: string) {
    plateFilter = plate;
    chassisFilter = chassis;
  },

  getEvents() {
    return lastEvents;
  },

  start(intervalMs = 4000) {
    if (timer) return;
    void this.pull();
    timer = setInterval(() => void this.pull(), intervalMs);
  },

  stop() {
    if (timer) clearInterval(timer);
    timer = null;
  },

  async pull(): Promise<FeedEvent[]> {
    if (!getOnlineToken()) return lastEvents;
    if (typeof navigator !== 'undefined' && !navigator.onLine) return lastEvents;

    try {
      const q = new URLSearchParams();
      q.set('since', lastSince);
      if (plateFilter) q.set('plate', plateFilter);
      if (chassisFilter) q.set('chassis', chassisFilter);

      const res = await fetch(`/api/feed?${q.toString()}`, {
        headers: authHeaders(),
      });
      if (res.status === 401) return lastEvents;
      const json = await res.json();
      if (!json?.ok || !Array.isArray(json.events)) return lastEvents;

      const incoming = json.events as FeedEvent[];
      if (incoming.length) {
        // merge unique by id
        const map = new Map<string, FeedEvent>();
        [...incoming, ...lastEvents].forEach((e) => map.set(e.id, e));
        lastEvents = Array.from(map.values())
          .sort((a, b) => b.at.localeCompare(a.at))
          .slice(0, 100);

        // alimenta memória local com eventos remotos de diagnóstico
        for (const e of incoming) {
          if (e.type === 'diagnosis' && (e.plate || e.chassis)) {
            void recordDiagnosisEvent({
              plate: e.plate,
              chassis: e.chassis,
              problemName: e.title,
              diagnosticNotes: e.body,
              odometerKm: e.odometerKm,
              codes: e.codes,
              source: `feed:${e.authorName || 'remoto'}`,
            });
          }
        }

        const newest = incoming[0]?.at;
        if (newest && newest > lastSince) lastSince = newest;
        notify();
      }

      if (json.serverTime) {
        // keep cursor moving even if empty to avoid re-fetch spam of old
        if (!incoming.length && json.serverTime > lastSince) {
          // don't advance past empty — only on events
        }
      }
    } catch {
      /* silencioso */
    }
    return lastEvents;
  },

  async publish(input: {
    type: string;
    plate?: string;
    chassis?: string;
    caseId?: string;
    title: string;
    body?: string;
    codes?: string[];
    odometerKm?: number;
    payload?: unknown;
  }): Promise<boolean> {
    if (!getOnlineToken()) return false;
    try {
      const res = await fetch('/api/feed', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          ...input,
          vehicleId: vehicleKey(input.plate || '', input.chassis || '') || undefined,
        }),
      });
      const json = await res.json();
      if (json?.ok && json.event) {
        lastEvents = [json.event, ...lastEvents].slice(0, 100);
        notify();
        return true;
      }
    } catch {
      /* */
    }
    return false;
  },
};
