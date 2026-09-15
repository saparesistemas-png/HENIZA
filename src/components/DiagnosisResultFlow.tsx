import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Wrench,
  BookOpen,
  ArrowLeft,
  Copy,
  Check,
  RotateCcw,
} from 'lucide-react';

type DiagnosisData = {
  problemName?: string;
  severity?: string;
  diagnosticNotes?: string;
  resetProcedure?: string;
  originBadge?: string;
  originExplanation?: string;
  codeTypeLabel?: string;
  source?: string;
  correctiveChecklist?: string[];
  preventiveChecklist?: string[];
  preventivePlan?: {
    vehicleLabel?: string;
    disclaimer?: string;
    items?: Array<{
      id?: string;
      name: string;
      category?: string;
      intervalKm?: number;
      intervalMonths?: number;
      priority?: string;
      dueReason?: string;
      estimatedCostBrl?: number;
    }>;
  };
  budgetItems?: Array<{ item: string; category: string; estimatedCost: number }>;
  networkNotes?: string;
  networkSources?: string[];
  networkHits?: Array<{ title: string; url?: string; snippet?: string; kind?: string }>;
  mechanicOverride?: string;
  faultEvents?: Array<{ id: string; title: string; severity: string; message?: string }>;
};

type Props = {
  data: DiagnosisData;
  vehicleLabel: string;
  plate?: string;
  chassis?: string;
  whatsappShareUrl?: string;
  setSuccessToast: (msg: string | null) => void;
  onNewDiagnosis: () => void;
  onConfirmBudget: (
    items: Array<{ item: string; category: string; estimatedCost: number }>,
    total: number
  ) => void;
  onOverrideSubmit: (notes: string) => void;
};

function money(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function DiagnosisResultFlow({
  data,
  vehicleLabel,
  plate,
  chassis,
  whatsappShareUrl,
  setSuccessToast,
  onNewDiagnosis,
  onConfirmBudget,
  onOverrideSubmit,
}: Props) {
  const [phase, setPhase] = useState<'compare' | 'budget' | 'override'>('compare');
  const [mechanicNotes, setMechanicNotes] = useState('');
  const [copied, setCopied] = useState(false);
  const [selectedItems, setSelectedItems] = useState<boolean[]>(() =>
    (data.budgetItems || []).map(() => true)
  );

  const budgetItems = data.budgetItems || [];
  const total = useMemo(() => {
    return budgetItems.reduce((acc, item, i) => {
      if (!selectedItems[i]) return acc;
      return acc + (Number(item.estimatedCost) || 0);
    }, 0);
  }, [budgetItems, selectedItems]);

  const severity = data.severity || 'Média';
  const networkText =
    data.networkNotes ||
    'Cruzamento com fontes públicas (NHTSA, DTC) e portais RMI quando aplicável.';
  const networkHits = (data.networkHits || []).slice(0, 8);
  const networkSources =
    data.networkSources && data.networkSources.length
      ? data.networkSources
      : ([data.source || 'Base OficIA', data.codeTypeLabel || data.originBadge].filter(
          Boolean
        ) as string[]);

  const checks = data.correctiveChecklist || [];
  const preventive =
    data.preventiveChecklist && data.preventiveChecklist.length
      ? data.preventiveChecklist
      : (data.preventivePlan?.items || []).map(
          (i) =>
            `${i.name}` +
            (i.intervalKm ? ` · ${i.intervalKm} km` : '') +
            (i.dueReason ? ` — ${i.dueReason}` : '')
        );

  const handleCopy = () => {
    const text = [
      'LAUDO OFICIA',
      `Veículo: ${vehicleLabel}`,
      `Placa: ${plate || 'N/I'} | Chassi: ${chassis || 'N/I'}`,
      `Diagnóstico IA: ${data.problemName || ''}`,
      `Gravidade: ${severity}`,
      '',
      'Notas:',
      data.diagnosticNotes || '',
      '',
      'Rede:',
      networkText,
      '',
      'Verificações:',
      ...checks.map((c, i) => `${i + 1}. ${c}`),
      '',
      'Preventiva:',
      ...preventive.map((c, i) => `${i + 1}. ${c}`),
      '',
      `Orçamento selecionado: ${money(total)}`,
    ].join('\n');

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setSuccessToast('Laudo copiado.');
      setTimeout(() => setCopied(false), 2500);
    });
  };

  if (phase === 'override') {
    return (
      <section className="bg-tech-cartao rounded-2xl border border-amber-500/40 p-4 sm:p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Wrench className="w-5 h-5 text-amber-400" />
          <h3 className="text-sm font-black text-white uppercase tracking-wide">
            Diagnóstico 2 — Avaliação do profissional
          </h3>
        </div>
        <p className="text-xs text-slate-300">
          A IA sugeriu:{' '}
          <span className="text-tech-destaque font-semibold">{data.problemName}</span>
        </p>
        <textarea
          value={mechanicNotes}
          onChange={(e) => setMechanicNotes(e.target.value)}
          rows={5}
          placeholder="Ex.: Confirmei P0301. Bobina com faísca fraca..."
          className="w-full rounded-xl bg-tech-fundo border border-tech-borda text-sm text-white p-3 outline-none focus:border-tech-destaque/50"
        />
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={() => setPhase('compare')}
            className="px-4 py-2.5 rounded-xl border border-tech-borda text-xs font-bold text-slate-300 flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Voltar
          </button>
          <button
            type="button"
            onClick={() => {
              if (!mechanicNotes.trim()) {
                setSuccessToast('Descreva a avaliação do profissional.');
                return;
              }
              onOverrideSubmit(mechanicNotes.trim());
              setPhase('budget');
            }}
            className="px-4 py-2.5 rounded-xl bg-tech-destaque text-tech-fundo text-xs font-black"
          >
            Seguir para orçamento
          </button>
        </div>
      </section>
    );
  }

  if (phase === 'budget') {
    return (
      <section className="bg-tech-cartao rounded-2xl border border-tech-borda p-4 sm:p-6 space-y-4">
        <h3 className="text-sm font-black text-white uppercase tracking-wide">Orçamento sugerido</h3>
        <ul className="space-y-2">
          {budgetItems.map((item, idx) => (
            <li
              key={idx}
              className="flex items-center gap-3 text-sm text-slate-200 border border-tech-borda rounded-xl px-3 py-2"
            >
              <input
                type="checkbox"
                checked={!!selectedItems[idx]}
                onChange={() =>
                  setSelectedItems((prev) => prev.map((v, i) => (i === idx ? !v : v)))
                }
              />
              <div className="flex-1">
                <p className="font-semibold">{item.item}</p>
                <p className="text-[11px] text-slate-400">{item.category}</p>
              </div>
              <span className="font-black text-tech-destaque">{money(item.estimatedCost)}</span>
            </li>
          ))}
        </ul>
        <p className="text-right text-sm font-black text-white">Total: {money(total)}</p>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={() => setPhase('compare')}
            className="px-4 py-2.5 rounded-xl border border-tech-borda text-xs font-bold text-slate-300"
          >
            Voltar
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirmBudget(
                budgetItems.filter((_, i) => selectedItems[i]),
                total
              );
              setSuccessToast('Orçamento registrado.');
            }}
            className="px-4 py-2.5 rounded-xl bg-tech-destaque text-tech-fundo text-xs font-black"
          >
            Confirmar orçamento
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="bg-tech-cartao rounded-2xl border border-tech-destaque/30 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-tech-destaque" />
            <p className="text-[11px] font-black uppercase tracking-wider text-tech-destaque">
              1 · Diagnóstico da IA
            </p>
          </div>
          <h3 className="text-base font-black text-white leading-snug">{data.problemName}</h3>
          <p className="text-[11px] text-slate-400">
            Gravidade: <span className="text-white font-bold">{severity}</span>
            {data.originBadge ? ` · ${data.originBadge}` : ''}
          </p>
          <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
            {data.diagnosticNotes}
          </p>
          {(data.faultEvents?.length || 0) > 0 && (
            <div className="text-[11px] text-amber-200/90 space-y-1">
              <p className="font-black uppercase tracking-wide">faultEngine</p>
              {data.faultEvents!.slice(0, 5).map((f) => (
                <p key={f.id}>
                  [{f.severity}] {f.title}
                  {f.message ? ` — ${f.message}` : ''}
                </p>
              ))}
            </div>
          )}
        </div>

        <div className="bg-tech-cartao rounded-2xl border border-cyan-500/25 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <p className="text-[11px] font-black uppercase tracking-wider text-cyan-300">
              1 · Informações da rede
            </p>
          </div>
          <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{networkText}</p>
          {networkHits.length > 0 && (
            <ul className="space-y-2">
              {networkHits.map((h, i) => (
                <li key={i} className="text-[11px] text-slate-400">
                  <span className="text-cyan-300 font-semibold">{h.title}</span>
                  {h.snippet ? ` — ${h.snippet}` : ''}
                </li>
              ))}
            </ul>
          )}
          {networkHits.length === 0 && (
            <ul className="space-y-1.5">
              {networkSources.slice(0, 6).map((s, i) => (
                <li key={i} className="text-[11px] text-slate-400 flex gap-2">
                  <span className="text-cyan-400">•</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="bg-tech-cartao rounded-2xl border border-tech-borda p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Wrench className="w-4 h-4 text-amber-400" />
          <p className="text-[11px] font-black uppercase tracking-wider text-amber-300">
            2 · Sugestões para o mecânico verificar
          </p>
        </div>
        <ol className="space-y-2">
          {checks.map((c, i) => (
            <li key={i} className="flex gap-2 text-sm text-slate-100">
              <span className="text-tech-destaque font-black text-xs mt-0.5">{i + 1}.</span>
              <span>{c}</span>
            </li>
          ))}
        </ol>

        {preventive.length > 0 && (
          <div className="pt-3 border-t border-tech-borda space-y-2">
            <p className="text-[11px] font-black uppercase tracking-wider text-emerald-300/90">
              Manutenção preventiva sugerida
            </p>
            <ul className="space-y-1.5">
              {preventive.slice(0, 8).map((c, i) => (
                <li key={i} className="text-[12px] text-slate-200 flex gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
            {data.preventivePlan?.disclaimer && (
              <p className="text-[10px] text-slate-500 leading-relaxed">
                {data.preventivePlan.disclaimer}
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-tech-borda">
          <button
            type="button"
            onClick={() => {
              setPhase('budget');
              setSuccessToast('Diagnóstico da IA aceito. Revise o orçamento.');
            }}
            className="py-3 rounded-xl bg-tech-destaque text-tech-fundo text-xs font-black flex items-center justify-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" /> Aprovar diagnóstico da IA
          </button>
          <button
            type="button"
            onClick={() => setPhase('override')}
            className="py-3 rounded-xl border border-amber-500/40 text-amber-200 text-xs font-bold flex items-center justify-center gap-1.5"
          >
            <XCircle className="w-4 h-4" /> Não aprovar — Diagnóstico 2
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 justify-end">
        <button
          type="button"
          onClick={handleCopy}
          className="px-3 py-2 rounded-lg border border-tech-borda text-[11px] font-bold text-slate-300 flex items-center gap-1"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          Copiar
        </button>
        {whatsappShareUrl && (
          <a
            href={whatsappShareUrl}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-2 rounded-lg border border-tech-borda text-[11px] font-bold text-slate-300"
          >
            WhatsApp
          </a>
        )}
        <button
          type="button"
          onClick={onNewDiagnosis}
          className="px-3 py-2 rounded-lg border border-tech-borda text-[11px] font-bold text-slate-300 flex items-center gap-1"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Novo diagnóstico
        </button>
      </div>
    </section>
  );
}
