import React, { useEffect, useState } from 'react';
import { Building2, Link2, RefreshCw, Copy, Check } from 'lucide-react';
import {
  createApprovalRequest,
  listLocalApprovals,
  refreshApproval,
  whatsappApprovalLink,
  type ApprovalItem,
} from '../services/rentalApproval';

type Props = {
  plate: string;
  chassis?: string;
  vehicleLabel: string;
  problemName?: string;
  diagnosticNotes?: string;
  budgetTotal?: number;
  budgetItems?: Array<{ item: string; category?: string; estimatedCost: number }>;
  caseId?: string;
  setSuccessToast: (msg: string | null) => void;
};

export default function RentalApprovalPanel({
  plate,
  chassis,
  vehicleLabel,
  problemName,
  diagnosticNotes,
  budgetTotal,
  budgetItems,
  caseId,
  setSuccessToast,
}: Props) {
  const [open, setOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Array<ApprovalItem & { url?: string }>>([]);
  const [lastUrl, setLastUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setItems(listLocalApprovals().filter((i) => !plate || i.plate === plate.toUpperCase()));
  }, [plate]);

  const create = async () => {
    if (!plate || plate.length < 5) {
      setSuccessToast('Informe a placa antes de solicitar aprovação.');
      return;
    }
    setLoading(true);
    try {
      const res = await createApprovalRequest({
        caseId,
        plate,
        chassis,
        vehicleLabel,
        problemName,
        diagnosticNotes,
        budgetTotal,
        budgetItems,
      });
      if (!res.ok || !res.url) {
        setSuccessToast(res.error || 'Não foi possível criar o pedido (precisa estar online).');
        return;
      }
      setLastUrl(res.url);
      setItems(listLocalApprovals().filter((i) => !plate || i.plate === plate.toUpperCase()));
      setSuccessToast('Link de aprovação gerado — envie à locadora.');
    } finally {
      setLoading(false);
    }
  };

  const refresh = async (id: string) => {
    const row = await refreshApproval(id);
    if (row) {
      setItems(listLocalApprovals().filter((i) => !plate || i.plate === plate.toUpperCase()));
      setSuccessToast(`Status: ${row.status}`);
    } else {
      setSuccessToast('Não atualizou (servidor ou id).');
    }
  };

  const copy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setSuccessToast('Link copiado.');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setSuccessToast('Falha ao copiar.');
    }
  };

  return (
    <section className="bg-tech-cartao rounded-2xl border border-amber-500/30 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-amber-400" />
          <div>
            <p className="text-xs font-black text-white uppercase tracking-wide">
              Aprovação locadora / seguradora
            </p>
            <p className="text-[10px] text-slate-400">Link público · 72h · WhatsApp</p>
          </div>
        </div>
        <span className="text-[10px] font-bold text-amber-300">{open ? 'Ocultar' : 'Abrir'}</span>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-tech-borda/60 pt-3">
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Gera um link para o gestor da frota aprovar ou recusar o orçamento sem precisar de conta
            no OficIA.
          </p>

          <button
            type="button"
            disabled={loading}
            onClick={() => void create()}
            className="w-full py-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-xs font-black text-amber-100 disabled:opacity-50"
          >
            {loading ? 'Gerando…' : 'Solicitar aprovação agora'}
          </button>

          {lastUrl && (
            <div className="rounded-xl border border-tech-borda bg-tech-fundo/50 p-3 space-y-2">
              <p className="text-[10px] text-slate-500 break-all">{lastUrl}</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void copy(lastUrl)}
                  className="text-[10px] px-2 py-1 rounded border border-tech-borda text-slate-300 flex items-center gap-1"
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  Copiar link
                </button>
                <a
                  href={whatsappApprovalLink(lastUrl, plate, budgetTotal)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] px-2 py-1 rounded border border-emerald-500/30 text-emerald-200 flex items-center gap-1"
                >
                  <Link2 className="w-3 h-3" /> WhatsApp
                </a>
              </div>
            </div>
          )}

          {items.length > 0 && (
            <ul className="space-y-2 max-h-40 overflow-y-auto">
              {items.slice(0, 8).map((it) => (
                <li
                  key={it.id}
                  className="text-[11px] rounded-lg border border-tech-borda px-2.5 py-2 flex justify-between gap-2"
                >
                  <div>
                    <p className="text-white font-semibold">
                      {it.plate}{' '}
                      <span
                        className={
                          it.status === 'approved'
                            ? 'text-emerald-300'
                            : it.status === 'rejected'
                              ? 'text-red-300'
                              : 'text-amber-300'
                        }
                      >
                        {it.status}
                      </span>
                    </p>
                    <p className="text-slate-500">
                      {it.problemName || '—'}
                      {it.budgetTotal != null ? ` · R$ ${it.budgetTotal.toFixed(2)}` : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void refresh(it.id)}
                    className="text-slate-400 hover:text-white"
                    title="Atualizar status"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
