/**
 * POST /api/sync — recebe itens da outbox Dexie (CASE_UPSERT, PHOTO_UPLOAD, ...).
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { authFromRequest } from './_lib/authTokens';
import { publishFeedEvent } from './_lib/realtimeStore';

const memoryCases = new Map<string, unknown>();
const memoryPhotos: Array<{ caseId: string; slotId: string; at: string }> = [];
const seenKeys = new Set<string>();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Idempotency-Key, Authorization');

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
    const user = authFromRequest(req);

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
      try {
        publishFeedEvent({
          type: 'case',
          plate: c?.plate,
          chassis: c?.chassis,
          caseId: String(id || ''),
          title: `OS ${id} · ${c?.currentStage || 'atualizada'}`,
          body: `${c?.make || ''} ${c?.model || ''}`.trim(),
          authorId: user?.sub,
          authorName: user?.name,
        });
      } catch {
        /* */
      }
      return res.status(200).json({ ok: true, id });
    }

    if (type === 'PHOTO_UPLOAD') {
      memoryPhotos.push({
        caseId: String(payload?.caseId || ''),
        slotId: String(payload?.slotId || ''),
        at: new Date().toISOString(),
      });
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
