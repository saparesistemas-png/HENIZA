import React from 'react';
import { Wrench, BookOpen, Handshake, ArrowRight, Lock, CheckCircle2, Smartphone, QrCode } from 'lucide-react';

interface HenizaHomeProps {
  onNavigate: (view: 'diagnostico' | 'instrucoes' | 'parceiro') => void;
  isLoggedIn?: boolean;
  onOpenInstallModal?: () => void;
}

export default function HenizaHome({ onNavigate, isLoggedIn = false, onOpenInstallModal }: HenizaHomeProps) {
  return (
    <div className="max-w-5xl mx-auto py-3 sm:py-6 md:py-8 px-2 sm:px-4 animate-fadeIn space-y-6 sm:space-y-8">
      
      {/* =========================================================================
          ABERTURA MARCANTE E VISUALMENTE LIMPA — OFICIA EM MÁXIMA EVIDÊNCIA
          ========================================================================= */}
      <section className="text-center relative flex flex-col items-center justify-center pt-3 sm:pt-6 pb-2">
        {/* Glow de fundo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 sm:w-96 h-72 sm:h-96 bg-tech-destaque/12 rounded-full blur-3xl pointer-events-none -z-10" />

        {/* NOME DO SISTEMA EM TOTAL EVIDÊNCIA: OFICIA */}
        <div className="relative">
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight text-white font-display select-none">
            Ofic<span className="text-tech-destaque drop-shadow-[0_0_30px_rgba(0,255,102,0.65)]">IA</span>
            <span className="text-xs sm:text-sm font-mono text-tech-destaque align-super ml-1 sm:ml-1.5 border border-tech-destaque/40 px-1.5 py-0.5 rounded-md bg-tech-destaque/10">
              TM
            </span>
          </h1>
        </div>
      </section>

      {/* =========================================================================
          OS 3 BOTÕES DIRECIONANDO (DIAGNÓSTICO, INSTRUÇÃO, SER PARCEIRO)
          ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-5">

        {/* BOTÃO 1: DIAGNÓSTICO (REQUER LOGIN) */}
        <button
          onClick={() => onNavigate('diagnostico')}
          className="group relative bg-gradient-to-b from-tech-cartao to-[#08100B] border-2 border-tech-destaque/40 hover:border-tech-destaque rounded-2xl p-4 sm:p-5 md:p-6 text-left transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,255,102,0.35)] hover:-translate-y-1 cursor-pointer flex flex-col justify-between overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-28 h-28 bg-tech-destaque/15 rounded-full blur-2xl pointer-events-none group-hover:bg-tech-destaque/25 transition duration-300" />
          <div className="absolute top-0 inset-x-0 h-1 bg-tech-destaque shadow-[0_0_10px_#00FF66]" />

          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-13 h-13 rounded-xl bg-tech-destaque/15 border border-tech-destaque/40 flex items-center justify-center text-tech-destaque group-hover:scale-110 group-hover:bg-tech-destaque group-hover:text-tech-fundo transition duration-300 shadow-[0_0_15px_rgba(0,255,102,0.2)]">
                <Wrench className="w-6 h-6" />
              </div>

              {isLoggedIn ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-tech-destaque bg-tech-destaque/15 px-2 py-0.5 rounded-full border border-tech-destaque/30">
                  <CheckCircle2 className="w-3 h-3" /> Acesso Liberado
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-500/40">
                  <Lock className="w-3 h-3" /> Requer Login
                </span>
              )}
            </div>

            <span className="text-[10px] font-mono font-black text-tech-destaque uppercase tracking-widest block mb-1">
              OficIA • AutoOps
            </span>
            <h3 className="text-lg sm:text-xl font-black text-white font-display tracking-tight group-hover:text-tech-destaque transition">
              Diagnóstico Automotivo
            </h3>

            <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">
              Preencha os dados do veículo, relate os sintomas e emita o laudo técnico com Inteligência Artificial e protocolos para carros a combustão e elétricos (EV/DoIP).
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-tech-borda flex items-center justify-between text-tech-destaque font-black text-xs font-mono uppercase tracking-wider group-hover:translate-x-1 transition">
            <span>{isLoggedIn ? 'Iniciar Diagnóstico' : 'Fazer Login & Diagnosticar'}</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </button>

        {/* BOTÃO 2: INSTRUÇÕES (REQUER LOGIN) */}
        <button
          onClick={() => onNavigate('instrucoes')}
          className="group relative bg-gradient-to-b from-tech-cartao to-[#090E14] border-2 border-slate-700/80 hover:border-cyan-400 rounded-2xl p-4 sm:p-5 md:p-6 text-left transition-all duration-300 hover:shadow-[0_0_30px_rgba(6,182,212,0.3)] hover:-translate-y-1 cursor-pointer flex flex-col justify-between overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-28 h-28 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-cyan-500/20 transition duration-300" />
          <div className="absolute top-0 inset-x-0 h-1 bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.8)]" />

          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-13 h-13 rounded-xl bg-cyan-500/15 border border-cyan-400/40 flex items-center justify-center text-cyan-400 group-hover:scale-110 group-hover:bg-cyan-400 group-hover:text-tech-fundo transition duration-300 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                <BookOpen className="w-6 h-6" />
              </div>

              {isLoggedIn ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded-full border border-cyan-400/30">
                  <CheckCircle2 className="w-3 h-3" /> Acesso Liberado
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-500/40">
                  <Lock className="w-3 h-3" /> Requer Login
                </span>
              )}
            </div>

            <span className="text-[10px] font-mono font-black text-cyan-400 uppercase tracking-widest block mb-1">
              Manual Operacional
            </span>
            <h3 className="text-lg sm:text-xl font-black text-white font-display tracking-tight group-hover:text-cyan-300 transition">
              Instruções de Uso
            </h3>

            <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">
              Guia prático e intuitivo de utilização: como consultar por chassi ou placa, gravação acústica de ruídos do motor, códigos de falha e impressão do laudo.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-tech-borda flex items-center justify-between text-cyan-400 font-black text-xs font-mono uppercase tracking-wider group-hover:translate-x-1 transition">
            <span>{isLoggedIn ? 'Ver Instruções' : 'Fazer Login & Acessar'}</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </button>

        {/* BOTÃO 3: SER PARCEIRO (ABERTO A TODOS) */}
        <button
          onClick={() => onNavigate('parceiro')}
          className="group relative bg-gradient-to-b from-tech-cartao to-[#110F0A] border-2 border-slate-700/80 hover:border-amber-400 rounded-2xl p-4 sm:p-5 md:p-6 text-left transition-all duration-300 hover:shadow-[0_0_30px_rgba(245,158,11,0.3)] hover:-translate-y-1 cursor-pointer flex flex-col justify-between overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-28 h-28 bg-amber-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-amber-500/20 transition duration-300" />
          <div className="absolute top-0 inset-x-0 h-1 bg-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.8)]" />

          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-13 h-13 rounded-xl bg-amber-500/15 border border-amber-400/40 flex items-center justify-center text-amber-400 group-hover:scale-110 group-hover:bg-amber-400 group-hover:text-tech-fundo transition duration-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                <Handshake className="w-6 h-6" />
              </div>

              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-700">
                Acesso Aberto
              </span>
            </div>

            <span className="text-[10px] font-mono font-black text-amber-400 uppercase tracking-widest block mb-1">
              Rede & Homologação
            </span>
            <h3 className="text-lg sm:text-xl font-black text-white font-display tracking-tight group-hover:text-amber-300 transition">
              Seja um Parceiro
            </h3>

            <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">
              Credencie sua oficina mecânica, funilaria ou frota de locadora à rede oficial. Tenha laudos homologados, suporte técnico e vantagens exclusivas.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-tech-borda flex items-center justify-between text-amber-400 font-black text-xs font-mono uppercase tracking-wider group-hover:translate-x-1 transition">
            <span>Quero ser Parceiro</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </button>

      </div>

      {/* =========================================================================
          ATALHO DE INSTALAÇÃO NO SMARTPHONE PARA MECÂNICOS E OFICINAS
          ========================================================================= */}
      {onOpenInstallModal && (
        <div className="bg-gradient-to-r from-tech-fundo via-tech-cartao to-tech-fundo border-2 border-tech-destaque/40 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg hover:border-tech-destaque transition">
          <div className="flex items-center gap-3.5 text-left">
            <div className="w-12 h-12 rounded-xl bg-tech-destaque/15 border border-tech-destaque/50 flex items-center justify-center text-tech-destaque shrink-0 shadow-[0_0_15px_rgba(0,255,102,0.25)]">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm sm:text-base font-bold text-white font-display">
                  Instalar nos Smartphones da Oficina
                </h4>
                <span className="text-[9px] font-mono bg-tech-destaque/20 text-tech-destaque border border-tech-destaque/40 px-1.5 py-0.5 rounded font-bold uppercase">
                  Android & iPhone
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Acesse como aplicativo na tela inicial sem precisar de lojas de apps. Gere QR Code para os mecânicos escanearem.
              </p>
            </div>
          </div>

          <button
            onClick={onOpenInstallModal}
            className="w-full sm:w-auto px-4 py-2.5 bg-tech-destaque hover:bg-tech-destaque/90 text-tech-fundo font-mono font-black text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_12px_rgba(0,255,102,0.3)] shrink-0"
          >
            <QrCode className="w-4 h-4" />
            <span>Ver QR Code & Guia</span>
          </button>
        </div>
      )}

      {/* =========================================================================
          CHANCELA INSTITUCIONAL COMPACTA
          ========================================================================= */}
      <div className="border border-tech-borda bg-tech-cartao/60 rounded-xl p-4 text-center">
        <p className="text-[11px] text-slate-400 font-mono">
          Suporte Técnico & Parcerias: <strong className="text-tech-destaque">natanaelmessiasdesouza@gmail.com</strong> • Conectando tecnologia automotiva de ponta.
        </p>
      </div>

    </div>
  );
}
