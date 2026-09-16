/**
 * POST /api/sync — recebe itens da outbox Dexie (CASE_UPSERT, PHOTO_UPLOAD, ...).
 * Persistência em memória por instância (demo); trocar por Postgres/Blob em produção.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

const memoryCases = new Map<string, unknown>();
const memoryPhotos: Array<{ caseId: string; slotId: string; at: string }> = [];
const seenKeys = new Set<string>();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Idempotency-Key');

  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method === 'GET') {
    return res.status(200).json({
      ok: true,
      service: 'heniza-sync',
      cases: memoryCases.size,
      photos: memoryPhotos.length,
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const type = body.type as string;
    const idempotencyKey =
      (req.headers['idempotency-key'] as string) || body.idempotencyKey || '';
    const payload = body.payload;

    if (idempotencyKey && seenKeys.has(idempotencyKey)) {
      return res.status(200).json({ ok: true, deduped: true });
    }
    if (idempotencyKey) {
      seenKeys.add(idempotencyKey);
      if (seenKeys.size > 5000) {
        const first = seenKeys.values().next().value;
        if (first) seenKeys.delete(first);
      }
    }

    if (type === 'CASE_UPSERT') {
      const c = payload?.case || payload;
      const id = c?.id || body.clientId;
      if (id) memoryCases.set(String(id), { ...c, deviceId: body.deviceId, syncedAt: new Date().toISOString() });
      return res.status(200).json({ ok: true, id });
    }

    if (type === 'PHOTO_UPLOAD') {
      memoryPhotos.push({
        caseId: String(payload?.caseId || ''),
        slotId: String(payload?.slotId || ''),
        at: new Date().toISOString(),
      });
      // não persistir dataUrl em memória de demo
      return res.status(200).json({
        ok: true,
        photoId: payload?.photoId,
        received: true,
      });
    }

    if (type === 'DIAGNOSIS_ENRICH' || type === 'diagnosis') {
      return res.status(200).json({ ok: true, note: 'diagnosis accepted for enrichment queue' });
    }

    if (type === 'BUDGET_CONFIRM' || type === 'budget' || type === 'ERP_MANIFEST') {
      return res.status(200).json({ ok: true });
    }

    if (type === 'stock' || type === 'history') {
      return res.status(200).json({ ok: true });
    }

    return res.status(200).json({ ok: true, note: 'unknown type accepted' });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: e?.message || 'sync error' });
  }
}
