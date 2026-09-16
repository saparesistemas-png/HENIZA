/**
 * Fila outbox Dexie — enqueue, retry exponencial, flush online.
 */
import {
  henizaDb,
  getDeviceId,
  type OutboxItem,
  type OutboxType,
  type LocalCaseRow,
  type LocalPhotoMeta,
} from './henizaDb';

const DEFAULT_MAX_ATTEMPTS = 8;

function uuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `obx-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function backoffMs(attempts: number): number {
  // 30s, 1m, 2m, 5m, 15m, 30m, 1h, 2h
  const steps = [30, 60, 120, 300, 900, 1800, 3600, 7200].map((s) => s * 1000);
  return steps[Math.min(attempts, steps.length - 1)];
}

export type EnqueueInput = {
  type: OutboxType;
  payload: unknown;
  caseId?: string;
  /** Se omitido, deriva de type+caseId+hash simples */
  idempotencyKey?: string;
  maxAttempts?: number;
};

export async function enqueueOutbox(input: EnqueueInput): Promise<OutboxItem> {
  const now = new Date().toISOString();
  const idempotencyKey =
    input.idempotencyKey ||
    `${input.type}:${input.caseId || 'na'}:${JSON.stringify(input.payload).slice(0, 80)}`;

  // Dedup: se já existe pending/in_flight com mesma chave, atualiza payload
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

export async function markFailed(id: string, error: string): Promise<void> {
  const item = await henizaDb.outbox.get(id);
  if (!item) return;
  const attempts = item.attempts + 1;
  const exhausted = attempts >= item.maxAttempts;
  await henizaDb.outbox.update(id, {
    attempts,
    status: exhausted ? 'failed' : 'pending',
    nextRetryAt: Date.now() + backoffMs(attempts),
    lastError: error.slice(0, 500),
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

/** Persistência local da OS + enfileira CASE_UPSERT */
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

  // Payload leve para sync (sem dataUrls)
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

export async function savePhotoLocal(meta: Omit<LocalPhotoMeta, 'uploaded'> & { uploaded?: boolean }) {
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
        // dataUrl só no push real; aqui referenciamos id para o worker ler do store
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
};

async function postItem(item: OutboxItem): Promise<{ ok: boolean; error?: string }> {
  const deviceId = await getDeviceId();

  if (item.type === 'PHOTO_UPLOAD') {
    const payload = item.payload as { photoIdRef?: string; photoId?: string };
    const photoId = payload.photoIdRef || payload.photoId;
    const photo = photoId ? await henizaDb.photos.get(photoId) : null;
    if (!photo?.dataUrl) {
      // sem binário — marca acked para não loop infinito (migração)
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
      if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
      const json = await res.json().catch(() => ({}));
      if (json?.ok === false) return { ok: false, error: json?.error || 'sync failed' };
      await henizaDb.photos.update(photo.id, { uploaded: true });
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e?.message || 'network' };
    }
  }

  // CASE_UPSERT, DIAGNOSIS_ENRICH, ERP, legacy types
  const endpoint =
    item.type === 'diagnosis'
      ? '/api/diagnose'
      : item.type === 'budget' || item.type === 'BUDGET_CONFIRM'
        ? '/api/sync'
        : '/api/sync';

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
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    const json = await res.json().catch(() => ({}));
    if (json?.ok === false) return { ok: false, error: String(json?.error || 'fail') };

    if (item.type === 'CASE_UPSERT' && item.caseId) {
      await henizaDb.cases.update(item.caseId, { syncStatus: 'synced' });
    }
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'network' };
  }
}

/** Processa a fila (chamar quando online). */
export async function flushOutbox(): Promise<OutboxFlushResult> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { processed: 0, failed: 0, remaining: await countPending() };
  }

  const batch = await listPending(20);
  let processed = 0;
  let failed = 0;

  for (const item of batch) {
    if (typeof navigator !== 'undefined' && !navigator.onLine) break;
    await markInFlight(item.id);
    const result = await postItem(item);
    if (result.ok) {
      await markAcked(item.id);
      processed++;
    } else {
      await markFailed(item.id, result.error || 'unknown');
      failed++;
    }
  }

  await purgeAcked();
  return {
    processed,
    failed,
    remaining: await countPending(),
  };
}

export async function getOutboxSnapshot() {
  const all = await henizaDb.outbox.orderBy('createdAt').reverse().limit(40).toArray();
  return {
    pending: all.filter((i) => i.status === 'pending' || i.status === 'in_flight').length,
    failed: all.filter((i) => i.status === 'failed').length,
    items: all,
  };
}
