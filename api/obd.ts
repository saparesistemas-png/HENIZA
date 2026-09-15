import type { VercelRequest, VercelResponse } from '@vercel/node';
import { extractObdCodes, getObdStats, lookupObdCode } from './_lib/obdDatabase.js';
import { diagnoseTemperature, TEMP_SENSORS, TEMP_DTC } from './_lib/temperatureSensors.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET' && (req.query.stats === '1' || req.query.stats === 'true')) {
      const stats = await getObdStats();
      return res.status(200).json({
        ok: true,
        stats: {
          ...stats,
          temperatureSensors: TEMP_SENSORS.length,
          temperatureDtcs: Object.keys(TEMP_DTC).length,
        },
      });
    }

    if (req.method === 'GET' && (req.query.temp === '1' || req.query.sensors === 'temp')) {
      return res.status(200).json({
        ok: true,
        sensors: TEMP_SENSORS.map((s) => ({
          id: s.id,
          name: s.name,
          location: s.location,
          typicalRangeC: s.typicalRangeC,
          relatedCodes: s.relatedCodes,
        })),
      });
    }

    let text = '';
    if (req.method === 'GET') {
      text = String(req.query.code || req.query.q || req.query.description || '');
    } else if (req.method === 'POST') {
      const body = (req.body || {}) as Record<string, unknown>;
      text = String(body.code || body.codes || body.description || body.q || '');
    } else {
      res.setHeader('Allow', 'GET, POST');
      return res.status(405).json({ ok: false, error: 'Method not allowed' });
    }

    const codes = extractObdCodes(text);
    if (!codes.length && text && /^[PCBU][0-9A-F]{4}$/i.test(text.trim())) {
      codes.push(text.trim().toUpperCase());
    }

    const results = [];
    for (const code of codes.slice(0, 8)) {
      const entry = await lookupObdCode(code);
      const temp = TEMP_DTC[code];
      results.push({
        ...(entry || {
          code,
          title: temp?.title || 'Código não encontrado',
          meaning: temp?.meaning || 'Sem definição na base.',
          checks: temp?.checks || ['Confirmar no scanner'],
          source: temp ? 'temp-module' : 'none',
        }),
        temperatureSensor: temp?.sensor || null,
      });
    }

    const tempDiag = diagnoseTemperature(text);

    if (!results.length && !tempDiag) {
      return res.status(400).json({
        ok: false,
        error: 'Informe code=P0118 ou description=superaquecimento',
      });
    }

    return res.status(200).json({
      ok: true,
      count: results.length,
      results,
      temperature: tempDiag
        ? {
            problemName: tempDiag.problemName,
            severity: tempDiag.severity,
            sensors: tempDiag.matchedSensors.map((s) => ({
              id: s.id,
              name: s.name,
              location: s.location,
              typicalRangeC: s.typicalRangeC,
              resistanceHint: s.resistanceHint,
            })),
            checks: tempDiag.checks,
            codes: tempDiag.codes,
            notes: tempDiag.diagnosticNotes,
          }
        : null,
    });
  } catch (err: any) {
    console.error('[obd]', err);
    return res.status(500).json({ ok: false, error: String(err?.message || err).slice(0, 200) });
  }
}
