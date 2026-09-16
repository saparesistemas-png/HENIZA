/**
 * Store de eventos em tempo real (warm instance).
 * Em produção multi-instância: trocar por Redis/Postgres LISTEN.
 */

export type FeedEvent = {
  id: string;
  type: 'diagnosis' | 'case' | 'photo' | 'approval' | 'system';
  workshopId?: string;
  plate?: string;
  chassis?: string;
  vehicleId?: string;
  caseId?: string;
  title: string;
  body?: string;
  codes?: string[];
  odometerKm?: number;
  authorId?: string;
  authorName?: string;
  at: string;
  payload?: unknown;
};

declare global {
  // eslint-disable-next-line no-var
  var __henizaFeed: FeedEvent[] | undefined;
}

function store(): FeedEvent[] {
  if (!global.__henizaFeed) global.__henizaFeed = [];
  return global.__henizaFeed;
}

export function publishFeedEvent(
  evt: Omit<FeedEvent, 'id' | 'at'> & { id?: string; at?: string }
): FeedEvent {
  const full: FeedEvent = {
    ...evt,
    id: evt.id || `feed-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    at: evt.at || new Date().toISOString(),
  };
  const s = store();
  s.unshift(full);
  if (s.length > 500) s.length = 500;
  return full;
}

export function listFeedSince(opts: {
  since?: string;
  plate?: string;
  chassis?: string;
  workshopId?: string;
  limit?: number;
}): FeedEvent[] {
  const sinceTs = opts.since ? Date.parse(opts.since) : 0;
  const limit = opts.limit ?? 50;
  return store()
    .filter((e) => {
      if (sinceTs && Date.parse(e.at) <= sinceTs) return false;
      if (opts.plate && e.plate && e.plate !== opts.plate.toUpperCase()) return false;
      if (opts.chassis && e.chassis && e.chassis !== opts.chassis.toUpperCase()) return false;
      if (opts.workshopId && e.workshopId && e.workshopId !== opts.workshopId) return false;
      return true;
    })
    .slice(0, limit);
}
