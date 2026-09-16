/**
 * Fila outbox Dexie — enqueue, backoff + circuit breaker, flush online.
 */
import {
  henizaDb,
  getDeviceId,
  type OutboxItem,
  type OutboxType,
  type LocalCaseRow,
  type LocalPhotoMeta,
} from './henizaDb';
import {
  resolveRetryDelayMs,
  exponentialBackoffMs,
} from './backoff';
import { syncCircuit, diagnoseCircuit } from './circuitBreaker';

const DEFAULT_MAX_ATTEMPTS = 8;

function uuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `obx-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function circuitForType(type: OutboxType) {
  return type === 'diagnosis' || type === 'DIAGNOSIS_ENRICH' ? diagnoseCircuit : syncCircuit;
}

export type EnqueueInput = {
  type: OutboxType;
  payload: unknown;
  caseId?: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};

export async function enqueueOutbox(input: EnqueueInput): Promise<OutboxItem> {
  const now = new Date().toISOString();
  const idempotencyKey =
    input.idempotencyKey ||
    `${input.type}:${input.caseId || 'na'}:${JSON.stringify(input.payload).slice(0, 80)}`;

  const existing = await henizaDb.outbox
    .where('status')
    .anyOf(['pending', 'in_flight'])
    .filter((i) => i.idempotencyKey === idempotencyKey)
    .first();

  if (existing) {
    const updated: OutboxItem = {
      ...existing,
      payload: input.payload,
      updatedAt: now,
      status: 'pending',
      nextRetryAt: Date.now(),
    };
    await henizaDb.outbox.put(updated);
    return updated;
  }

  const item: OutboxItem = {
    id: uuid(),
    type: input.type,
    idempotencyKey,
    payload: input.payload,
    status: 'pending',
    attempts: 0,
    maxAttempts: input.maxAttempts ?? DEFAULT_MAX_ATTEMPTS,
    nextRetryAt: Date.now(),
    caseId: input.caseId,
    createdAt: now,
    updatedAt: now,
  };
  await henizaDb.outbox.add(item);
  return item;
}

export async function listPending(limit = 50): Promise<OutboxItem[]> {
  const now = Date.now();
  const rows = await henizaDb.outbox
    .where('status')
    .anyOf(['pending', 'failed'])
    .sortBy('createdAt');
  return rows.filter((r) => r.nextRetryAt <= now).slice(0, limit);
}

export async function soonestRetryAt(): Promise<number | null> {
  const rows = await henizaDb.outbox
    .where('status')
    .anyOf(['pending', 'failed'])
    .toArray();
  const future = rows.map((r) => r.nextRetryAt).filter((t) => t > Date.now());
  // se circuit OPEN, não tentar antes de openUntil
  const snap = syncCircuit.snapshot();
  const circuitFloor = snap.state === 'OPEN' ? snap.openUntil : 0;
  if (!future.length) {
    return circuitFloor > Date.now() ? circuitFloor : null;
  }
  const minItem = Math.min(...future);
  return Math.max(minItem, circuitFloor > Date.now() ? circuitFloor : 0) || minItem;
}

export async function countPending(): Promise<number> {
  return henizaDb.outbox.where('status').anyOf(['pending', 'in_flight', 'failed']).count();
}

export async function markInFlight(id: string): Promise<void> {
  await henizaDb.outbox.update(id, {
    status: 'in_flight',
    updatedAt: new Date().toISOString(),
  });
}

export async function markAcked(id: string): Promise<void> {
  await henizaDb.outbox.update(id, {
    status: 'acked',
    updatedAt: new Date().toISOString(),
    lastError: undefined,
  });
}

export async function markFailed(
  id: string,
  error: string,
  retryAfterHeader?: string | null
): Promise<void> {
  const item = await henizaDb.outbox.get(id);
  if (!item) return;
  const attempts = item.attempts + 1;
  const exhausted = attempts >= item.maxAttempts;
  const delay = resolveRetryDelayMs(attempts, retryAfterHeader);
  const when = Date.now() + delay;

  await henizaDb.outbox.update(id, {
    attempts,
    status: exhausted ? 'failed' : 'pending',
    nextRetryAt: when,
    lastError: `${error.slice(0, 400)} | retryIn=${Math.round(delay / 1000)}s (attempt ${attempts})`,
    updatedAt: new Date().toISOString(),
  });
}

export async function purgeAcked(olderThanMs = 7 * 24 * 3600 * 1000): Promise<number> {
  const cutoff = Date.now() - olderThanMs;
  const acked = await henizaDb.outbox.where('status').equals('acked').toArray();
  const toDelete = acked.filter((a) => new Date(a.updatedAt).getTime() < cutoff);
  await henizaDb.outbox.bulkDelete(toDelete.map((t) => t.id));
  return toDelete.length;
}

export async function retryNow(id: string): Promise<void> {
  await henizaDb.outbox.update(id, {
    status: 'pending',
    nextRetryAt: Date.now(),
    updatedAt: new Date().toISOString(),
  });
}

export async function saveCaseLocal(snapshot: {
  id: string;
  plate?: string;
  chassis?: string;
  make?: string;
  model?: string;
  currentStage?: string;
  [k: string]: unknown;
}): Promise<void> {
  const now = new Date().toISOString();
  const prev = await henizaDb.cases.get(snapshot.id);
  const row: LocalCaseRow = {
    id: snapshot.id,
    plate: String(snapshot.plate || prev?.plate || ''),
    chassis: String(snapshot.chassis || prev?.chassis || ''),
    make: String(snapshot.make || prev?.make || ''),
    model: String(snapshot.model || prev?.model || ''),
    currentStage: String(snapshot.currentStage || prev?.currentStage || 'entrada'),
    snapshot,
    rev: (prev?.rev || 0) + 1,
    updatedAt: now,
    createdAt: prev?.createdAt || now,
    syncStatus: 'pending',
  };
  await henizaDb.cases.put(row);

  const light = { ...snapshot } as Record<string, unknown>;
  if (light.stages && typeof light.stages === 'object') {
    const stages = light.stages as Record<string, any>;
    const stagesLight: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(stages)) {
      stagesLight[k] = {
        stage: v?.stage,
        notes: v?.notes,
        startedAt: v?.startedAt,
        completedAt: v?.completedAt,
        photoSlots: (v?.photos || []).map((p: any) => ({
          slotId: p.slotId,
          validated: Boolean(p.validation?.ok),
          capturedAt: p.capturedAt,
        })),
      };
    }
    light.stages = stagesLight;
  }

  await enqueueOutbox({
    type: 'CASE_UPSERT',
    caseId: snapshot.id,
    idempotencyKey: `CASE_UPSERT:${snapshot.id}:r${row.rev}`,
    payload: { case: light, rev: row.rev, deviceId: await getDeviceId() },
  });
}

export async function savePhotoLocal(
  meta: Omit<LocalPhotoMeta, 'uploaded'> & { uploaded?: boolean }
) {
  const row: LocalPhotoMeta = {
    ...meta,
    uploaded: meta.uploaded ?? false,
  };
  await henizaDb.photos.put(row);
  if (!row.uploaded && row.dataUrl) {
    await enqueueOutbox({
      type: 'PHOTO_UPLOAD',
      caseId: row.caseId,
      idempotencyKey: `PHOTO_UPLOAD:${row.caseId}:${row.slotId}:${row.id}`,
      payload: {
        caseId: row.caseId,
        stage: row.stage,
        slotId: row.slotId,
        photoId: row.id,
        photoIdRef: row.id,
        validationOk: row.validationOk,
        width: row.width,
        height: row.height,
      },
    });
  }
}

export type OutboxFlushResult = {
  processed: number;
  failed: number;
  remaining: number;
  nextRetryAt: number | null;
  circuitOpen?: boolean;
  skippedByCircuit?: number;
};

type PostResult = { ok: boolean; error?: string; retryAfter?: string | null };

async function postItem(item: OutboxItem): Promise<PostResult> {
  const breaker = circuitForType(item.type);
  if (!breaker.canRequest()) {
    const snap = breaker.snapshot();
    return {
      ok: false,
      error: `circuit_open:${snap.name} until ${new Date(snap.openUntil).toISOString()}`,
      retryAfter: String(Math.ceil(Math.max(0, snap.openUntil - Date.now()) / 1000)),
    };
  }

  const deviceId = await getDeviceId();

  if (item.type === 'PHOTO_UPLOAD') {
    const payload = item.payload as { photoIdRef?: string; photoId?: string };
    const photoId = payload.photoIdRef || payload.photoId;
    const photo = photoId ? await henizaDb.photos.get(photoId) : null;
    if (!photo?.dataUrl) {
      breaker.recordSuccess();
      return { ok: true };
    }
    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': item.idempotencyKey,
        },
        body: JSON.stringify({
          type: item.type,
          deviceId,
          idempotencyKey: item.idempotencyKey,
          payload: {
            caseId: photo.caseId,
            stage: photo.stage,
            slotId: photo.slotId,
            photoId: photo.id,
            dataUrl: photo.dataUrl,
            validationOk: photo.validationOk,
          },
        }),
      });
      const retryAfter = res.headers.get('Retry-After');
      if (!res.ok) {
        if (res.status >= 500 || res.status === 429) {
          breaker.recordFailure(`HTTP ${res.status}`);
        }
        return { ok: false, error: `HTTP ${res.status}`, retryAfter };
      }
      const json = await res.json().catch(() => ({}));
      if (json?.ok === false) {
        breaker.recordFailure(String(json?.error || 'sync failed'));
        return { ok: false, error: json?.error || 'sync failed', retryAfter };
      }
      await henizaDb.photos.update(photo.id, { uploaded: true });
      breaker.recordSuccess();
      return { ok: true };
    } catch (e: any) {
      breaker.recordFailure(e?.message || 'network');
      return { ok: false, error: e?.message || 'network' };
    }
  }

  const endpoint = item.type === 'diagnosis' ? '/api/diagnose' : '/api/sync';

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': item.idempotencyKey,
      },
      body: JSON.stringify({
        type: item.type,
        deviceId,
        idempotencyKey: item.idempotencyKey,
        payload: item.payload,
        clientId: item.id,
      }),
    });
    const retryAfter = res.headers.get('Retry-After');
    if (!res.ok) {
      if (res.status >= 500 || res.status === 429) {
        breaker.recordFailure(`HTTP ${res.status}`);
        if (res.status === 503) breaker.trip(`HTTP 503`);
      }
      return { ok: false, error: `HTTP ${res.status}`, retryAfter };
    }
    const json = await res.json().catch(() => ({}));
    if (json?.ok === false) {
      breaker.recordFailure(String(json?.error || 'fail'));
      return { ok: false, error: String(json?.error || 'fail'), retryAfter };
    }

    if (item.type === 'CASE_UPSERT' && item.caseId) {
      await henizaDb.cases.update(item.caseId, { syncStatus: 'synced' });
    }
    breaker.recordSuccess();
    return { ok: true };
  } catch (e: any) {
    breaker.recordFailure(e?.message || 'network');
    return { ok: false, error: e?.message || 'network' };
  }
}

export async function flushOutbox(): Promise<OutboxFlushResult> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return {
      processed: 0,
      failed: 0,
      remaining: await countPending(),
      nextRetryAt: await soonestRetryAt(),
      circuitOpen: syncCircuit.snapshot().state === 'OPEN',
    };
  }

  // Circuit OPEN: não processa lote; agenda para openUntil
  const syncSnap = syncCircuit.snapshot();
  if (syncSnap.state === 'OPEN' && Date.now() < syncSnap.openUntil) {
    return {
      processed: 0,
      failed: 0,
      remaining: await countPending(),
      nextRetryAt: syncSnap.openUntil,
      circuitOpen: true,
      skippedByCircuit: await countPending(),
    };
  }

  const batch = await listPending(20);
  let processed = 0;
  let failed = 0;
  let skippedByCircuit = 0;

  for (const item of batch) {
    if (typeof navigator !== 'undefined' && !navigator.onLine) break;

    const breaker = circuitForType(item.type);
    const snap = breaker.snapshot();
    if (snap.state === 'OPEN' && Date.now() < snap.openUntil) {
      // reagenda item sem consumir attempt
      await henizaDb.outbox.update(item.id, {
        status: 'pending',
        nextRetryAt: snap.openUntil,
        lastError: `waiting circuit ${snap.name}`,
        updatedAt: new Date().toISOString(),
      });
      skippedByCircuit++;
      continue;
    }

    await markInFlight(item.id);
    const result = await postItem(item);
    if (result.ok) {
      await markAcked(item.id);
      processed++;
    } else if (result.error?.startsWith('circuit_open:')) {
      await henizaDb.outbox.update(item.id, {
        status: 'pending',
        nextRetryAt: Date.now() + (parseInt(result.retryAfter || '30', 10) * 1000 || 30_000),
        lastError: result.error,
        updatedAt: new Date().toISOString(),
      });
      skippedByCircuit++;
    } else {
      await markFailed(item.id, result.error || 'unknown', result.retryAfter);
      failed++;
    }
  }

  await purgeAcked();
  return {
    processed,
    failed,
    remaining: await countPending(),
    nextRetryAt: await soonestRetryAt(),
    circuitOpen: syncCircuit.snapshot().state === 'OPEN',
    skippedByCircuit,
  };
}

export async function getOutboxSnapshot() {
  const all = await henizaDb.outbox.orderBy('createdAt').reverse().limit(40).toArray();
  return {
    pending: all.filter((i) => i.status === 'pending' || i.status === 'in_flight').length,
    failed: all.filter((i) => i.status === 'failed').length,
    circuit: {
      sync: syncCircuit.snapshot(),
      diagnose: diagnoseCircuit.snapshot(),
    },
    items: all.map((i) => ({
      ...i,
      waitMs: Math.max(0, i.nextRetryAt - Date.now()),
      suggestedBackoffMs: exponentialBackoffMs(i.attempts || 1),
    })),
  };
}

export { exponentialBackoffMs, resolveRetryDelayMs, syncCircuit, diagnoseCircuit };
