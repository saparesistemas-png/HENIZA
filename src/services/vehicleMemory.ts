/**
 * Memória por placa/VIN — histórico, reincidência, baseline PID + feed online.
 */
import {
  henizaDb,
  type VehicleProfileRow,
  type DiagnosisEventRow,
  type PidBaselineRow,
} from '../db/henizaDb';

const DTC_RE = /\b([PCBU][0-9A-F]{4})\b/gi;
const MEMORY_ENDPOINT = '/api/history';

async function remoteMemoryRequest(body: unknown): Promise<any | null> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return null;
  try {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 7000);
    const response = await fetch(MEMORY_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    window.clearTimeout(timer);
    return response.ok ? await response.json() : null;
  } catch {
    return null;
  }
}

async function pullRemoteMemory(plate: string, chassis: string): Promise<any | null> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return null;
  try {
    const query = new URLSearchParams({ plate, chassis });
    const response = await fetch(`${MEMORY_ENDPOINT}?${query.toString()}`, { signal: AbortSignal.timeout(7000) });
    return response.ok ? await response.json() : null;
  } catch {
    return null;
  }
}

function mergeById<T extends { id: string }>(local: T[], remote: T[]): T[] {
  const map = new Map(local.map((row) => [row.id, row]));
  for (const row of remote) map.set(row.id, row);
  return Array.from(map.values());
}

export function normalizePlate(plate: string): string {
  return (plate || '').replace(/[^A-Z0-9]/gi, '').toUpperCase();
}

export function normalizeVin(vin: string): string {
  return (vin || '').replace(/[^A-Z0-9]/gi, '').toUpperCase();
}

export function vehicleKey(plate: string, chassis: string): string | null {
  const vin = normalizeVin(chassis);
  const pl = normalizePlate(plate);
  if (vin.length >= 10) return `VIN:${vin}`;
  if (pl.length >= 5) return `PLT:${pl}`;
  return null;
}

export function extractDtcCodes(...texts: Array<string | undefined | null>): string[] {
  const set = new Set<string>();
  for (const t of texts) {
    if (!t) continue;
    const m = t.match(DTC_RE);
    if (m) m.forEach((c) => set.add(c.toUpperCase()));
  }
  return Array.from(set).sort();
}

export function extractPartsMentioned(text: string): string[] {
  if (!text) return [];
  const patterns = [
    /\b(bobina|injetor|sensor\s*\w+|sonda\s*lambda|catalisador|válvula\s*\w+|bomba\s*\w+|filtro\s*\w+|turbo|EGR|ABS|módulo\s*\w+)\b/gi,
  ];
  const set = new Set<string>();
  for (const re of patterns) {
    const m = text.match(re);
    if (m) m.forEach((p) => set.add(p.toLowerCase().trim()));
  }
  return Array.from(set).slice(0, 12);
}

export async function touchVehicleProfile(input: {
  plate?: string;
  chassis?: string;
  make?: string;
  model?: string;
  odometerKm?: number;
}): Promise<VehicleProfileRow | null> {
  const id = vehicleKey(input.plate || '', input.chassis || '');
  if (!id) return null;
  const now = new Date().toISOString();
  const prev = await henizaDb.vehicleProfiles.get(id);
  const row: VehicleProfileRow = {
    id,
    plate: normalizePlate(input.plate || prev?.plate || ''),
    chassis: normalizeVin(input.chassis || prev?.chassis || ''),
    make: input.make || prev?.make || '',
    model: input.model || prev?.model || '',
    lastOdometerKm: input.odometerKm ?? prev?.lastOdometerKm,
    firstSeenAt: prev?.firstSeenAt || now,
    lastSeenAt: now,
    visitCount: (prev?.visitCount || 0) + (prev ? 0 : 1),
  };
  if (prev) {
    const gap = Date.now() - new Date(prev.lastSeenAt).getTime();
    row.visitCount = prev.visitCount + (gap > 6 * 3600 * 1000 ? 1 : 0);
  }
  await henizaDb.vehicleProfiles.put(row);
  void remoteMemoryRequest({ plate: row.plate, chassis: row.chassis, profile: row });
  return row;
}

export async function recordDiagnosisEvent(input: {
  plate?: string;
  chassis?: string;
  make?: string;
  model?: string;
  odometerKm?: number;
  caseId?: string;
  problemName?: string;
  severity?: string;
  diagnosticNotes?: string;
  symptomQuery?: string;
  source?: string;
  codes?: string[];
}): Promise<DiagnosisEventRow | null> {
  const profile = await touchVehicleProfile(input);
  if (!profile) return null;

  const codes =
    input.codes?.length
      ? input.codes.map((c) => c.toUpperCase())
      : extractDtcCodes(input.problemName, input.diagnosticNotes, input.symptomQuery);

  const parts = extractPartsMentioned(
    [input.problemName, input.diagnosticNotes, input.symptomQuery].filter(Boolean).join(' ')
  );

  const event: DiagnosisEventRow = {
    id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    vehicleId: profile.id,
    plate: profile.plate,
    chassis: profile.chassis,
    caseId: input.caseId,
    at: new Date().toISOString(),
    odometerKm: input.odometerKm ?? profile.lastOdometerKm,
    problemName: (input.problemName || 'Diagnóstico').slice(0, 160),
    severity: input.severity,
    codes,
    partsMentioned: parts,
    source: input.source || 'OficIA',
    notes: input.diagnosticNotes?.slice(0, 500),
  };
  await henizaDb.diagnosisEvents.put(event);
  void remoteMemoryRequest({ plate: event.plate, chassis: event.chassis, events: [event] });

  try {
    const { realtimeFeed } = await import('./realtimeFeed');
    void realtimeFeed.publish({
      type: 'diagnosis',
      plate: event.plate,
      chassis: event.chassis,
      title: event.problemName,
      body: event.notes,
      codes: event.codes,
      odometerKm: event.odometerKm,
    });
  } catch {
    /* offline */
  }

  return event;
}

export type CodeRecurrence = {
  code: string;
  count: number;
  firstAt: string;
  lastAt: string;
  kmFirst?: number;
  kmLast?: number;
  kmBetween?: number;
  daysBetween?: number;
  recurring: boolean;
};

export async function getCodeRecurrence(vehicleId: string): Promise<CodeRecurrence[]> {
  const events = await henizaDb.diagnosisEvents.where('vehicleId').equals(vehicleId).sortBy('at');
  const map = new Map<
    string,
    { count: number; firstAt: string; lastAt: string; kmFirst?: number; kmLast?: number }
  >();
  for (const e of events) {
    for (const code of e.codes || []) {
      const cur = map.get(code);
      if (!cur) {
        map.set(code, {
          count: 1,
          firstAt: e.at,
          lastAt: e.at,
          kmFirst: e.odometerKm,
          kmLast: e.odometerKm,
        });
      } else {
        cur.count += 1;
        cur.lastAt = e.at;
        if (e.odometerKm != null) cur.kmLast = e.odometerKm;
        if (cur.kmFirst == null && e.odometerKm != null) cur.kmFirst = e.odometerKm;
      }
    }
  }
  return Array.from(map.entries())
    .map(([code, v]) => {
      const daysBetween =
        (new Date(v.lastAt).getTime() - new Date(v.firstAt).getTime()) / (86400 * 1000);
      const kmBetween =
        v.kmFirst != null && v.kmLast != null ? Math.max(0, v.kmLast - v.kmFirst) : undefined;
      return {
        code,
        count: v.count,
        firstAt: v.firstAt,
        lastAt: v.lastAt,
        kmFirst: v.kmFirst,
        kmLast: v.kmLast,
        kmBetween,
        daysBetween: Math.round(daysBetween * 10) / 10,
        recurring: v.count >= 2,
      };
    })
    .sort((a, b) => b.count - a.count || b.lastAt.localeCompare(a.lastAt));
}

export async function getVehicleTimeline(
  plate: string,
  chassis: string,
  limit = 20
): Promise<{
  profile: VehicleProfileRow | null;
  events: DiagnosisEventRow[];
  recurrence: CodeRecurrence[];
  baselines: PidBaselineRow[];
}> {
  const id = vehicleKey(plate, chassis);
  if (!id) return { profile: null, events: [], recurrence: [], baselines: [] };
  const profile = (await henizaDb.vehicleProfiles.get(id)) || null;
  const events = await henizaDb.diagnosisEvents.where('vehicleId').equals(id).reverse().sortBy('at');
  events.reverse();
  const sorted = events.sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit);
  const recurrence = await getCodeRecurrence(id);
  const baselines = await henizaDb.pidBaselines.where('vehicleId').equals(id).toArray();
  const remote = await pullRemoteMemory(plate, chassis);
  if (remote?.ok && remote.source === 'remote') {
    if (remote.profile) {
      await henizaDb.vehicleProfiles.put(remote.profile);
    }
    if (Array.isArray(remote.events)) {
      await henizaDb.diagnosisEvents.bulkPut(remote.events);
    }
    if (Array.isArray(remote.baselines)) {
      await henizaDb.pidBaselines.bulkPut(remote.baselines);
    }
    const mergedEvents = mergeById(sorted, Array.isArray(remote.events) ? remote.events : [])
      .sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit);
    const mergedProfile = remote.profile || profile;
    return {
      profile: mergedProfile,
      events: mergedEvents,
      recurrence: await getCodeRecurrence(id),
      baselines: mergeById(baselines, Array.isArray(remote.baselines) ? remote.baselines : []),
    };
  }
  return { profile, events: sorted, recurrence, baselines };
}

export async function updatePidBaselines(
  plate: string,
  chassis: string,
  samples: Array<{ id: string; name?: string; value: number; unit?: string }>
): Promise<PidBaselineRow[]> {
  const id = vehicleKey(plate, chassis);
  if (!id || !samples?.length) return [];
  await touchVehicleProfile({ plate, chassis });
  const out: PidBaselineRow[] = [];
  const now = new Date().toISOString();
  for (const s of samples) {
    if (s.value == null || Number.isNaN(Number(s.value))) continue;
    const value = Number(s.value);
    const rowId = `${id}|${s.id}`;
    const prev = await henizaDb.pidBaselines.get(rowId);
    if (!prev) {
      const row: PidBaselineRow = {
        id: rowId,
        vehicleId: id,
        pidId: s.id,
        pidName: s.name || s.id,
        unit: s.unit,
        samples: 1,
        mean: value,
        min: value,
        max: value,
        m2: 0,
        lastValue: value,
        updatedAt: now,
      };
      await henizaDb.pidBaselines.put(row);
      out.push(row);
      continue;
    }
    const n = prev.samples + 1;
    const delta = value - prev.mean;
    const mean = prev.mean + delta / n;
    const delta2 = value - mean;
    const m2 = prev.m2 + delta * delta2;
    const row: PidBaselineRow = {
      ...prev,
      samples: n,
      mean,
      min: Math.min(prev.min, value),
      max: Math.max(prev.max, value),
      m2,
      lastValue: value,
      unit: s.unit || prev.unit,
      pidName: s.name || prev.pidName,
      updatedAt: now,
    };
    await henizaDb.pidBaselines.put(row);
    out.push(row);
  }
  if (out.length) void remoteMemoryRequest({ plate, chassis, baselines: out });
  return out;
}

export function pidDeviation(
  baseline: PidBaselineRow,
  value: number
): { ok: boolean; zApprox: number; label: string } {
  const variance = baseline.samples > 1 ? baseline.m2 / (baseline.samples - 1) : 0;
  const std = Math.sqrt(Math.max(0, variance));
  const z = std > 1e-6 ? (value - baseline.mean) / std : 0;
  const ok = Math.abs(z) < 2.5 || baseline.samples < 5;
  let label = 'dentro do histórico';
  if (baseline.samples < 5) label = 'baseline ainda curta';
  else if (Math.abs(z) >= 2.5)
    label = z > 0 ? 'acima do histórico deste veículo' : 'abaixo do histórico deste veículo';
  return { ok, zApprox: Math.round(z * 10) / 10, label };
}

export async function buildMemoryHint(plate: string, chassis: string): Promise<string> {
  const { profile, recurrence, events } = await getVehicleTimeline(plate, chassis, 5);
  if (!profile) return '';
  const lines: string[] = [];
  lines.push(
    `[Memória do veículo ${profile.plate || profile.chassis}] visitas≈${profile.visitCount}` +
      (profile.lastOdometerKm != null ? ` · último km ${profile.lastOdometerKm}` : '')
  );
  const recurring = recurrence.filter((r) => r.recurring).slice(0, 5);
  if (recurring.length) {
    lines.push(
      'Reincidência: ' +
        recurring
          .map(
            (r) =>
              `${r.code}×${r.count}` +
              (r.kmBetween != null ? ` (~${r.kmBetween} km entre 1ª e última)` : '') +
              (r.daysBetween != null ? ` / ${r.daysBetween}d` : '')
          )
          .join('; ')
    );
  }
  if (events.length) {
    const last = events[0];
    lines.push(
      `Último laudo (${new Date(last.at).toLocaleDateString('pt-BR')}): ${last.problemName}` +
        (last.codes.length ? ` [${last.codes.join(', ')}]` : '')
    );
  }
  return lines.join('\n');
}
