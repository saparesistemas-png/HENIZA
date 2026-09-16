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
import ConfidenceLayers from './ConfidenceLayers';

type DiagnosisData = {
  problemName?: string;
  severity?: string;
  diagnosticNotes?: string;
  originBadge?: string;
  source?: string;
  correctiveChecklist?: string[];
  preventivePlan?: {
    items?: Array<{ name: string; dueReason?: string }>;
  };
  budgetItems?: Array<{ item: string; category: string; estimatedCost: number }>;
  networkNotes?: string;
  networkHits?: Array<{ title: string; url?: string; snippet?: string }>;
  mechanicOverride?: string;
  faultEvents?: Array<{ id: string; title: string; severity: string; message?: string }>;
  liveObd?: unknown[];
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
  onOverrideSubmit: (mechanicNotes: string) => void;
};

export default function DiagnosisResultFlow({
  data,
  vehicleLabel,
  plate,
  whatsappShareUrl,
  setSuccessToast,
  onNewDiagnosis,
  onConfirmBudget,
  onOverrideSubmit,
}: Props) {
  const [step, setStep] = useState<'result' | 'budget' | 'override'>('result');
  const [copied, setCopied] = useState(false);
  const [overrideText, setOverrideText] = useState('');

  const severity = data.severity || 'Média';
  const budgetItems = data.budgetItems || [];
  const total = useMemo(
    () => budgetItems.reduce((s, i) => s + (Number(i.estimatedCost) || 0), 0),
    [budgetItems]
  );

  const copyLaudo = async () => {
    const text = [
      `OficIA — ${vehicleLabel}`,
      plate ? `Placa: ${plate}` : '',
      `Diagnóstico IA: ${data.problemName || ''}`,
      `Gravidade: ${severity}`,
      data.diagnosticNotes || '',
      data.networkNotes || '',
    ]
      .filter(Boolean)
      .join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setSuccessToast('Laudo copiado.');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setSuccessToast('Não foi possível copiar.');
    }
  };

  if (step === 'budget') {
    return (
      <section className="bg-tech-cartao border border-tech-borda rounded-2xl p-4 sm:p-5 space-y-4">
        <button type="button" onClick={() => setStep('result')} className="text-xs text-slate-400 flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao laudo
        </button>
        <h3 className="text-sm font-black text-white">Orçamento sugerido</h3>
        <ul className="space-y-2">
          {budgetItems.map((b, i) => (
            <li key={i} className="flex justify-between text-sm border border-tech-borda rounded-lg px-3 py-2">
              <span className="text-slate-200">
                {b.item} <span className="text-[10px] text-slate-500">{b.category}</span>
              </span>
              <span className="text-tech-destaque font-bold">R$ {Number(b.estimatedCost).toFixed(2)}</span>
            </li>
          ))}
        </ul>
        <p className="text-right text-white font-black">Total R$ {total.toFixed(2)}</p>
        <button
          type="button"
          onClick={() => {
            onConfirmBudget(budgetItems, total);
            setSuccessToast('Orçamento aprovado e registrado.');
          }}
          className="w-full py-3 rounded-xl bg-emerald-500 text-tech-fundo text-xs font-black"
        >
          Aprovar orçamento
        </button>
      </section>
    );
  }

  if (step === 'override') {
    return (
      <section className="bg-tech-cartao border border-tech-borda rounded-2xl p-4 sm:p-5 space-y-3">
        <button type="button" onClick={() => setStep('result')} className="text-xs text-slate-400 flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Voltar
        </button>
        <h3 className="text-sm font-black text-white">Diagnóstico 2 — nota do profissional</h3>
        <textarea
          value={overrideText}
          onChange={(e) => setOverrideText(e.target.value)}
          rows={4}
          className="w-full rounded-lg bg-tech-fundo border border-tech-borda px-3 py-2 text-sm text-white"
          placeholder="Descreva a verificação e o laudo corrigido…"
        />
        <button
          type="button"
          onClick={() => {
            onOverrideSubmit(overrideText);
            setStep('result');
            setSuccessToast('Nota do profissional anexada ao laudo.');
          }}
          className="w-full py-3 rounded-xl bg-tech-destaque text-tech-fundo text-xs font-black"
        >
          Salvar e voltar
        </button>
      </section>
    );
  }

  return (
    <div className="space-y-4">
      <section className="bg-tech-cartao border border-tech-borda rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Wrench className="w-4 h-4 text-tech-destaque" />
          <p className="text-[11px] font-black uppercase tracking-wider text-tech-destaque">
            1 · Diagnóstico da IA × rede
          </p>
        </div>
        <h3 className="text-base font-black text-white leading-snug">{data.problemName}</h3>
        <p className="text-[11px] text-slate-400">
          Gravidade: <span className="text-white font-bold">{severity}</span>
          {data.originBadge ? ` · ${data.originBadge}` : ''}
        </p>
        <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">{data.diagnosticNotes}</p>

        <ConfidenceLayers data={data} />

        {(data.faultEvents?.length || 0) > 0 && (
          <div className="text-[11px] space-y-1">
            <p className="font-bold text-amber-200">Eventos do motor de regras</p>
            {data.faultEvents!.map((f) => (
              <p key={f.id} className="text-slate-300">
                [{f.severity}] {f.title}
                {f.message ? ` — ${f.message}` : ''}
              </p>
            ))}
          </div>
        )}

        {(data.networkHits?.length || 0) > 0 && (
          <div className="text-[11px] space-y-1 border-t border-tech-borda pt-2">
            <p className="font-bold text-cyan-200">Informações da rede</p>
            {data.networkHits!.slice(0, 5).map((h, i) => (
              <p key={i} className="text-slate-400">
                • {h.title}
              </p>
            ))}
          </div>
        )}

        {data.mechanicOverride && (
          <p className="text-[11px] text-emerald-200 border border-emerald-500/30 rounded-lg p-2">
            Profissional: {data.mechanicOverride}
          </p>
        )}
      </section>

      <section className="bg-tech-cartao border border-tech-borda rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex items-center gap-2 text-amber-300">
          <AlertTriangle className="w-4 h-4" />
          <p className="text-[11px] font-black uppercase tracking-wider">2 · Verificação do mecânico</p>
        </div>
        <ul className="space-y-1.5 text-sm text-slate-200">
          {(data.correctiveChecklist || ['Validar códigos no scanner', 'Confirmar massa e alimentação']).map(
            (c, i) => (
              <li key={i} className="flex gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                {c}
              </li>
            )
          )}
        </ul>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
          <button
            type="button"
            onClick={() => setStep('budget')}
            className="py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-xs font-black text-emerald-200 flex items-center justify-center gap-1"
          >
            <Check className="w-3.5 h-3.5" /> Aprovar → orçamento
          </button>
          <button
            type="button"
            onClick={() => setStep('override')}
            className="py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs font-black text-amber-200 flex items-center justify-center gap-1"
          >
            <XCircle className="w-3.5 h-3.5" /> Rejeitar → Diagnóstico 2
          </button>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            onClick={() => void copyLaudo()}
            className="text-[10px] px-2 py-1 rounded border border-tech-borda text-slate-300 flex items-center gap-1"
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            Copiar laudo
          </button>
          {whatsappShareUrl && (
            <a
              href={whatsappShareUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[10px] px-2 py-1 rounded border border-tech-borda text-slate-300"
            >
              WhatsApp
            </a>
          )}
          <button
            type="button"
            onClick={onNewDiagnosis}
            className="text-[10px] px-2 py-1 rounded border border-tech-borda text-slate-300 flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" /> Novo
          </button>
        </div>
        {(data.preventivePlan?.items?.length || 0) > 0 && (
          <div className="border-t border-tech-borda pt-3 space-y-1">
            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase">
              <BookOpen className="w-3 h-3" /> Preventiva
            </div>
            {data.preventivePlan!.items!.slice(0, 6).map((it, i) => (
              <p key={i} className="text-[11px] text-slate-300">
                • {it.name}
                {it.dueReason ? ` — ${it.dueReason}` : ''}
              </p>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
