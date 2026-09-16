import React, { useEffect, useState } from 'react';
import { Radio, Wifi } from 'lucide-react';
import { realtimeFeed, type FeedEvent } from '../services/realtimeFeed';
import { getOnlineToken } from '../services/onlineSession';

type Props = {
  plate?: string;
  chassis?: string;
};

export default function RealtimeFeedPanel({ plate = '', chassis = '' }: Props) {
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [onlineAuth, setOnlineAuth] = useState(false);

  useEffect(() => {
    setOnlineAuth(Boolean(getOnlineToken()));
    realtimeFeed.setVehicleFilter(plate, chassis);
    realtimeFeed.start(4000);
    const unsub = realtimeFeed.subscribe(setEvents);
    return () => {
      unsub();
    };
  }, [plate, chassis]);

  useEffect(() => {
    const t = setInterval(() => setOnlineAuth(Boolean(getOnlineToken())), 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="bg-tech-cartao rounded-2xl border border-violet-500/30 overflow-hidden">
      <div className="px-4 py-3 flex items-center justify-between gap-2 border-b border-tech-borda/50">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-violet-400" />
          <div>
            <p className="text-xs font-black text-white uppercase tracking-wide">Feed em tempo real</p>
            <p className="text-[10px] text-slate-400">Eventos da oficina / frota (polling 4s)</p>
          </div>
        </div>
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
            onlineAuth
              ? 'border-emerald-500/40 text-emerald-300'
              : 'border-slate-500 text-slate-400'
          }`}
        >
          <Wifi className="w-3 h-3 inline mr-1" />
          {onlineAuth ? 'JWT ativo' : 'Sem login online'}
        </span>
      </div>
      <div className="px-4 py-3 max-h-40 overflow-y-auto space-y-2">
        {!onlineAuth && (
          <p className="text-[11px] text-slate-500">
            Faça login online para receber e publicar eventos em tempo real entre dispositivos.
          </p>
        )}
        {onlineAuth && events.length === 0 && (
          <p className="text-[11px] text-slate-500">Aguardando eventos…</p>
        )}
        {events.slice(0, 12).map((e) => (
          <div
            key={e.id}
            className="text-[11px] rounded-lg border border-tech-borda bg-tech-fundo/50 px-2.5 py-1.5"
          >
            <div className="flex justify-between text-slate-500">
              <span>{e.type}</span>
              <span>{new Date(e.at).toLocaleTimeString('pt-BR')}</span>
            </div>
            <p className="text-white font-semibold">{e.title}</p>
            {e.plate && <p className="text-slate-400">{e.plate}</p>}
            {e.authorName && <p className="text-slate-500 text-[10px]">por {e.authorName}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}
