/**
 * Pull de OS do servidor e resolução simples de conflito por rev.
 */
import { henizaDb, type LocalCaseRow } from '../db/henizaDb';
import { authHeaders } from '../services/onlineSession';

const LAST_PULL_KEY = 'lastCasePullAt';

export async function pullCases(): Promise<{
  pulled: number;
  conflicts: number;
  applied: number;
}> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { pulled: 0, conflicts: 0, applied: 0 };
  }

  const meta = await henizaDb.syncMeta.get(LAST_PULL_KEY);
  const since = meta?.value || '';
  const q = new URLSearchParams({ pull: '1' });
  if (since) q.set('since', since);

  let cases: Array<{
    id: string;
    rev: number;
    plate?: string;
    chassis?: string;
    make?: string;
    model?: string;
    currentStage?: string;
    snapshot?: unknown;
    updatedAt: string;
  }> = [];

  try {
    const res = await fetch(`/api/sync?${q.toString()}`, { headers: authHeaders() });
    const json = await res.json();
    if (!json?.ok || !Array.isArray(json.cases)) return { pulled: 0, conflicts: 0, applied: 0 };
    cases = json.cases;
    if (json.serverTime) {
      await henizaDb.syncMeta.put({ key: LAST_PULL_KEY, value: json.serverTime });
    }
  } catch {
    return { pulled: 0, conflicts: 0, applied: 0 };
  }

  let conflicts = 0;
  let applied = 0;

  for (const remote of cases) {
    const local = await henizaDb.cases.get(remote.id);
    if (!local) {
      const row: LocalCaseRow = {
        id: remote.id,
        plate: remote.plate || '',
        chassis: remote.chassis || '',
        make: remote.make || '',
        model: remote.model || '',
        currentStage: remote.currentStage || 'entrada',
        snapshot: remote.snapshot || remote,
        rev: remote.rev || 1,
        updatedAt: remote.updatedAt,
        createdAt: remote.updatedAt,
        syncStatus: 'synced',
      };
      await henizaDb.cases.put(row);
      applied++;
      continue;
    }

    if ((remote.rev || 0) > (local.rev || 0)) {
      // servidor mais novo — aplica
      await henizaDb.cases.put({
        ...local,
        plate: remote.plate || local.plate,
        chassis: remote.chassis || local.chassis,
        make: remote.make || local.make,
        model: remote.model || local.model,
        currentStage: remote.currentStage || local.currentStage,
        snapshot: remote.snapshot || local.snapshot,
        rev: remote.rev,
        updatedAt: remote.updatedAt,
        syncStatus: 'synced',
      });
      applied++;
    } else if ((remote.rev || 0) < (local.rev || 0) && local.syncStatus === 'pending') {
      // local mais novo ainda não confirmado — mantém local
      conflicts++;
    } else if ((remote.rev || 0) === (local.rev || 0) && local.syncStatus === 'pending') {
      // mesmo rev, ambos sujos → marca conflito
      await henizaDb.cases.update(local.id, { syncStatus: 'conflict' });
      conflicts++;
    }
  }

  return { pulled: cases.length, conflicts, applied };
}
