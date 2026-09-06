import React from 'react';
import { ArrowLeft, Car, Mic, Cpu, Zap, ChevronRight } from 'lucide-react';

interface HenizaInstrucoesProps {
  onBack: () => void;
  onGoToDiagnostico: () => void;
}

export default function HenizaInstrucoes({ onBack, onGoToDiagnostico }: HenizaInstrucoesProps) {
  return (
    <div className="max-w-5xl mx-auto py-2 sm:py-4 px-2 sm:px-4 animate-fadeIn space-y-4 sm:space-y-6">
      
      {/* Barra Superior de Retorno */}
      <div className="flex items-center justify-between gap-4 pb-2 border-b border-tech-borda">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-mono font-bold text-slate-300 hover:text-tech-destaque transition cursor-pointer bg-tech-cartao px-3 py-1.5 rounded-lg border border-tech-borda hover:border-tech-destaque/40"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar à Tela Inicial</span>
        </button>
      </div>

      {/* Cabeçalho do Guia de Instruções */}
      <div className="bg-tech-cartao border border-tech-borda rounded-2xl p-4 sm:p-6 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-32 bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-black font-mono tracking-widest text-cyan-400 uppercase bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
              MANUAL OPERACIONAL OFICIAL
            </span>
            <h2 className="text-lg sm:text-2xl font-black text-white font-display tracking-tight mt-1.5">
              Instruções de Uso — Sistema OficIA
            </h2>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              Passo a passo simples e direto para realizar diagnósticos precisos e emitir laudos técnicos.
            </p>
          </div>

          <button
            onClick={onGoToDiagnostico}
            className="w-full sm:w-auto shrink-0 bg-tech-destaque text-tech-fundo text-xs font-black py-2.5 px-5 rounded-xl hover:scale-102 transition cursor-pointer shadow-[0_0_15px_rgba(0,255,102,0.3)] flex items-center justify-center gap-2"
          >
            <span>Ir para Diagnóstico</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Os Passos de Instrução */}
      <div className="space-y-4">

        {/* PASSO 1 */}
        <div className="bg-tech-cartao/90 border border-tech-borda rounded-xl p-5 hover:border-tech-destaque/40 transition">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-tech-destaque/15 text-tech-destaque flex items-center justify-center font-black font-mono text-base shrink-0 border border-tech-destaque/30">
              1
            </div>
            <div className="space-y-1.5 flex-1">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Car className="w-4 h-4 text-tech-destaque" />
                Preencha os dados do veículo
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                No topo do console de diagnóstico, informe a <strong>Placa</strong> (padrão Mercosul ou antigo) e o <strong>Chassi (VIN com 17 dígitos)</strong>. Selecione a <strong>Montadora</strong> e o <strong>Modelo</strong>.
              </p>
              <div className="bg-tech-fundo p-2.5 rounded-lg border border-tech-borda text-[11px] text-slate-400 font-mono">
                💡 Dica: O sistema decodifica automaticamente o ano, país de fabricação e planta através do Chassi (VIN).
              </div>
            </div>
          </div>
        </div>

        {/* PASSO 2 */}
        <div className="bg-tech-cartao/90 border border-tech-borda rounded-xl p-5 hover:border-cyan-400/40 transition">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center font-black font-mono text-base shrink-0 border border-cyan-400/30">
              2
            </div>
            <div className="space-y-1.5 flex-1">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Mic className="w-4 h-4 text-cyan-400" />
                Descreva os sintomas ou anexe mídia
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Relate os sintomas percebidos (ex: falha ao acelerar, luz de injeção acesa, barulho metálico). Você pode:
              </p>
              <ul className="text-xs text-slate-400 space-y-1 pl-4 list-disc font-mono">
                <li>Digitar livremente ou ditar por voz pelo microfone.</li>
                <li>Gravar áudio do motor em funcionamento para análise acústica de ruídos.</li>
                <li>Anexar fotos ou vídeos curtos de componentes vazando, desgastados ou do painel.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* PASSO 3 */}
        <div className="bg-tech-cartao/90 border border-tech-borda rounded-xl p-5 hover:border-tech-destaque/40 transition">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-tech-destaque/15 text-tech-destaque flex items-center justify-center font-black font-mono text-base shrink-0 border border-tech-destaque/30">
              3
            </div>
            <div className="space-y-1.5 flex-1">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-tech-destaque" />
                Diagnosticar com IA & Emitir Laudo Técnico
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Clique no botão principal verde. A Inteligência Artificial do sistema cruzará os sintomas com os manuais de serviço e especificações técnicas de montadoras.
              </p>
              <div className="bg-tech-fundo p-2.5 rounded-lg border border-tech-borda text-[11px] text-slate-400 font-mono">
                📋 O laudo emitido inclui: identificação da causa raiz, códigos de falha OBD2 ou DoIP, nível de gravidade, procedimentos de reset/calibração e estimativa de peças e serviços.
              </div>
            </div>
          </div>
        </div>

        {/* PASSO 4: CARROS ELÉTRICOS E FROTAS */}
        <div className="bg-tech-cartao/90 border border-tech-borda rounded-xl p-5 hover:border-amber-400/40 transition">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center font-black font-mono text-base shrink-0 border border-amber-400/30">
              4
            </div>
            <div className="space-y-1.5 flex-1">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                Veículos Elétricos (EV) & Frotas de Locadoras
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Para veículos elétricos (BYD, GWM, Volvo, etc.) ou frotas de locadoras (Polo Track, Onix):
              </p>
              <ul className="text-xs text-slate-400 space-y-1 pl-4 list-disc font-mono">
                <li><strong>Diagnóstico EV sem scanner:</strong> acesse os menus de engenharia na multimídia e verifique o isolamento com megômetro a 500V antes de manusear a trava de serviço (MSD).</li>
                <li><strong>Frotas:</strong> use os presets rápidos e gere checklists preventivos específicos para locadoras e devoluções.</li>
              </ul>
            </div>
          </div>
        </div>

      </div>

      {/* Botão de Chamada para Ação */}
      <div className="pt-2 text-center">
        <button
          onClick={onGoToDiagnostico}
          className="w-full sm:w-auto bg-gradient-to-r from-tech-destaque via-emerald-400 to-tech-destaque text-tech-fundo font-black text-sm py-3 px-8 rounded-xl hover:scale-102 transition cursor-pointer shadow-[0_0_20px_rgba(0,255,102,0.3)] inline-flex items-center justify-center gap-2"
        >
          <span>Iniciar Diagnóstico Agora</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
}
