import React, { useEffect, useState } from 'react';
import { Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { syncEngine } from '../sync/syncEngine';

/** Badge de fila outbox Dexie — pendências / sync. */
export default function OutboxStatusBadge() {
  const [pending, setPending] = useState(0);
  const [status, setStatus] = useState<'idle' | 'syncing' | 'error'>('idle');
  const [online, setOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  const refresh = async () => {
    try {
      const n = await syncEngine.remaining();
      setPending(n);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    syncEngine.start();
    void refresh();
    const unsub = syncEngine.subscribe((s, result) => {
      setStatus(s);
      if (result) setPending(result.remaining);
      else void refresh();
    });
    const onOff = () => setOnline(false);
    const onOn = () => {
      setOnline(true);
      void syncEngine.run();
    };
    window.addEventListener('offline', onOff);
    window.addEventListener('online', onOn);
    const t = window.setInterval(() => void refresh(), 15_000);
    return () => {
      unsub();
      window.removeEventListener('offline', onOff);
      window.removeEventListener('online', onOn);
      window.clearInterval(t);
    };
  }, []);

  const label = !online
    ? 'Offline'
    : status === 'syncing'
      ? 'Sincronizando…'
      : pending > 0
        ? `${pending} na fila`
        : 'Sincronizado';

  return (
    <button
      type="button"
      onClick={() => void syncEngine.run().then(() => refresh())}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold ${
        !online
          ? 'border-slate-500 text-slate-400'
          : pending > 0
            ? 'border-amber-500/50 text-amber-200 bg-amber-500/10'
            : 'border-emerald-500/40 text-emerald-300 bg-emerald-500/10'
      }`}
      title="Toque para forçar envio da outbox"
    >
      {status === 'syncing' ? (
        <RefreshCw className="w-3 h-3 animate-spin" />
      ) : online ? (
        <Cloud className="w-3 h-3" />
      ) : (
        <CloudOff className="w-3 h-3" />
      )}
      {label}
    </button>
  );
}
