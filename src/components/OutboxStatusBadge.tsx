import React, { useEffect, useState } from 'react';
import { Cloud, CloudOff, RefreshCw, ShieldAlert } from 'lucide-react';
import { syncEngine } from '../sync/syncEngine';

/** Badge de fila outbox Dexie + estado do circuit breaker. */
export default function OutboxStatusBadge() {
  const [pending, setPending] = useState(0);
  const [status, setStatus] = useState<'idle' | 'syncing' | 'error' | 'circuit_open'>('idle');
  const [online, setOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [circuitState, setCircuitState] = useState<string>('CLOSED');

  const refresh = async () => {
    try {
      const n = await syncEngine.remaining();
      setPending(n);
      const c = syncEngine.circuitSnapshot();
      setCircuitState(c.state);
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
      const c = syncEngine.circuitSnapshot();
      setCircuitState(c.state);
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

  const circuitOpen = circuitState === 'OPEN' || status === 'circuit_open';

  const label = !online
    ? 'Offline'
    : circuitOpen
      ? 'API em pausa'
      : circuitState === 'HALF_OPEN'
        ? 'Testando API…'
        : status === 'syncing'
          ? 'Sincronizando…'
          : pending > 0
            ? `${pending} na fila`
            : 'Sincronizado';

  return (
    <button
      type="button"
      onClick={() => {
        if (circuitOpen) {
          // toque longo não; toque: tenta run (só passa em HALF_OPEN)
          void syncEngine.run().then(() => refresh());
          return;
        }
        void syncEngine.run().then(() => refresh());
      }}
      onDoubleClick={() => {
        syncEngine.resetCircuit();
        void syncEngine.run().then(() => refresh());
      }}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold ${
        !online
          ? 'border-slate-500 text-slate-400'
          : circuitOpen
            ? 'border-red-500/50 text-red-200 bg-red-500/10'
            : circuitState === 'HALF_OPEN'
              ? 'border-amber-500/50 text-amber-200 bg-amber-500/10'
              : pending > 0
                ? 'border-amber-500/50 text-amber-200 bg-amber-500/10'
                : 'border-emerald-500/40 text-emerald-300 bg-emerald-500/10'
      }`}
      title="Toque: sincronizar · Duplo toque: reset circuit breaker"
    >
      {status === 'syncing' ? (
        <RefreshCw className="w-3 h-3 animate-spin" />
      ) : circuitOpen ? (
        <ShieldAlert className="w-3 h-3" />
      ) : online ? (
        <Cloud className="w-3 h-3" />
      ) : (
        <CloudOff className="w-3 h-3" />
      )}
      {label}
    </button>
  );
}
