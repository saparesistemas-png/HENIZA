import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Bluetooth,
  BluetoothOff,
  Gauge,
  Play,
  Square,
  Thermometer,
  Zap,
} from 'lucide-react';
import {
  DEFAULT_POLL_PIDS,
  getObdLiveSession,
  isWebBluetoothAvailable,
  ObdLiveSnapshot,
  PID_DEFS,
  PidId,
} from '../services/obdLive';

type Props = {
  setSuccessToast: (msg: string | null) => void;
  onInjectSymptom?: (text: string) => void;
  onRequestDiagnosis?: () => void;
};

function stateLabel(state: ObdLiveSnapshot['state']) {
  switch (state) {
    case 'disconnected':
      return 'Desconectado';
    case 'connecting':
      return 'Conectando…';
    case 'ready':
      return 'Pronto';
    case 'polling':
      return 'Lendo PIDs';
    case 'simulated':
      return 'Simulador';
    case 'error':
      return 'Erro';
    default:
      return state;
  }
}

function formatValue(v: number | null | undefined, unit: string) {
  if (v == null || Number.isNaN(v)) return '—';
  const n = Math.abs(v) >= 100 ? v.toFixed(0) : v.toFixed(1);
  return `${n} ${unit}`;
}

export default function ObdLivePanel({ setSuccessToast, onInjectSymptom, onRequestDiagnosis }: Props) {
  const session = useMemo(() => getObdLiveSession(), []);
  const [snap, setSnap] = useState<ObdLiveSnapshot>(() => session.snapshot());
  const [open, setOpen] = useState(false);
  const bleOk = isWebBluetoothAvailable();

  useEffect(() => session.subscribe(setSnap), [session]);

  const tempPids: PidId[] = ['coolant', 'iat', 'oilTemp'];
  const motorPids: PidId[] = ['rpm', 'speed', 'throttle', 'load'];
  const fuelPids: PidId[] = ['stft_b1', 'ltft_b1', 'maf', 'fuelLevel'];

  const connectBle = async () => {
    try {
      await session.connectBluetooth();
      setSuccessToast('ELM327 conectado. Inicie a leitura.');
      setOpen(true);
    } catch (err: any) {
      setSuccessToast(err?.message || 'Falha ao conectar Bluetooth');
    }
  };

  const startSim = () => {
    session.startSimulator();
    session.startPolling();
    setOpen(true);
    setSuccessToast('Simulador OBD ativo — valores demonstrativos.');
  };

  const startPoll = () => {
    try {
      session.setPollPids([...DEFAULT_POLL_PIDS, 'oilTemp', 'ltft_b1']);
      session.startPolling(1000);
      setSuccessToast('Leitura de PIDs iniciada.');
    } catch (err: any) {
      setSuccessToast(err?.message || 'Não foi possível iniciar a leitura');
    }
  };

  const stop = () => {
    session.stopPolling();
    setSuccessToast('Leitura pausada.');
  };

  const disconnect = () => {
    session.disconnect();
    setSuccessToast('OBD desconectado.');
  };

  const inject = () => {
    const hint = session.buildSymptomHint();
    onInjectSymptom?.(hint);
    setSuccessToast('Leituras OBD enviadas ao campo de sintomas.');
  };

  const diagnoseWithAi = () => {
    const hint = session.buildSymptomHint();
    onInjectSymptom?.(hint);
    setSuccessToast('Enviando OBD + relato para a IA…');
    setTimeout(() => onRequestDiagnosis?.(), 50);
  };

  const renderGroup = (title: string, ids: PidId[], icon: React.ReactNode) => (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
        {icon}
        {title}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {ids.map((id) => {
          const def = PID_DEFS.find((p) => p.id === id);
          const sample = snap.samples[id];
          const hot = id === 'coolant' && sample?.value != null && sample.value >= 105;
          return (
            <div
              key={id}
              className={`rounded-xl border p-2.5 ${
                hot ? 'border-red-500/50 bg-red-500/10' : 'border-tech-borda bg-tech-fundo/60'
              }`}
            >
              <p className="text-[10px] text-slate-400 leading-tight">{def?.name || id}</p>
              <p className={`text-sm font-black mt-1 ${hot ? 'text-red-300' : 'text-white'}`}>
                {formatValue(sample?.value, def?.unit || '')}
              </p>
              {!sample?.ok && sample?.error && (
                <p className="text-[9px] text-amber-400/80 mt-0.5">{sample.error}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <section className="bg-tech-cartao rounded-2xl border border-cyan-500/25 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <div>
            <p className="text-xs font-black text-white uppercase tracking-wide">OBD ao vivo</p>
            <p className="text-[10px] text-slate-400">
              {stateLabel(snap.state)}
              {snap.deviceName ? ` · ${snap.deviceName}` : ''}
              {!bleOk ? ' · Bluetooth web indisponível neste navegador' : ''}
            </p>
          </div>
        </div>
        <span className="text-[10px] font-bold text-cyan-300">{open ? 'Ocultar' : 'Abrir'}</span>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4 border-t border-tech-borda/60 pt-3">
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Conecte um <strong className="text-slate-200">ELM327 BLE</strong> ou use o simulador. Depois clique em{' '}
            <strong className="text-slate-200">Diagnosticar com IA</strong> para cruzar os PIDs com o laudo.
          </p>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!bleOk || snap.state === 'connecting'}
              onClick={() => void connectBle()}
              className="px-3 py-2 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-[11px] font-bold text-cyan-200 flex items-center gap-1.5 disabled:opacity-40"
            >
              <Bluetooth className="w-3.5 h-3.5" />
              Conectar ELM327
            </button>
            <button
              type="button"
              onClick={startSim}
              className="px-3 py-2 rounded-xl bg-tech-destaque/15 border border-tech-destaque/30 text-[11px] font-bold text-tech-destaque flex items-center gap-1.5"
            >
              <Gauge className="w-3.5 h-3.5" />
              Simulador
            </button>
            {(snap.state === 'ready' || snap.state === 'simulated' || snap.state === 'polling') && (
              <>
                {snap.state !== 'polling' ? (
                  <button
                    type="button"
                    onClick={startPoll}
                    className="px-3 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-[11px] font-bold text-emerald-300 flex items-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5" />
                    Ler PIDs
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stop}
                    className="px-3 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-[11px] font-bold text-amber-200 flex items-center gap-1.5"
                  >
                    <Square className="w-3.5 h-3.5" />
                    Pausar
                  </button>
                )}
                <button
                  type="button"
                  onClick={inject}
                  className="px-3 py-2 rounded-xl border border-tech-borda text-[11px] font-bold text-slate-200"
                >
                  Usar no diagnóstico
                </button>
                {onRequestDiagnosis && (
                  <button
                    type="button"
                    onClick={diagnoseWithAi}
                    className="px-3 py-2 rounded-xl bg-tech-destaque text-tech-fundo text-[11px] font-black"
                  >
                    Diagnosticar com IA
                  </button>
                )}
              </>
            )}
            {snap.state !== 'disconnected' && (
              <button
                type="button"
                onClick={disconnect}
                className="px-3 py-2 rounded-xl border border-red-500/30 text-[11px] font-bold text-red-300 flex items-center gap-1.5"
              >
                <BluetoothOff className="w-3.5 h-3.5" />
                Desconectar
              </button>
            )}
          </div>

          {snap.lastError && (
            <p className="text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
              {snap.lastError}
            </p>
          )}

          {renderGroup('Temperaturas', tempPids, <Thermometer className="w-3 h-3 text-cyan-400" />)}
          {renderGroup('Motor', motorPids, <Gauge className="w-3 h-3 text-tech-destaque" />)}
          {renderGroup('Mistura / combustível', fuelPids, <Zap className="w-3 h-3 text-amber-400" />)}

          {snap.samples.voltage && (
            <p className="text-[11px] text-slate-400">
              Tensão módulo:{' '}
              <span className="text-white font-bold">
                {formatValue(snap.samples.voltage.value, 'V')}
              </span>
              {snap.protocol ? ` · ${snap.protocol}` : ''}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
