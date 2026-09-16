import React, { useCallback, useEffect, useState } from 'react';
import { History, AlertTriangle, Activity, RefreshCw } from 'lucide-react';
import {
  getVehicleTimeline,
  type CodeRecurrence,
  vehicleKey,
} from '../services/vehicleMemory';
import type { DiagnosisEventRow, PidBaselineRow, VehicleProfileRow } from '../db/henizaDb';
import RealtimeFeedPanel from './RealtimeFeedPanel';

type Props = {
  plate: string;
  chassis: string;
};

export default function VehicleMemoryPanel({ plate, chassis }: Props) {
  const [open, setOpen] = useState(true);
  const [profile, setProfile] = useState<VehicleProfileRow | null>(null);
  const [events, setEvents] = useState<DiagnosisEventRow[]>([]);
  const [recurrence, setRecurrence] = useState<CodeRecurrence[]>([]);
  const [baselines, setBaselines] = useState<PidBaselineRow[]>([]);
  const [loading, setLoading] = useState(false);

  const key = vehicleKey(plate, chassis);

  const load = useCallback(async () => {
    if (!key) {
      setProfile(null);
      setEvents([]);
      setRecurrence([]);
      setBaselines([]);
      return;
    }
    setLoading(true);
    try {
      const data = await getVehicleTimeline(plate, chassis, 15);
      setProfile(data.profile);
      setEvents(data.events);
      setRecurrence(data.recurrence);
      setBaselines(data.baselines);
    } finally {
      setLoading(false);
    }
  }, [plate, chassis, key]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!key) {
    return (
      <div className="rounded-xl border border-tech-borda bg-tech-fundo/50 px-3 py-2 text-[11px] text-slate-500">
        Informe placa (≥5) ou VIN (≥10) para ativar a memória do veículo.
      </div>
    );
  }

  const recurring = recurrence.filter((r) => r.recurring);

  return (
    <section className="bg-tech-cartao rounded-2xl border border-cyan-500/25 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-cyan-400" />
          <div>
            <p className="text-xs font-black text-white uppercase tracking-wide">
              Memória do veículo
            </p>
            <p className="text-[10px] text-slate-400">
              Histórico · reincidência · feed online
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              void load();
            }}
            className="text-slate-400 hover:text-white"
            title="Atualizar"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <span className="text-[10px] font-bold text-cyan-300">{open ? 'Ocultar' : 'Abrir'}</span>
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-tech-borda/60 pt-3">
          <RealtimeFeedPanel plate={plate} chassis={chassis} />

          {profile ? (
            <p className="text-[11px] text-slate-300">
              <span className="text-white font-bold">{profile.plate || profile.chassis}</span>
              {profile.make ? ` · ${profile.make} ${profile.model}` : ''}
              {' · '}
              {profile.visitCount} visita(s)
              {profile.lastOdometerKm != null ? ` · ${profile.lastOdometerKm} km` : ''}
            </p>
          ) : (
            <p className="text-[11px] text-slate-500">
              Ainda sem histórico local. O primeiro laudo grava a memória neste dispositivo.
            </p>
          )}

          {recurring.length > 0 && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 space-y-1.5">
              <div className="flex items-center gap-1.5 text-amber-200 text-[11px] font-bold">
                <AlertTriangle className="w-3.5 h-3.5" />
                Códigos reincidentes neste veículo
              </div>
              <ul className="space-y-1">
                {recurring.map((r) => (
                  <li key={r.code} className="text-[11px] text-slate-300">
                    <span className="font-mono font-bold text-amber-100">{r.code}</span>
                    {' · '}
                    {r.count}×
                    {r.kmBetween != null ? ` · ~${r.kmBetween} km entre ocorrências` : ''}
                    {r.daysBetween != null ? ` · ${r.daysBetween}d` : ''}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {events.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold uppercase text-slate-500">Linha do tempo</p>
              <ul className="space-y-2 max-h-48 overflow-y-auto">
                {events.map((e) => (
                  <li
                    key={e.id}
                    className="text-[11px] rounded-lg border border-tech-borda bg-tech-fundo/60 px-2.5 py-2"
                  >
                    <div className="flex justify-between gap-2 text-slate-400">
                      <span>{new Date(e.at).toLocaleString('pt-BR')}</span>
                      {e.odometerKm != null && <span>{e.odometerKm} km</span>}
                    </div>
                    <p className="text-white font-semibold mt-0.5">{e.problemName}</p>
                    {e.codes.length > 0 && (
                      <p className="font-mono text-cyan-300/90 text-[10px] mt-0.5">
                        {e.codes.join(' · ')}
                      </p>
                    )}
                    {e.partsMentioned.length > 0 && (
                      <p className="text-slate-500 text-[10px] mt-0.5">
                        Peças citadas: {e.partsMentioned.join(', ')}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {baselines.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-slate-500">
                <Activity className="w-3 h-3" />
                Baseline PID (este veículo)
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {baselines.slice(0, 8).map((b) => (
                  <div
                    key={b.id}
                    className="rounded-lg border border-tech-borda px-2 py-1.5 text-[10px]"
                  >
                    <p className="text-slate-400 truncate">{b.pidName}</p>
                    <p className="text-white font-bold">
                      μ {b.mean.toFixed(1)}
                      {b.unit ? ` ${b.unit}` : ''}
                    </p>
                    <p className="text-slate-500">
                      {b.min.toFixed(0)}–{b.max.toFixed(0)} · n={b.samples}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
