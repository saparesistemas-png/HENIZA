import type { VercelRequest, VercelResponse } from '@vercel/node';
import { extractObdCodes, getObdStats, lookupObdCode } from './_lib/obdDatabase.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET' && (req.query.stats === '1' || req.query.stats === 'true')) {
      const stats = await getObdStats();
      return res.status(200).json({ ok: true, stats });
    }

    let codes: string[] = [];

    if (req.method === 'GET') {
      const q = String(req.query.code || req.query.q || '');
      codes = extractObdCodes(q) || (q ? [q.toUpperCase()] : []);
    } else if (req.method === 'POST') {
      const body = (req.body || {}) as Record<string, unknown>;
      const raw = String(body.code || body.codes || body.description || '');
      codes = extractObdCodes(raw);
      if (!codes.length && body.code) codes = [String(body.code).toUpperCase()];
    } else {
      res.setHeader('Allow', 'GET, POST');
      return res.status(405).json({ ok: false, error: 'Method not allowed' });
    }

    codes = codes.filter((c) => /^[PCBU][0-9A-F]{4}$/i.test(c)).slice(0, 8);
    if (!codes.length) {
      return res.status(400).json({
        ok: false,
        error: 'Informe code=P0300 (GET) ou { "code": "P0300" } (POST).',
      });
    }

    const results = [];
    for (const code of codes) {
      const entry = await lookupObdCode(code);
      results.push(
        entry || {
          code,
          title: 'Código não encontrado na base',
          meaning: 'Sem definição na base local/remota. Confirme no scanner e manual da montadora.',
          checks: ['Confirmar no scanner', 'Consultar manual OEM/RMI'],
          source: 'none',
        }
      );
    }

    return res.status(200).json({
      ok: true,
      count: results.length,
      results,
    });
  } catch (err: any) {
    console.error('[obd]', err);
    return res.status(500).json({ ok: false, error: String(err?.message || err).slice(0, 200) });
  }
}
