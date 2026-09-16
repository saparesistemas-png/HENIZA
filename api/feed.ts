import type { VercelRequest, VercelResponse } from '@vercel/node';
import { authFromRequest } from './_lib/authTokens';
import { listFeedSince, publishFeedEvent } from './_lib/realtimeStore';
import { isPostgresEnabled } from './_lib/pg';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const user = authFromRequest(req);
  if (!user) {
    return res.status(401).json({ ok: false, error: 'Login online necessário para o feed' });
  }

  if (req.method === 'GET') {
    const since = String(req.query.since || '');
    const plate = String(req.query.plate || '');
    const chassis = String(req.query.chassis || '');
    const events = await listFeedSince({
      since: since || undefined,
      plate: plate || undefined,
      chassis: chassis || undefined,
      limit: 80,
    });
    return res.status(200).json({
      ok: true,
      serverTime: new Date().toISOString(),
      events,
      storage: isPostgresEnabled() ? 'postgres' : 'memory',
      user: { id: user.sub, email: user.email },
    });
  }

  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      const evt = await publishFeedEvent({
        type: body.type || 'system',
        workshopId: body.workshopId || user.workshop,
        plate: body.plate ? String(body.plate).toUpperCase() : undefined,
        chassis: body.chassis ? String(body.chassis).toUpperCase() : undefined,
        vehicleId: body.vehicleId,
        caseId: body.caseId,
        title: String(body.title || 'Evento').slice(0, 200),
        body: body.body ? String(body.body).slice(0, 1000) : undefined,
        codes: Array.isArray(body.codes) ? body.codes : undefined,
        odometerKm: body.odometerKm != null ? Number(body.odometerKm) : undefined,
        authorId: user.sub,
        authorName: user.name,
        payload: body.payload,
      });
      return res.status(200).json({ ok: true, event: evt, storage: isPostgresEnabled() ? 'postgres' : 'memory' });
    } catch (e: any) {
      return res.status(500).json({ ok: false, error: e?.message || 'feed error' });
    }
  }

  return res.status(405).json({ ok: false, error: 'Method not allowed' });
}
