/**
 * POST /api/sync — outbox Dexie → Postgres (cases) + feed
 * GET  /api/sync?pull=1&since=ISO — pull de OS alteradas
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { authFromRequest } from './_lib/authTokens';
import { publishFeedEvent } from './_lib/realtimeStore';
import { upsertCase, listCasesSince, caseCount } from './_lib/caseStore';
import { isPostgresEnabled } from './_lib/pg';

declare global {
  // eslint-disable-next-line no-var
  var __henizaSyncIdem: Set<string> | undefined;
}

function seenKeys(): Set<string> {
  if (!global.__henizaSyncIdem) global.__henizaSyncIdem = new Set();
  return global.__henizaSyncIdem;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Idempotency-Key, Authorization');

  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method === 'GET') {
    if (String(req.query.pull || '') === '1') {
      const since = String(req.query.since || '');
      const cases = await listCasesSince(since || undefined, 80);
      return res.status(200).json({
        ok: true,
        cases,
        storage: isPostgresEnabled() ? 'postgres' : 'memory',
        serverTime: new Date().toISOString(),
      });
    }
    return res.status(200).json({
      ok: true,
      service: 'heniza-sync',
      cases: await caseCount(),
      storage: isPostgresEnabled() ? 'postgres' : 'memory',
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

    const keys = seenKeys();
    if (idempotencyKey && keys.has(idempotencyKey)) {
      return res.status(200).json({ ok: true, deduped: true });
    }
    if (idempotencyKey) {
      keys.add(idempotencyKey);
      if (keys.size > 5000) {
        const first = keys.values().next().value;
        if (first) keys.delete(first);
      }
    }

    if (type === 'CASE_UPSERT') {
      const c = payload?.case || payload;
      const id = String(c?.id || body.clientId || '');
      if (!id) return res.status(400).json({ ok: false, error: 'case id missing' });

      const result = await upsertCase({
        id,
        plate: c?.plate,
        chassis: c?.chassis,
        make: c?.make,
        model: c?.model,
        currentStage: c?.currentStage,
        rev: payload?.rev ?? c?.rev,
        snapshot: c,
        deviceId: body.deviceId,
      });

      if (result.conflict) {
        return res.status(409).json({
          ok: false,
          conflict: true,
          serverCase: result.case,
          serverRev: result.serverRev,
        });
      }

      try {
        await publishFeedEvent({
          type: 'case',
          plate: c?.plate,
          chassis: c?.chassis,
          caseId: id,
          title: `OS ${id} · ${c?.currentStage || 'atualizada'}`,
          body: `${c?.make || ''} ${c?.model || ''}`.trim(),
          authorId: user?.sub,
          authorName: user?.name,
        });
      } catch {
        /* */
      }

      return res.status(200).json({
        ok: true,
        id,
        serverRev: result.serverRev,
        storage: isPostgresEnabled() ? 'postgres' : 'memory',
      });
    }

    if (type === 'PHOTO_UPLOAD') {
      // Metadados only — blob fica no cliente (OPFS). Opcional: object storage depois.
      try {
        await publishFeedEvent({
          type: 'photo',
          caseId: String(payload?.caseId || ''),
          title: `Foto ${payload?.slotId || ''} · OS ${payload?.caseId || ''}`,
          authorId: user?.sub,
          authorName: user?.name,
        });
      } catch {
        /* */
      }
      return res.status(200).json({
        ok: true,
        photoId: payload?.photoId,
        received: true,
        note: 'metadata ack — blob em OPFS no dispositivo',
      });
    }

    if (type === 'DIAGNOSIS_ENRICH' || type === 'diagnosis') {
      return res.status(200).json({ ok: true, note: 'diagnosis accepted' });
    }

    if (
      type === 'BUDGET_CONFIRM' ||
      type === 'budget' ||
      type === 'ERP_MANIFEST' ||
      type === 'stock' ||
      type === 'history'
    ) {
      return res.status(200).json({ ok: true });
    }

    return res.status(200).json({ ok: true, note: 'unknown type accepted' });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: e?.message || 'sync error' });
  }
}
