/**
 * Fontes técnicas públicas / opcionais para o OficIA.
 * - Banco OBD + sensores de temperatura
 * - NHTSA + Open Labor (opcional)
 */

import { lookupObdCode, extractObdCodes } from './obdDatabase.js';
import {
  diagnoseTemperature,
  temperatureHitsFromDiagnosis,
  TEMP_DTC,
} from './temperatureSensors.js';

export type PublicHit = {
  title: string;
  url?: string;
  snippet: string;
  kind: 'recall' | 'complaint' | 'dtc' | 'vin' | 'oem' | 'web' | 'torque' | 'labor';
};

export type TorqueSpecRow = {
  job?: string;
  component: string;
  nm?: number | null;
  lbFt?: number | null;
  angleDegrees?: number | null;
  isCritical?: boolean;
  notes?: string;
};

export type LaborTimeRow = {
  job: string;
  hours?: number;
  notes?: string;
};

export type PublicTechnicalBundle = {
  summaryLines: string[];
  hits: PublicHit[];
  sources: string[];
  vinDecoded?: { make?: string; model?: string; year?: string; plant?: string };
  dtc?: { code: string; title: string; meaning: string; checks: string[] };
  torqueSpecs?: TorqueSpecRow[];
  laborTimes?: LaborTimeRow[];
  temperature?: {
    sensors: string[];
    checks: string[];
    severity: string;
    problemName: string;
  };
};

function extractYear(text: string): string | undefined {
  const m = (text || '').match(/\b(19|20)\d{2}\b/);
  return m ? m[0] : undefined;
}

function inferJobSlug(description: string, code?: string | null): string | undefined {
  const q = (description || '').toLowerCase();
  if (code && /^P030/.test(code)) return 'spark-plugs';
  if (/vela|spark|bobina|misfire|falha de combust/.test(q)) return 'spark-plugs';
  if (/pastilha|freio|brake/.test(q)) return 'brake-pads-front';
  if (/óleo|oil change|troca de oleo|troca de óleo/.test(q)) return 'oil-change';
  if (/termostato|arrefec|radiador|superaquec/.test(q)) return 'thermostat';
  if (/bateria|battery/.test(q)) return 'battery-replacement';
  return undefined;
}

async function fetchJson(url: string, timeoutMs = 8000): Promise<any | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { Accept: 'application/json', 'User-Agent': 'HENIZA-OficIA/1.0' },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

async function olpFetch(pathAndQuery: string): Promise<any | null> {
  const key = process.env.OPEN_LABOR_API_KEY;
  if (!key) return null;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 10000);
  try {
    const res = await fetch(`https://openlaborproject.com${pathAndQuery}`, {
      signal: ctrl.signal,
      headers: {
        Accept: 'application/json',
        'x-api-key': key,
        Authorization: `Bearer ${key}`,
        'User-Agent': 'HENIZA-OficIA/1.0',
      },
    });
    clearTimeout(t);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

export async function decodeVinNhtsa(vin: string) {
  const clean = vin.replace(/\s/g, '').toUpperCase();
  if (clean.length < 11) return null;
  const data = await fetchJson(
    `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${encodeURIComponent(clean)}?format=json`
  );
  const r = data?.Results?.[0];
  if (!r) return null;
  return {
    make: r.Make || undefined,
    model: r.Model || undefined,
    year: r.ModelYear || undefined,
    plant: r.PlantCity || undefined,
  };
}

export async function fetchNhtsaRecalls(make: string, model: string, year?: string): Promise<PublicHit[]> {
  if (!make || !model) return [];
  const y = year || '2020';
  const url =
    `https://api.nhtsa.gov/recalls/recallsByVehicle?make=${encodeURIComponent(make)}` +
    `&model=${encodeURIComponent(model)}&modelYear=${encodeURIComponent(y)}`;
  const data = await fetchJson(url);
  return (data?.results || []).slice(0, 5).map((r: any) => ({
    title: `Recall NHTSA ${r.NHTSACampaignNumber || ''} — ${r.Component || 'componente'}`,
    url: r.NHTSACampaignNumber
      ? `https://www.nhtsa.gov/recalls?nhtsaId=${r.NHTSACampaignNumber}`
      : 'https://www.nhtsa.gov/recalls',
    snippet: [r.Summary, r.Remedy].filter(Boolean).join(' ').slice(0, 320),
    kind: 'recall' as const,
  }));
}

export async function fetchNhtsaComplaints(make: string, model: string, year?: string): Promise<PublicHit[]> {
  if (!make || !model) return [];
  const y = year || '2020';
  const url =
    `https://api.nhtsa.gov/complaints/complaintsByVehicle?make=${encodeURIComponent(make)}` +
    `&model=${encodeURIComponent(model)}&modelYear=${encodeURIComponent(y)}`;
  const data = await fetchJson(url);
  const results = data?.results || data?.complaints || [];
  return (Array.isArray(results) ? results : []).slice(0, 3).map((r: any) => ({
    title: `Reclamação NHTSA ${r.odiNumber || ''} — ${r.components || 'sistema'}`,
    url: 'https://www.nhtsa.gov/recalls',
    snippet: String(r.summary || r.complaintSummary || r.components || '').slice(0, 280),
    kind: 'complaint' as const,
  }));
}

export async function fetchOpenLaborDtc(code: string): Promise<PublicHit | null> {
  const data = await olpFetch(`/api/v1/dtc-codes?code=${encodeURIComponent(code)}`);
  if (!data) return null;
  const row = Array.isArray(data) ? data[0] : data?.data?.[0] || data?.data || data;
  if (!row || typeof row !== 'object') return null;
  return {
    title: `OLP ${code}: ${(row as any).title || (row as any).description || 'DTC'}`,
    url: 'https://openlaborproject.com/eu/dtc-codes/',
    snippet: String((row as any).description || (row as any).summary || '').slice(0, 300),
    kind: 'dtc',
  };
}

export async function fetchOpenLaborTorqueSpecs(input: {
  make: string;
  model: string;
  year: string;
  job?: string;
}): Promise<{ rows: TorqueSpecRow[]; hits: PublicHit[] }> {
  if (!input.make || !input.model || !input.year) return { rows: [], hits: [] };
  const qs = new URLSearchParams({
    make: input.make.toLowerCase(),
    model: input.model.toLowerCase().replace(/\s+/g, '-'),
    year: input.year,
  });
  if (input.job) qs.set('job', input.job);
  const data = await olpFetch(`/api/v1/torque-specs?${qs.toString()}`);
  if (!data) return { rows: [], hits: [] };
  const list: any[] =
    data?.data?.torqueSpecs || data?.torqueSpecs || data?.data || (Array.isArray(data) ? data : []);
  if (!Array.isArray(list) || !list.length) return { rows: [], hits: [] };
  const rows: TorqueSpecRow[] = list.slice(0, 12).map((t: any) => ({
    job: t.job,
    component: t.component || t.name || 'Fixador',
    nm: t.nm ?? t.torqueNm ?? null,
    lbFt: t.lbFt ?? t.torqueLbFt ?? null,
    angleDegrees: t.angleDegrees ?? t.angle ?? null,
    isCritical: Boolean(t.isCritical),
    notes: t.notes,
  }));
  const hits: PublicHit[] = rows.slice(0, 6).map((t) => ({
    title: `Torque OLP: ${t.component}${t.nm != null ? ` — ${t.nm} N·m` : ''}`,
    url: 'https://openlaborproject.com/docs/api',
    snippet: [t.job, t.isCritical ? 'CRÍTICO' : '', t.notes].filter(Boolean).join(' · '),
    kind: 'torque' as const,
  }));
  return { rows, hits };
}

export async function fetchOpenLaborLaborTimes(input: {
  make: string;
  model: string;
  year: string;
  job?: string;
}): Promise<{ rows: LaborTimeRow[]; hits: PublicHit[] }> {
  if (!input.make || !input.model || !input.year) return { rows: [], hits: [] };
  const qs = new URLSearchParams({
    make: input.make.toLowerCase(),
    model: input.model.toLowerCase().replace(/\s+/g, '-'),
    year: input.year,
  });
  if (input.job) qs.set('job', input.job);
  const data = await olpFetch(`/api/v1/labor-times?${qs.toString()}`);
  if (!data) return { rows: [], hits: [] };
  const list: any[] =
    data?.data?.laborTimes || data?.data?.jobs || data?.laborTimes || data?.data || (Array.isArray(data) ? data : []);
  if (!Array.isArray(list) || !list.length) return { rows: [], hits: [] };
  const rows: LaborTimeRow[] = list.slice(0, 10).map((j: any) => ({
    job: j.job || j.name || j.description || 'Serviço',
    hours: typeof j.hours === 'number' ? j.hours : typeof j.time === 'number' ? j.time : undefined,
    notes: j.notes,
  }));
  const hits: PublicHit[] = rows.slice(0, 5).map((j) => ({
    title: `Mão de obra OLP: ${j.job}${j.hours != null ? ` — ${j.hours} h` : ''}`,
    url: 'https://openlaborproject.com/docs/api',
    snippet: j.notes || 'Tempo OLP',
    kind: 'labor' as const,
  }));
  return { rows, hits };
}

export async function gatherPublicTechnicalData(input: {
  description?: string;
  make?: string;
  model?: string;
  chassis?: string;
}): Promise<PublicTechnicalBundle> {
  const desc = input.description || '';
  const codes = extractObdCodes(desc);
  const code = codes[0] || null;
  let make = (input.make || '').trim();
  let model = (input.model || '').split(/[\s(]/)[0]?.trim() || '';
  let year = extractYear(desc) || extractYear(input.model || '');

  const hits: PublicHit[] = [];
  const summaryLines: string[] = [];
  const sources: string[] = [];
  let vinDecoded: PublicTechnicalBundle['vinDecoded'];
  let dtc: PublicTechnicalBundle['dtc'];
  let torqueSpecs: TorqueSpecRow[] | undefined;
  let laborTimes: LaborTimeRow[] | undefined;
  let temperature: PublicTechnicalBundle['temperature'];

  if (input.chassis && input.chassis.replace(/\s/g, '').length >= 11) {
    vinDecoded = (await decodeVinNhtsa(input.chassis)) || undefined;
    if (vinDecoded?.make) {
      make = make || vinDecoded.make;
      model = model || vinDecoded.model || model;
      year = year || vinDecoded.year;
      summaryLines.push(
        `VIN: ${vinDecoded.make || ''} ${vinDecoded.model || ''} ${vinDecoded.year || ''}`.trim()
      );
      hits.push({
        title: 'Decode VIN — NHTSA',
        url: 'https://vpic.nhtsa.dot.gov/',
        snippet: `${vinDecoded.make} ${vinDecoded.model} ${vinDecoded.year}`,
        kind: 'vin',
      });
      sources.push('NHTSA vPIC');
    }
  }

  // Sensores de temperatura (ECT/IAT/óleo/TFT/CAT/EV)
  const tempDiag = diagnoseTemperature(desc);
  if (tempDiag) {
    temperature = {
      sensors: tempDiag.matchedSensors.map((s) => s.id),
      checks: tempDiag.checks,
      severity: tempDiag.severity,
      problemName: tempDiag.problemName,
    };
    summaryLines.push(...tempDiag.summaryLines.slice(0, 6));
    hits.push(
      ...temperatureHitsFromDiagnosis(tempDiag).map((h) => ({
        title: h.title,
        snippet: h.snippet,
        kind: 'dtc' as const,
      }))
    );
    sources.push('OficIA — sensores de temperatura');
    if (!dtc && tempDiag.codes[0] && TEMP_DTC[tempDiag.codes[0]]) {
      const t = TEMP_DTC[tempDiag.codes[0]];
      dtc = {
        code: tempDiag.codes[0],
        title: t.title,
        meaning: t.meaning,
        checks: tempDiag.checks.slice(0, 6),
      };
    }
  }

  for (const c of codes.slice(0, 5)) {
    const entry = await lookupObdCode(c);
    if (!entry) continue;
    if (!dtc) {
      dtc = {
        code: entry.code,
        title: entry.title,
        meaning: entry.meaning,
        checks: entry.checks,
      };
    }
    summaryLines.push(`DTC ${entry.code} [${entry.source}]: ${entry.title}`);
    hits.push({
      title: `DTC ${entry.code} — ${entry.title}`,
      snippet: `${entry.meaning} | ${entry.checks.join('; ')}`,
      kind: 'dtc',
      url: 'https://heniza.vercel.app/api/obd?code=' + entry.code,
    });
    sources.push(
      entry.source === 'local'
        ? 'Banco OBD OficIA'
        : entry.source === 'obd-pt'
          ? 'OBDIICodes PT-BR'
          : 'OBDIICodes EN'
    );
  }

  if (code) {
    const olp = await fetchOpenLaborDtc(code);
    if (olp) {
      hits.push(olp);
      sources.push('Open Labor Project');
    }
  }

  const job = inferJobSlug(desc, code);
  const yearForOlp = year || '2018';
  if (make && model && process.env.OPEN_LABOR_API_KEY) {
    const [torque, labor] = await Promise.all([
      fetchOpenLaborTorqueSpecs({ make, model, year: yearForOlp, job }),
      fetchOpenLaborLaborTimes({ make, model, year: yearForOlp, job }),
    ]);
    if (torque.rows.length) {
      torqueSpecs = torque.rows;
      hits.push(...torque.hits);
      sources.push('OLP torque');
    }
    if (labor.rows.length) {
      laborTimes = labor.rows;
      hits.push(...labor.hits);
      sources.push('OLP labor');
    }
  }

  if (make && model) {
    const years = year ? [year] : ['2022', '2020'];
    for (const y of years.slice(0, 2)) {
      const recalls = await fetchNhtsaRecalls(make, model, y);
      if (recalls.length) {
        hits.push(...recalls);
        summaryLines.push(`NHTSA ${make} ${model} ${y}: ${recalls.length} recall(s).`);
        sources.push('NHTSA Recalls');
        break;
      }
    }
  }

  if (!summaryLines.length) summaryLines.push('Sem dados específicos nesta consulta.');
  sources.push('https://www.nhtsa.gov/recalls');

  return {
    summaryLines,
    hits: hits.slice(0, 16),
    sources: Array.from(new Set(sources)),
    vinDecoded,
    dtc,
    torqueSpecs,
    laborTimes,
    temperature,
  };
}
