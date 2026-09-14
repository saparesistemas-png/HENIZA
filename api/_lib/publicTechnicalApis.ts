/**
 * Fontes técnicas públicas / opcionais para o OficIA.
 * - NHTSA: recalls, complaints, VIN
 * - DTC local OBD-II
 * - Open Labor Project (OPEN_LABOR_API_KEY): dtc-codes, torque-specs, labor-times
 */

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
};

function extractDtc(text: string): string | null {
  const m = (text || '').match(/\b([PCBU]\d{4})\b/i);
  return m ? m[1].toUpperCase() : null;
}

function extractYear(text: string): string | undefined {
  const m = (text || '').match(/\b(19|20)\d{2}\b/);
  return m ? m[0] : undefined;
}

/** Mapeia sintoma/DTC → job slug OLP (quando possível). */
function inferJobSlug(description: string, code?: string | null): string | undefined {
  const q = (description || '').toLowerCase();
  if (code && /^P030/.test(code)) return 'spark-plugs';
  if (/vela|spark|bobina|misfire|falha de combust/.test(q)) return 'spark-plugs';
  if (/pastilha|freio|brake/.test(q)) return 'brake-pads-front';
  if (/óleo|oil change|troca de oleo|troca de óleo/.test(q)) return 'oil-change';
  if (/correi|timing belt|correia dentada/.test(q)) return 'timing-belt';
  if (/bateria|battery/.test(q)) return 'battery-replacement';
  if (/filtro de ar|air filter/.test(q)) return 'air-filter';
  return undefined;
}

const DTC_DB: Record<string, { title: string; meaning: string; checks: string[] }> = {
  P0300: {
    title: 'Random/Multiple Cylinder Misfire Detected',
    meaning:
      'Falha de combustão aleatória ou em vários cilindros. Pode danificar o catalisador se persistir.',
    checks: [
      'Confirmar cilindros com P0301–P030x',
      'Velas e bobinas',
      'Pressão de combustível',
      'Vazamento de vácuo / ar falso',
      'Compressão se elétrico/combustível OK',
    ],
  },
  P0301: {
    title: 'Cylinder 1 Misfire Detected',
    meaning: 'Falha de combustão no cilindro 1.',
    checks: ['Bobina/vela do cil. 1', 'Injetor 1', 'Compressão cil. 1'],
  },
  P0302: {
    title: 'Cylinder 2 Misfire Detected',
    meaning: 'Falha de combustão no cilindro 2.',
    checks: ['Bobina/vela do cil. 2', 'Injetor 2', 'Compressão cil. 2'],
  },
  P0303: {
    title: 'Cylinder 3 Misfire Detected',
    meaning: 'Falha de combustão no cilindro 3.',
    checks: ['Bobina/vela do cil. 3', 'Injetor 3', 'Compressão cil. 3'],
  },
  P0304: {
    title: 'Cylinder 4 Misfire Detected',
    meaning: 'Falha de combustão no cilindro 4.',
    checks: ['Bobina/vela do cil. 4', 'Injetor 4', 'Compressão cil. 4'],
  },
  P0171: {
    title: 'System Too Lean (Bank 1)',
    meaning: 'Mistura pobre no banco 1.',
    checks: ['Vazamento de admissão', 'MAF/MAP', 'Pressão combustível', 'Sonda lambda'],
  },
  P0172: {
    title: 'System Too Rich (Bank 1)',
    meaning: 'Mistura rica no banco 1.',
    checks: ['Injetores vazando', 'Sensor MAF', 'Pressão combustível alta'],
  },
  P0420: {
    title: 'Catalyst System Efficiency Below Threshold (Bank 1)',
    meaning: 'Eficiência do catalisador abaixo do limite (banco 1).',
    checks: ['Sondas', 'Fugas de escape', 'Catalisador', 'Misfire prévio'],
  },
  P0430: {
    title: 'Catalyst System Efficiency Below Threshold (Bank 2)',
    meaning: 'Eficiência do catalisador abaixo do limite (banco 2).',
    checks: ['Sondas banco 2', 'Fugas de escape', 'Catalisador'],
  },
  P0128: {
    title: 'Coolant Thermostat Temperature Below Regulating',
    meaning: 'Motor demora a aquecer — termostato ou ECT.',
    checks: ['Termostato', 'Sensor de temperatura', 'Nível de arrefecimento'],
  },
  P0401: {
    title: 'EGR Flow Insufficient',
    meaning: 'Fluxo de EGR insuficiente.',
    checks: ['Válvula EGR', 'Passagens carbonizadas'],
  },
  P0500: {
    title: 'Vehicle Speed Sensor Malfunction',
    meaning: 'Falha no sensor de velocidade.',
    checks: ['Sensor VSS', 'Chicote', 'ABS'],
  },
  P0700: {
    title: 'Transmission Control System Malfunction',
    meaning: 'Falha geral do controle da transmissão.',
    checks: ['Códigos do TCM', 'Nível/ATF', 'Conectores'],
  },
  U0100: {
    title: 'Lost Communication With ECM/PCM',
    meaning: 'Perda de comunicação com o módulo do motor.',
    checks: ['Alimentação/massa ECM', 'Rede CAN'],
  },
  U0101: {
    title: 'Lost Communication With TCM',
    meaning: 'Perda de comunicação com o TCM.',
    checks: ['Rede CAN', 'Alimentação TCM'],
  },
};

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
    if (!res.ok) {
      console.warn('[OLP]', pathAndQuery, res.status);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.warn('[OLP] fail', pathAndQuery, err);
    return null;
  } finally {
    clearTimeout(t);
  }
}

export async function decodeVinNhtsa(vin: string): Promise<PublicTechnicalBundle['vinDecoded'] | null> {
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
  const results = data?.results || [];
  return results.slice(0, 5).map((r: any) => ({
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
    snippet: String(
      (row as any).description || (row as any).summary || (row as any).meaning || ''
    ).slice(0, 300),
    kind: 'dtc',
  };
}

/**
 * GET /api/v1/torque-specs?make=&model=&year=&job=
 * Resposta típica: { data: { torqueSpecs: [ { component, nm, lbFt, ... } ] } }
 */
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
    data?.data?.torqueSpecs ||
    data?.torqueSpecs ||
    data?.data ||
    (Array.isArray(data) ? data : []);

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
    title: `Torque OLP: ${t.component}${t.nm != null ? ` — ${t.nm} N·m` : ''}${t.lbFt != null ? ` (${t.lbFt} lb·ft)` : ''}`,
    url: 'https://openlaborproject.com/docs/api',
    snippet: [t.job, t.isCritical ? 'CRÍTICO' : '', t.notes, t.angleDegrees != null ? `Ângulo: ${t.angleDegrees}°` : '']
      .filter(Boolean)
      .join(' · '),
    kind: 'torque' as const,
  }));

  return { rows, hits };
}

/**
 * GET /api/v1/labor-times?make=&model=&year=&job=
 */
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
    data?.data?.laborTimes ||
    data?.data?.jobs ||
    data?.laborTimes ||
    data?.data ||
    (Array.isArray(data) ? data : []);

  if (!Array.isArray(list) || !list.length) return { rows: [], hits: [] };

  const rows: LaborTimeRow[] = list.slice(0, 10).map((j: any) => ({
    job: j.job || j.name || j.description || 'Serviço',
    hours: typeof j.hours === 'number' ? j.hours : typeof j.time === 'number' ? j.time : undefined,
    notes: j.notes,
  }));

  const hits: PublicHit[] = rows.slice(0, 5).map((j) => ({
    title: `Mão de obra OLP: ${j.job}${j.hours != null ? ` — ${j.hours} h` : ''}`,
    url: 'https://openlaborproject.com/docs/api',
    snippet: j.notes || 'Tempo de referência Open Labor Project',
    kind: 'labor' as const,
  }));

  return { rows, hits };
}

export function lookupLocalDtc(code: string) {
  return DTC_DB[code.toUpperCase()] || null;
}

export async function gatherPublicTechnicalData(input: {
  description?: string;
  make?: string;
  model?: string;
  chassis?: string;
}): Promise<PublicTechnicalBundle> {
  const desc = input.description || '';
  const code = extractDtc(desc);
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

  if (input.chassis && input.chassis.replace(/\s/g, '').length >= 11) {
    vinDecoded = (await decodeVinNhtsa(input.chassis)) || undefined;
    if (vinDecoded?.make) {
      make = make || vinDecoded.make;
      model = model || vinDecoded.model || model;
      year = year || vinDecoded.year;
      summaryLines.push(
        `VIN (NHTSA vPIC): ${vinDecoded.make || ''} ${vinDecoded.model || ''} ${vinDecoded.year || ''}`.trim()
      );
      hits.push({
        title: 'Decode VIN — NHTSA vPIC',
        url: 'https://vpic.nhtsa.dot.gov/',
        snippet: `${vinDecoded.make} ${vinDecoded.model} ${vinDecoded.year}`,
        kind: 'vin',
      });
      sources.push('NHTSA vPIC');
    }
  }

  if (code) {
    const local = lookupLocalDtc(code);
    if (local) {
      dtc = { code, ...local };
      summaryLines.push(`DTC ${code}: ${local.title}. ${local.meaning}`);
      hits.push({
        title: `DTC ${code} — ${local.title}`,
        snippet: local.meaning + ' Verificações: ' + local.checks.join('; '),
        kind: 'dtc',
      });
      sources.push('Base DTC OficIA');
    }
    const olp = await fetchOpenLaborDtc(code);
    if (olp) {
      hits.push(olp);
      sources.push('Open Labor Project (DTC)');
      summaryLines.push(olp.snippet);
    }
  }

  // Torque + labor (precisa make/model/year + chave OLP)
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
      sources.push('Open Labor Project (torque-specs)');
      const crit = torque.rows.filter((r) => r.isCritical).slice(0, 3);
      summaryLines.push(
        `Torques OLP (${torque.rows.length}): ` +
          torque.rows
            .slice(0, 4)
            .map((r) => `${r.component} ${r.nm != null ? r.nm + ' N·m' : ''}`.trim())
            .join('; ') +
          (crit.length ? ` | Críticos: ${crit.map((c) => c.component).join(', ')}` : '')
      );
    }

    if (labor.rows.length) {
      laborTimes = labor.rows;
      hits.push(...labor.hits);
      sources.push('Open Labor Project (labor-times)');
      summaryLines.push(
        `Tempos OLP: ` +
          labor.rows
            .slice(0, 4)
            .map((r) => `${r.job}${r.hours != null ? ` (${r.hours} h)` : ''}`)
            .join('; ')
      );
    }
  }

  if (make && model) {
    const years = year ? [year] : ['2022', '2020', '2018'];
    for (const y of years.slice(0, 2)) {
      const [recalls, complaints] = await Promise.all([
        fetchNhtsaRecalls(make, model, y),
        fetchNhtsaComplaints(make, model, y),
      ]);
      if (recalls.length) {
        hits.push(...recalls);
        summaryLines.push(`NHTSA ${make} ${model} ${y}: ${recalls.length} recall(s).`);
        sources.push('NHTSA Recalls');
        break;
      }
      if (complaints.length && !hits.some((h) => h.kind === 'complaint')) {
        hits.push(...complaints);
        sources.push('NHTSA Complaints');
      }
    }
  }

  if (!summaryLines.length) {
    summaryLines.push(
      'Sem dados públicos específicos. Com OPEN_LABOR_API_KEY, torque e tempos entram automaticamente.'
    );
  }

  sources.push('https://www.nhtsa.gov/recalls');

  return {
    summaryLines,
    hits: hits.slice(0, 16),
    sources: Array.from(new Set(sources)),
    vinDecoded,
    dtc,
    torqueSpecs,
    laborTimes,
  };
}
