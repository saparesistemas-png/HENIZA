import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from './_lib/pg';

const MAX_EVENTS = 50;
const MAX_BASELINES = 100;
let schemaReady: Promise<void> | null = null;

function normalize(value: unknown, max = 80): string {
  return String(value || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, max);
}

function vehicleId(plate: unknown, chassis: unknown): string | null {
  const vin = normalize(chassis, 32);
  const pl = normalize(plate, 16);
  if (vin.length >= 10) return `VIN:${vin}`;
  if (pl.length >= 5) return `PLT:${pl}`;
  return null;
}

async function ensureSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      await query(`CREATE TABLE IF NOT EXISTS heniza_vehicle_profiles (
        id text PRIMARY KEY, plate text NOT NULL DEFAULT '', chassis text NOT NULL DEFAULT '',
        make text NOT NULL DEFAULT '', model text NOT NULL DEFAULT '', last_odometer_km numeric,
        first_seen_at timestamptz NOT NULL, last_seen_at timestamptz NOT NULL, visit_count integer NOT NULL DEFAULT 0
      )`);
      await query(`CREATE TABLE IF NOT EXISTS heniza_diagnosis_events (
        id text PRIMARY KEY, vehicle_id text NOT NULL, plate text NOT NULL DEFAULT '', chassis text NOT NULL DEFAULT '',
        case_id text, at timestamptz NOT NULL, odometer_km numeric, problem_name text NOT NULL,
        severity text, codes jsonb NOT NULL DEFAULT '[]', parts_mentioned jsonb NOT NULL DEFAULT '[]', source text NOT NULL DEFAULT 'OficIA', notes text
      )`);
      await query(`CREATE INDEX IF NOT EXISTS heniza_diagnosis_vehicle_at ON heniza_diagnosis_events(vehicle_id, at DESC)`);
      await query(`CREATE TABLE IF NOT EXISTS heniza_pid_baselines (
        id text PRIMARY KEY, vehicle_id text NOT NULL, pid_id text NOT NULL, pid_name text NOT NULL,
        unit text, samples integer NOT NULL, mean numeric NOT NULL, min numeric NOT NULL, max numeric NOT NULL,
        m2 numeric NOT NULL DEFAULT 0, last_value numeric NOT NULL, updated_at timestamptz NOT NULL
      )`);
    })().catch((error) => { schemaReady = null; throw error; });
  }
  return schemaReady;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
  const plate = body.plate ?? req.query.plate;
  const chassis = body.chassis ?? req.query.chassis;
  const id = vehicleId(plate, chassis);
  if (!id) return res.status(400).json({ ok: false, error: 'Placa ou VIN inválido' });

  try {
    await ensureSchema();
    if (req.method === 'POST') {
      const profile = body.profile;
      if (profile) {
        await query(`INSERT INTO heniza_vehicle_profiles (id, plate, chassis, make, model, last_odometer_km, first_seen_at, last_seen_at, visit_count)
          VALUES ($1,$2,$3,$4,$5,$6,COALESCE($7::timestamptz,NOW()),NOW(),$8)
          ON CONFLICT (id) DO UPDATE SET plate=EXCLUDED.plate, chassis=EXCLUDED.chassis, make=EXCLUDED.make, model=EXCLUDED.model,
          last_odometer_km=COALESCE(EXCLUDED.last_odometer_km, heniza_vehicle_profiles.last_odometer_km), last_seen_at=NOW(), visit_count=GREATEST(heniza_vehicle_profiles.visit_count, EXCLUDED.visit_count)`,
          [id, normalize(profile.plate, 16), normalize(profile.chassis, 32), String(profile.make || '').slice(0,80), String(profile.model || '').slice(0,80), profile.lastOdometerKm ?? null, profile.firstSeenAt || null, Number(profile.visitCount) || 1]);
      }
      for (const event of Array.isArray(body.events) ? body.events.slice(0, MAX_EVENTS) : []) {
        await query(`INSERT INTO heniza_diagnosis_events (id, vehicle_id, plate, chassis, case_id, at, odometer_km, problem_name, severity, codes, parts_mentioned, source, notes)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11::jsonb,$12,$13) ON CONFLICT (id) DO NOTHING`,
          [String(event.id).slice(0,120), id, normalize(event.plate,16), normalize(event.chassis,32), event.caseId || null, event.at || new Date().toISOString(), event.odometerKm ?? null, String(event.problemName || 'Diagnóstico').slice(0,160), event.severity || null, JSON.stringify(Array.isArray(event.codes) ? event.codes.slice(0,24) : []), JSON.stringify(Array.isArray(event.partsMentioned) ? event.partsMentioned.slice(0,12) : []), String(event.source || 'OficIA').slice(0,80), event.notes ? String(event.notes).slice(0,500) : null]);
      }
      for (const baseline of Array.isArray(body.baselines) ? body.baselines.slice(0, MAX_BASELINES) : []) {
        await query(`INSERT INTO heniza_pid_baselines (id, vehicle_id, pid_id, pid_name, unit, samples, mean, min, max, m2, last_value, updated_at)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) ON CONFLICT (id) DO UPDATE SET samples=EXCLUDED.samples, mean=EXCLUDED.mean, min=EXCLUDED.min, max=EXCLUDED.max, m2=EXCLUDED.m2, last_value=EXCLUDED.last_value, updated_at=EXCLUDED.updated_at`,
          [String(baseline.id).slice(0,160), id, String(baseline.pidId).slice(0,80), String(baseline.pidName || baseline.pidId).slice(0,120), baseline.unit || null, Number(baseline.samples) || 1, Number(baseline.mean) || 0, Number(baseline.min) || 0, Number(baseline.max) || 0, Number(baseline.m2) || 0, Number(baseline.lastValue) || 0, baseline.updatedAt || new Date().toISOString()]);
      }
      return res.status(200).json({ ok: true, stored: true });
    }

    const profileResult = await query(`SELECT id, plate, chassis, make, model, last_odometer_km AS "lastOdometerKm", first_seen_at AS "firstSeenAt", last_seen_at AS "lastSeenAt", visit_count AS "visitCount" FROM heniza_vehicle_profiles WHERE id=$1`, [id]);
    const eventsResult = await query(`SELECT id, vehicle_id AS "vehicleId", plate, chassis, case_id AS "caseId", at, odometer_km AS "odometerKm", problem_name AS "problemName", severity, codes, parts_mentioned AS "partsMentioned", source, notes FROM heniza_diagnosis_events WHERE vehicle_id=$1 ORDER BY at DESC LIMIT $2`, [id, MAX_EVENTS]);
    const baselinesResult = await query(`SELECT id, vehicle_id AS "vehicleId", pid_id AS "pidId", pid_name AS "pidName", unit, samples, mean, min, max, m2, last_value AS "lastValue", updated_at AS "updatedAt" FROM heniza_pid_baselines WHERE vehicle_id=$1 ORDER BY updated_at DESC LIMIT $2`, [id, MAX_BASELINES]);
    return res.status(200).json({ ok: true, source: 'remote', profile: profileResult?.rows[0] || null, events: eventsResult?.rows || [], baselines: baselinesResult?.rows || [] });
  } catch (error) {
    return res.status(200).json({ ok: false, source: 'unavailable', error: error instanceof Error ? error.message : 'database unavailable' });
  }
}
