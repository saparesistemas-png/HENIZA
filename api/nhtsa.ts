import type { VercelRequest, VercelResponse } from '@vercel/node';
import { autoSearchNhtsa, decodeVinNhtsa } from './_lib/publicTechnicalApis.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const make = String(req.query.make || '').trim();
  const model = String(req.query.model || '').trim();
  const year = String(req.query.year || '').trim() || undefined;
  const vin = String(req.query.vin || '').trim();
  const description = String(req.query.q || req.query.description || '').trim();

  try {
    let resolvedMake = make;
    let resolvedModel = model;
    let resolvedYear = year;
    let vinDecoded = null as Awaited<ReturnType<typeof decodeVinNhtsa>>;

    if (vin && vin.replace(/\s/g, '').length >= 11) {
      vinDecoded = await decodeVinNhtsa(vin);
      if (vinDecoded) {
        resolvedMake = resolvedMake || vinDecoded.make || '';
        resolvedModel = resolvedModel || vinDecoded.model || '';
        resolvedYear = resolvedYear || vinDecoded.year;
      }
    }

    if (!resolvedMake || !resolvedModel) {
      return res.status(400).json({
        ok: false,
        error: 'Informe make+model ou vin.',
        example: '/api/nhtsa?make=Ford&model=Focus&year=2015',
      });
    }

    const result = await autoSearchNhtsa({
      make: resolvedMake,
      model: resolvedModel,
      year: resolvedYear,
      description,
    });

    return res.status(200).json({
      ok: true,
      query: {
        make: resolvedMake,
        model: resolvedModel,
        year: resolvedYear,
        vin: vin || undefined,
      },
      vinDecoded: vinDecoded || undefined,
      softwareCampaigns: result.softwareHits.length,
      recallsAndComplaints: result.hits.length,
      summary: result.summaryLines,
      sources: result.sources,
      hits: result.hits,
      softwareHits: result.softwareHits,
      complaintHits: result.complaintHits,
    });
  } catch (err: any) {
    return res.status(500).json({
      ok: false,
      error: String(err?.message || err).slice(0, 200),
    });
  }
}
