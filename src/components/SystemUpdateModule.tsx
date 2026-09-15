import React, { useEffect, useState } from 'react';
import { Cpu, RefreshCw, Shield, Download, AlertTriangle } from 'lucide-react';

type SystemStatus = {
  ok?: boolean;
  app?: { name?: string; version?: string; buildLabel?: string; modules?: string[] };
  health?: { gemini?: boolean; openLabor?: boolean; timestamp?: string };
  capabilities?: Record<string, boolean>;
  systemUpdateCatalogSize?: number;
  updateGuidance?: { app?: string; vehicle?: string };
};

type Props = {
  setSuccessToast: (msg: string | null) => void;
  onInjectSymptom?: (text: string) => void;
};

export default function SystemUpdateModule({ setSuccessToast, onInjectSymptom }: Props) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(false);

  const loadStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/system-status');
      const json = await res.json();
      setStatus(json);
      if (!json?.ok) setSuccessToast('Não foi possível ler o status do sistema.');
    } catch {
      setSuccessToast('Falha ao consultar /api/system-status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && !status) void loadStatus();
  }, [open]);

  const refreshApp = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      setSuccessToast('Cache limpo. Recarregando…');
      setTimeout(() => window.location.reload(), 600);
    } catch {
      setSuccessToast('Recarregue a página manualmente (Ctrl+F5).');
      window.location.reload();
    }
  };

  const injectEcuCheck = () => {
    onInjectSymptom?.(
      'Verificar atualização de software das centrais (ECU/TCU/BCM). Após bateria ou códigos de comunicação.'
    );
    setSuccessToast('Orientação de atualização de sistemas adicionada ao relato.');
  };

  return (
    <section className="bg-tech-cartao rounded-2xl border border-violet-500/30 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-violet-400" />
          <div>
            <p className="text-xs font-black text-white uppercase tracking-wide">
              Atualização de sistemas
            </p>
            <p className="text-[10px] text-slate-400">
              App HENIZA + orientação de software de centrais (ECU/TCU/BCM)
            </p>
          </div>
        </div>
        <span className="text-[10px] font-bold text-violet-300">{open ? 'Ocultar' : 'Abrir'}</span>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-tech-borda/60 pt-3">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void loadStatus()}
              disabled={loading}
              className="px-3 py-2 rounded-xl bg-violet-500/15 border border-violet-500/30 text-[11px] font-bold text-violet-200 flex items-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Status do sistema
            </button>
            <button
              type="button"
              onClick={() => void refreshApp()}
              className="px-3 py-2 rounded-xl bg-tech-destaque/15 border border-tech-destaque/30 text-[11px] font-bold text-tech-destaque flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Atualizar app (limpar cache)
            </button>
            <button
              type="button"
              onClick={injectEcuCheck}
              className="px-3 py-2 rounded-xl border border-tech-borda text-[11px] font-bold text-slate-200 flex items-center gap-1.5"
            >
              <Shield className="w-3.5 h-3.5" />
              Checar software no diagnóstico
            </button>
          </div>

          {status?.app && (
            <div className="rounded-xl border border-tech-borda bg-tech-fundo/50 p-3 space-y-2">
              <p className="text-xs font-black text-white">
                {status.app.name}{' '}
                <span className="text-violet-300">v{status.app.version}</span>
              </p>
              <p className="text-[10px] text-slate-500">{status.app.buildLabel}</p>
              <div className="flex flex-wrap gap-1.5">
                {(status.app.modules || []).map((m) => (
                  <span
                    key={m}
                    className="text-[9px] px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-200 border border-violet-500/20"
                  >
                    {m}
                  </span>
                ))}
              </div>
              <div className="text-[11px] text-slate-400 space-y-1 pt-1">
                <p>
                  Gemini:{' '}
                  <span className={status.health?.gemini ? 'text-emerald-400' : 'text-amber-400'}>
                    {status.health?.gemini ? 'conectado' : 'sem chave'}
                  </span>
                  {' · '}Open Labor:{' '}
                  <span className={status.health?.openLabor ? 'text-emerald-400' : 'text-slate-500'}>
                    {status.health?.openLabor ? 'ativo' : 'opcional'}
                  </span>
                </p>
                <p>Catálogo de campanhas de software: {status.systemUpdateCatalogSize ?? '—'}</p>
              </div>
            </div>
          )}

          <div className="flex gap-2 text-[11px] text-slate-400 leading-relaxed">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p>
              {status?.updateGuidance?.vehicle ||
                'Reprogramação de centrais exige equipamento OEM, tensão estável e campanha oficial. O OficIA orienta; não executa o flash.'}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
