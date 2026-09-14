/**
 * Fontes técnicas públicas e gratuitas integráveis no OficIA.
 * - NHTSA (EUA): recalls, reclamações, decode VIN
 * - Base local de DTC OBD-II comuns (domínio público / conhecimento técnico padrão)
 * Open Labor Project: opcional via OPEN_LABOR_API_KEY (Cloudflare exige chave)
 */

export type PublicHit = {
  title: string;
  url?: string;
  snippet: string;
  kind: 'recall' | 'complaint' | 'dtc' | 'vin' | 'oem' | 'web';
};

export type PublicTechnicalBundle = {
  summaryLines: string[];
  hits: PublicHit[];
  sources: string[];
  vinDecoded?: { make?: string; model?: string; year?: string; plant?: string };
  dtc?: { code: string; title: string; meaning: string; checks: string[] };
};

function extractDtc(text: string): string | null {
  const m = (text || '').match(/\b([PCBU]\d{4})\b/i);
  return m ? m[1].toUpperCase() : null;
}

function extractYear(text: string): string | undefined {
  const m = (text || '').match(/\b(19|20)\d{2}\b/);
  return m ? m[0] : undefined;
}

/** DTC OBD-II genéricos mais usados em oficina (referência pública). */
const DTC_DB: Record<
  string,
  { title: string; meaning: string; checks: string[] }
> = {
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
    checks: ['Bobina/vela do cil. 1', 'Injetor 1', 'Compressão cil. 1', 'Cabos/conectores'],
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
    meaning: 'Mistura pobre no banco 1 — excesso de ar ou falta de combustível.',
    checks: ['Vazamento de admissão', 'MAF/MAP', 'Pressão combustível', 'Sonda lambda'],
  },
  P0172: {
    title: 'System Too Rich (Bank 1)',
    meaning: 'Mistura rica no banco 1.',
    checks: ['Injetores vazando', 'Sensor MAF', 'Pressão combustível alta', 'Filtro de ar'],
  },
  P0420: {
    title: 'Catalyst System Efficiency Below Threshold (Bank 1)',
    meaning: 'Eficiência do catalisador abaixo do limite no banco 1.',
    checks: ['Sondas antes/depois do catalisador', 'Fugas de escape', 'Catalisador', 'Misfire prévio'],
  },
  P0430: {
    title: 'Catalyst System Efficiency Below Threshold (Bank 2)',
    meaning: 'Eficiência do catalisador abaixo do limite no banco 2.',
    checks: ['Sondas banco 2', 'Fugas de escape', 'Catalisador banco 2'],
  },
  P0128: {
    title: 'Coolant Thermostat (Coolant Temperature Below Thermostat Regulating Temperature)',
    meaning: 'Motor demora a atingir temperatura — termostato ou sensor ECT.',
    checks: ['Termostato', 'Sensor de temperatura', 'Nível de arrefecimento'],
  },
  P0401: {
    title: 'Exhaust Gas Recirculation Flow Insufficient',
    meaning: 'Fluxo de EGR insuficiente.',
    checks: ['Válvula EGR', 'Passagens de EGR carbonizadas', 'Sensor de posição EGR'],
  },
  P0500: {
    title: 'Vehicle Speed Sensor Malfunction',
    meaning: 'Falha no sensor de velocidade do veículo.',
    checks: ['Sensor VSS', 'Chicote', 'ABS/módulo de velocidade'],
  },
  P0700: {
    title: 'Transmission Control System Malfunction',
    meaning: 'Falha geral no sistema de controle da transmissão (há códigos específicos no TCM).',
    checks: ['Ler códigos do módulo da transmissão', 'Nível/ATF', 'Conectores TCM'],
  },
  C0035: {
    title: 'Left Front Wheel Speed Sensor Circuit',
    meaning: 'Circuito do sensor de velocidade da roda dianteira esquerda (ABS).',
    checks: ['Sensor ABS DE', 'Anel fônico', 'Chicote ABS'],
  },
  B0001: {
    title: 'Driver Frontal Stage 1 Deployment Control',
    meaning: 'Circuito do airbag do motorista (diagnóstico restrito — cuidado com SRS).',
    checks: ['Scanner SRS', 'Não medir resistência do airbag sem procedimento'],
  },
  U0100: {
    title: 'Lost Communication With ECM/PCM',
    meaning: 'Perda de comunicação com o módulo do motor.',
    checks: ['Alimentação/massa ECM', 'Rede CAN', 'Scanner em outros módulos'],
  },
  U0101: {
    title: 'Lost Communication With TCM',
    meaning: 'Perda de comunicação com o módulo da transmissão.',
    checks: ['Rede CAN', 'Alimentação TCM', 'Conectores'],
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

export async function fetchNhtsaRecalls(
  make: string,
  model: string,
  year?: string
): Promise<PublicHit[]> {
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

export async function fetchNhtsaComplaints(
  make: string,
  model: string,
  year?: string
): Promise<PublicHit[]> {
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

/** Open Labor Project — só se houver chave (evita Cloudflare bloqueando). */
export async function fetchOpenLaborDtc(code: string): Promise<PublicHit | null> {
  const key = process.env.OPEN_LABOR_API_KEY;
  if (!key || !code) return null;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(
      `https://openlaborproject.com/api/v1/dtc-codes?code=${encodeURIComponent(code)}`,
      {
        signal: ctrl.signal,
        headers: {
          Accept: 'application/json',
          'x-api-key': key,
          'User-Agent': 'HENIZA-OficIA/1.0',
        },
      }
    );
    clearTimeout(t);
    if (!res.ok) return null;
    const data = await res.json();
    const row = Array.isArray(data) ? data[0] : data?.data?.[0] || data;
    if (!row) return null;
    return {
      title: `OLP ${code}: ${row.title || row.description || 'DTC'}`,
      url: `https://openlaborproject.com/eu/dtc-codes/`,
      snippet: String(row.description || row.summary || row.meaning || JSON.stringify(row)).slice(0, 300),
      kind: 'dtc',
    };
  } catch {
    return null;
  }
}

export function lookupLocalDtc(code: string) {
  return DTC_DB[code.toUpperCase()] || null;
}

/**
 * Agrega tudo que é público e gratuito para o laudo.
 */
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

  // VIN decode
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
      sources.push('NHTSA vPIC (VIN decode)');
    }
  }

  // DTC local
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
      sources.push('Base DTC OBD-II (referência pública OficIA)');
    }
    const olp = await fetchOpenLaborDtc(code);
    if (olp) {
      hits.push(olp);
      sources.push('Open Labor Project');
      summaryLines.push(olp.snippet);
    }
  }

  // NHTSA recalls + complaints (em paralelo)
  if (make && model) {
    const years = year ? [year] : ['2022', '2020', '2018'];
    for (const y of years.slice(0, 2)) {
      const [recalls, complaints] = await Promise.all([
        fetchNhtsaRecalls(make, model, y),
        fetchNhtsaComplaints(make, model, y),
      ]);
      if (recalls.length) {
        hits.push(...recalls);
        summaryLines.push(
          `NHTSA ${make} ${model} ${y}: ${recalls.length} recall(s) listado(s). Ex.: ${recalls[0].title}`
        );
        sources.push('NHTSA Recalls API');
        break;
      }
      if (complaints.length && !hits.some((h) => h.kind === 'complaint')) {
        hits.push(...complaints);
        sources.push('NHTSA Complaints API');
      }
    }
  }

  if (!summaryLines.length) {
    summaryLines.push(
      'Sem recalls/DTC públicos específicos nesta consulta. Use checklist local e portais RMI quando necessário.'
    );
  }

  sources.push('https://www.nhtsa.gov/recalls');

  return {
    summaryLines,
    hits: hits.slice(0, 12),
    sources: Array.from(new Set(sources)),
    vinDecoded,
    dtc,
  };
}
