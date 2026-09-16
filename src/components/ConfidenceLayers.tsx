import React from 'react';
import { Cpu, Radio, Activity, BookOpen, Shield } from 'lucide-react';

export type ConfidenceLayer = {
  id: string;
  label: string;
  detail: string;
  weight: 'high' | 'medium' | 'low';
  present: boolean;
};

type DiagnosisLike = {
  source?: string;
  originBadge?: string;
  networkHits?: Array<{ title?: string }>;
  networkNotes?: string;
  faultEvents?: Array<{ id?: string; title?: string }>;
  liveObd?: unknown[];
  preventivePlan?: { items?: unknown[] };
  systemUpdateRecommendations?: unknown[];
  diagnosticNotes?: string;
};

export function buildConfidenceLayers(data: DiagnosisLike): ConfidenceLayer[] {
  const faults = data.faultEvents?.length || 0;
  const net = data.networkHits?.length || 0;
  const hasObd = Boolean(data.liveObd && (data.liveObd as any[]).length);
  const hasPrev = Boolean(data.preventivePlan?.items?.length);
  const src = (data.source || data.originBadge || '').toLowerCase();

  return [
    {
      id: 'rules',
      label: 'Motor de regras',
      detail:
        faults > 0
          ? `${faults} evento(s) faultEngine`
          : 'Sem evento de limiar/PID neste laudo',
      weight: faults > 0 ? 'high' : 'low',
      present: faults > 0,
    },
    {
      id: 'obd',
      label: 'OBD ao vivo',
      detail: hasObd ? 'Leituras PID injetadas no diagnóstico' : 'Sem snapshot OBD neste laudo',
      weight: hasObd ? 'high' : 'low',
      present: hasObd,
    },
    {
      id: 'network',
      label: 'Rede / NHTSA',
      detail:
        net > 0
          ? `${net} referência(s) de rede`
          : data.networkNotes
            ? 'Notas de rede sem hits estruturados'
            : 'Rede não citada',
      weight: net > 0 ? 'medium' : 'low',
      present: net > 0 || Boolean(data.networkNotes),
    },
    {
      id: 'ai',
      label: 'Inferência IA',
      detail: src.includes('offline')
        ? 'Laudo local / offline — validar no veículo'
        : 'Texto e checklist gerados pela IA (podem errar)',
      weight: 'medium',
      present: true,
    },
    {
      id: 'preventive',
      label: 'Preventiva / campanhas',
      detail: hasPrev ? 'Plano preventivo anexado' : 'Sem plano preventivo',
      weight: hasPrev ? 'medium' : 'low',
      present: hasPrev,
    },
  ];
}

const icons: Record<string, React.ReactNode> = {
  rules: <Shield className="w-3.5 h-3.5" />,
  obd: <Activity className="w-3.5 h-3.5" />,
  network: <Radio className="w-3.5 h-3.5" />,
  ai: <Cpu className="w-3.5 h-3.5" />,
  preventive: <BookOpen className="w-3.5 h-3.5" />,
};

export default function ConfidenceLayers({ data }: { data: DiagnosisLike }) {
  const layers = buildConfidenceLayers(data);
  const active = layers.filter((l) => l.present).length;

  return (
    <div className="rounded-xl border border-tech-borda bg-tech-fundo/40 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
          Camadas de confiança
        </p>
        <span className="text-[10px] text-slate-500">
          {active}/{layers.length} fontes ativas
        </span>
      </div>
      <ul className="space-y-1.5">
        {layers.map((l) => (
          <li
            key={l.id}
            className={`flex gap-2 items-start text-[11px] rounded-lg px-2 py-1.5 border ${
              l.present
                ? l.weight === 'high'
                  ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-100'
                  : 'border-cyan-500/25 bg-cyan-500/5 text-cyan-100'
                : 'border-tech-borda/60 text-slate-500'
            }`}
          >
            <span className="mt-0.5 shrink-0">{icons[l.id]}</span>
            <div>
              <p className="font-bold">{l.label}</p>
              <p className="text-[10px] opacity-80">{l.detail}</p>
            </div>
          </li>
        ))}
      </ul>
      <p className="text-[10px] text-slate-500 leading-relaxed">
        A IA não substitui o profissional. Priorize regras + OBD + evidências fotográficas antes de
        liberar o veículo.
      </p>
    </div>
  );
}
