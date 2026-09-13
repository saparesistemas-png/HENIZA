import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Wrench,
  BookOpen,
  ClipboardCheck,
  ArrowRight,
  ArrowLeft,
  Share2,
  Printer,
  Copy,
  Check,
  RotateCcw,
} from 'lucide-react';

export type DiagnosisData = {
  problemName?: string;
  severity?: string;
  diagnosticNotes?: string;
  resetProcedure?: string;
  correctiveChecklist?: string[];
  preventiveChecklist?: string[];
  budgetItems?: Array<{ item: string; category: string; estimatedCost: number }>;
  suggestedBestPractices?: string[];
  originBadge?: string;
  originExplanation?: string;
  codeType?: string;
  codeTypeLabel?: string;
  supplierCategory?: string;
  source?: string;
  networkNotes?: string;
  networkSources?: string[];
  [key: string]: unknown;
};

type Phase = 'compare' | 'budget' | 'override' | 'done';

type Props = {
  data: DiagnosisData;
  vehicleLabel: string;
  plate: string;
  chassis: string;
  whatsappShareUrl?: string;
  onConfirmBudget: (items: Array<{ item: string; category: string; estimatedCost: number }>, total: number) => void;
  onOverrideSubmit: (mechanicNotes: string) => void;
  onNewDiagnosis: () => void;
  setSuccessToast: (msg: string | null) => void;
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
  onConfirmBudget,
  onOverrideSubmit,
  onNewDiagnosis,
  setSuccessToast,
}: Props) {
  const [phase, setPhase] = useState<Phase>('compare');
  const [copied, setCopied] = useState(false);
  const [mechanicNotes, setMechanicNotes] = useState('');
  const [selectedItems, setSelectedItems] = useState<boolean[]>(
    () => (data.budgetItems || []).map(() => true)
  );

  const budgetItems = data.budgetItems || [];
  const total = useMemo(() => {
    return budgetItems.reduce((acc, item, i) => {
      if (!selectedItems[i]) return acc;
      return acc + (Number(item.estimatedCost) || 0);
    }, 0);
  }, [budgetItems, selectedItems]);

  const severity = (data.severity || 'Média').toString();
  const isHigh = /alta|high/i.test(severity);

  const networkText =
    data.networkNotes ||
    data.originExplanation ||
    'Cruzamento com base técnica da rede OficIA / manuais quando disponíveis. Validar sempre no veículo.';

  const networkSources =
    data.networkSources && data.networkSources.length
      ? data.networkSources
      : [data.source || 'Base técnica OficIA', data.codeTypeLabel || data.originBadge || 'Classificação do código/sintoma'].filter(
          Boolean
        ) as string[];

  const checks = data.correctiveChecklist || [];

  const toggleItem = (idx: number) => {
    setSelectedItems((prev) => prev.map((v, i) => (i === idx ? !v : v)));
  };

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
      'Verificações:',
      ...checks.map((c, i) => `${i + 1}. ${c}`),
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
      <section id="tela-retorno" className="bg-tech-cartao rounded-2xl border border-amber-500/40 p-4 sm:p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Wrench className="w-5 h-5 text-amber-400" />
          <h3 className="text-sm font-black text-white uppercase tracking-wide">Diagnóstico 2 — Avaliação do profissional</h3>
        </div>
        <p className="text-xs text-slate-300">
          A IA sugeriu: <span className="text-tech-destaque font-semibold">{data.problemName}</span>. Descreva o que você observou e a conclusão da oficina.
        </p>
        <textarea
          value={mechanicNotes}
          onChange={(e) => setMechanicNotes(e.target.value)}
          rows={5}
          placeholder="Ex.: Confirmei P0301 no cilindro 1. Bobina com faísca fraca. Vou trocar bobina e velas..."
          className="w-full rounded-xl bg-tech-fundo border border-tech-borda text-sm text-white p-3 outline-none focus:border-tech-destaque/50"
        />
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={() => setPhase('compare')}
            className="px-4 py-2.5 rounded-xl border border-tech-borda text-xs font-bold text-slate-300 flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao laudo IA
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
              setSuccessToast('Avaliação do profissional registrada. Revise o orçamento.');
            }}
            className="px-4 py-2.5 rounded-xl bg-tech-destaque text-tech-fundo text-xs font-black flex items-center justify-center gap-1.5"
          >
            Seguir para orçamento <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>
    );
  }

  if (phase === 'budget' || phase === 'done') {
    return (
      <section id="tela-retorno" className="bg-tech-cartao rounded-2xl border border-tech-destaque/40 p-4 sm:p-6 space-y-4">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="w-5 h-5 text-tech-destaque" />
          <h3 className="text-sm font-black text-white uppercase tracking-wide">
            {phase === 'done' ? 'Orçamento aprovado' : 'Orçamento sugerido pela IA'}
          </h3>
        </div>

        <p className="text-xs text-slate-400">
          {vehicleLabel} · Placa {plate || 'N/I'}
        </p>

        <div className="space-y-2">
          {budgetItems.length === 0 && (
            <p className="text-xs text-slate-400">Nenhum item de orçamento retornado. Você pode montar manualmente depois.</p>
          )}
          {budgetItems.map((item, idx) => (
            <label
              key={idx}
              className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer ${
                selectedItems[idx]
                  ? 'border-tech-destaque/40 bg-tech-destaque/5'
                  : 'border-tech-borda bg-tech-fundo/50 opacity-70'
              }`}
            >
              <input
                type="checkbox"
                checked={!!selectedItems[idx]}
                onChange={() => toggleItem(idx)}
                disabled={phase === 'done'}
                className="mt-1"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-semibold">{item.item}</p>
                <p className="text-[11px] text-slate-400">{item.category}</p>
              </div>
              <p className="text-sm font-bold text-tech-destaque whitespace-nowrap">
                {money(Number(item.estimatedCost) || 0)}
              </p>
            </label>
          ))}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-tech-borda">
          <span className="text-xs text-slate-400">Total selecionado</span>
          <span className="text-lg font-black text-tech-destaque">{money(total)}</span>
        </div>

        {phase === 'budget' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                onConfirmBudget(
                  budgetItems.filter((_, i) => selectedItems[i]),
                  total
                );
                setPhase('done');
                setSuccessToast('Orçamento aprovado e registrado.');
              }}
              className="py-3 rounded-xl bg-tech-destaque text-tech-fundo text-xs font-black flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" /> Aprovar orçamento
            </button>
            <button
              type="button"
              onClick={() => {
                setPhase('compare');
                setSuccessToast('Orçamento não aprovado. Você pode revisar o diagnóstico.');
              }}
              className="py-3 rounded-xl border border-red-500/40 text-red-300 text-xs font-bold flex items-center justify-center gap-1.5"
            >
              <XCircle className="w-4 h-4" /> Não aprovar
            </button>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-2">
            {whatsappShareUrl && (
              <a
                href={whatsappShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Share2 className="w-3.5 h-3.5" /> WhatsApp
              </a>
            )}
            <button type="button" onClick={() => window.print()} className="flex-1 py-2.5 rounded-xl border border-tech-borda text-xs font-bold text-slate-200 flex items-center justify-center gap-1.5">
              <Printer className="w-3.5 h-3.5" /> Imprimir
            </button>
            <button type="button" onClick={handleCopy} className="flex-1 py-2.5 rounded-xl border border-tech-borda text-xs font-bold text-slate-200 flex items-center justify-center gap-1.5">
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copiado' : 'Copiar'}
            </button>
            <button type="button" onClick={onNewDiagnosis} className="flex-1 py-2.5 rounded-xl bg-tech-destaque/15 text-tech-destaque text-xs font-bold flex items-center justify-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5" /> Novo
            </button>
          </div>
        )}
      </section>
    );
  }

  // phase === 'compare'
  return (
    <section id="tela-retorno" className="space-y-4 animate-slideUp">
      <div className="flex items-center justify-between gap-2 px-1">
        <h3 className="text-sm font-black text-white uppercase tracking-wide">Laudo para validação</h3>
        <span
          className={`text-[10px] font-black px-2.5 py-1 rounded-lg border ${
            isHigh
              ? 'bg-red-500/15 text-red-300 border-red-500/40'
              : 'bg-amber-500/15 text-amber-200 border-amber-500/40'
          }`}
        >
          Gravidade: {severity}
        </span>
      </div>

      {/* Quadro 1: IA x Rede */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-tech-cartao rounded-2xl border border-tech-destaque/35 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-tech-destaque" />
            <p className="text-[11px] font-black uppercase tracking-wider text-tech-destaque">1 · Diagnóstico da IA</p>
          </div>
          <p className="text-base font-bold text-white leading-snug">{data.problemName || 'Diagnóstico não classificado'}</p>
          <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">{data.diagnosticNotes}</p>
          {data.resetProcedure && (
            <div className="pt-2 border-t border-tech-borda/60">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Procedimento sugerido</p>
              <p className="text-xs text-slate-200 whitespace-pre-line">{data.resetProcedure}</p>
            </div>
          )}
        </div>

        <div className="bg-tech-cartao rounded-2xl border border-cyan-500/30 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <p className="text-[11px] font-black uppercase tracking-wider text-cyan-300">1 · Informações da rede</p>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">{networkText}</p>
          <ul className="space-y-1.5">
            {networkSources.map((s, i) => (
              <li key={i} className="text-[11px] text-slate-400 flex gap-2">
                <span className="text-cyan-400">•</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
          {data.supplierCategory && (
            <p className="text-[11px] text-slate-400">
              Categoria: <span className="text-slate-200">{String(data.supplierCategory)}</span>
            </p>
          )}
        </div>
      </div>

      {/* Quadro 2: sugestões do mecânico */}
      <div className="bg-tech-cartao rounded-2xl border border-tech-borda p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Wrench className="w-4 h-4 text-amber-400" />
          <p className="text-[11px] font-black uppercase tracking-wider text-amber-300">
            2 · Sugestões para o mecânico verificar
          </p>
        </div>
        <p className="text-xs text-slate-400">
          Confira no veículo antes de aprovar o diagnóstico da IA.
        </p>
        <ol className="space-y-2">
          {checks.map((c, i) => (
            <li key={i} className="flex gap-2 text-sm text-slate-100">
              <span className="text-tech-destaque font-black text-xs mt-0.5">{i + 1}.</span>
              <span>{c}</span>
            </li>
          ))}
          {checks.length === 0 && (
            <li className="text-xs text-slate-500">Nenhuma verificação específica retornada.</li>
          )}
        </ol>

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
        <button type="button" onClick={handleCopy} className="px-3 py-2 rounded-lg border border-tech-borda text-[11px] font-bold text-slate-300 flex items-center gap-1">
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          Copiar
        </button>
        <button type="button" onClick={onNewDiagnosis} className="px-3 py-2 rounded-lg border border-tech-borda text-[11px] font-bold text-slate-300 flex items-center gap-1">
          <RotateCcw className="w-3.5 h-3.5" /> Novo diagnóstico
        </button>
      </div>
    </section>
  );
}
