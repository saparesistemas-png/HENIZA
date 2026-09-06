import React, { useState } from 'react';
import { ArrowLeft, Handshake, CheckCircle2, ShieldCheck, Wrench, Building2, Send } from 'lucide-react';

interface HenizaParceiroProps {
  onBack: () => void;
  setSuccessToast: (msg: string) => void;
}

export default function HenizaParceiro({ onBack, setSuccessToast }: HenizaParceiroProps) {
  const [formData, setFormData] = useState({
    nomeEmpresa: '',
    responsavel: '',
    telefone: '',
    email: '',
    cidadeUf: '',
    segmento: 'Oficina Mecânica Multimarcas',
    mensagem: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nomeEmpresa || !formData.telefone) {
      alert("Por favor, preencha o nome da sua empresa e o telefone de contato.");
      return;
    }
    
    // Salva proposta localmente
    const existing = JSON.parse(localStorage.getItem('heniza_partner_proposals') || '[]');
    existing.push({ ...formData, data: new Date().toISOString() });
    localStorage.setItem('heniza_partner_proposals', JSON.stringify(existing));

    setSubmitted(true);
    setSuccessToast("Proposta de parceria enviada com sucesso! Entraremos em contato.");
  };

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

      {/* Cabeçalho do Programa de Parceria */}
      <div className="bg-tech-cartao border-2 border-amber-500/30 rounded-2xl p-4 sm:p-6 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-32 bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6">
          <div className="flex items-start sm:items-center gap-3.5 sm:gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0 drop-shadow-[0_0_15px_rgba(245,158,11,0.3)]">
              <Handshake className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div>
              <span className="text-[10px] font-black font-mono tracking-widest text-amber-400 uppercase bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">
                REDE HOMOLOGADA • CREDENCIAMENTO OFICIAL
              </span>
              <h2 className="text-lg sm:text-2xl font-black text-white font-display tracking-tight mt-1.5">
                Programa de Parceiros OficIA
              </h2>
              <p className="text-xs text-slate-300 mt-1 font-mono">
                Conecte sua oficina mecânica, funilaria ou frota corporativa ao sistema e expanda seu faturamento com laudos técnicos certificados.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Vantagens da Parceria */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-tech-cartao/90 border border-tech-borda p-3.5 sm:p-4 rounded-xl">
          <div className="w-8 h-8 rounded-lg bg-tech-destaque/15 text-tech-destaque flex items-center justify-center mb-2.5 sm:mb-3">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold text-white mb-1">Homologação Oficial</h4>
          <p className="text-xs text-slate-400 leading-relaxed font-mono">
            Emita laudos técnicos aceitos por seguradoras, locadoras e frotistas com certificação digital.
          </p>
        </div>

        <div className="bg-tech-cartao/90 border border-tech-borda p-3.5 sm:p-4 rounded-xl">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/15 text-cyan-400 flex items-center justify-center mb-2.5 sm:mb-3">
            <Wrench className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold text-white mb-1">Suporte para Carros Elétricos</h4>
          <p className="text-xs text-slate-400 leading-relaxed font-mono">
            Treinamento e procedimentos de segurança para reparo em modelos híbridos e 100% elétricos (BYD, GWM, etc).
          </p>
        </div>

        <div className="bg-tech-cartao/90 border border-tech-borda p-3.5 sm:p-4 rounded-xl">
          <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center mb-2.5 sm:mb-3">
            <Building2 className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold text-white mb-1">Rede de Peças & Descontos</h4>
          <p className="text-xs text-slate-400 leading-relaxed font-mono">
            Acesso prioritário a fornecedores credenciados e preços diferenciados para itens de alto giro e sensores.
          </p>
        </div>
      </div>

      {/* Formulário de Cadastro de Parceiro */}
      <div className="bg-tech-cartao border border-tech-borda rounded-2xl p-4 sm:p-6 shadow-xl">
        {submitted ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-tech-sucesso/20 text-tech-sucesso border-2 border-tech-sucesso mx-auto flex items-center justify-center shadow-[0_0_20px_rgba(0,255,102,0.3)]">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-white">Solicitação de Parceria Recebida!</h3>
            <p className="text-xs text-slate-300 max-w-md mx-auto font-mono">
              Obrigado por manifestar interesse em integrar a rede oficial. Nossa equipe técnica e comercial entrará em contato via WhatsApp/Telefone.
            </p>
            <div className="pt-2">
              <button
                onClick={() => setSubmitted(false)}
                className="text-xs text-tech-destaque underline font-mono cursor-pointer"
              >
                Enviar nova solicitação
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="border-b border-tech-borda pb-3">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Handshake className="w-4 h-4 text-amber-400" />
                Formulário de Credenciamento de Parceiro
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Preencha os dados abaixo para que nossa equipe avalie a homologação da sua oficina ou empresa.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-mono font-bold text-slate-300 uppercase mb-1">
                  Nome da Oficina / Empresa *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nomeEmpresa}
                  onChange={(e) => setFormData({ ...formData, nomeEmpresa: e.target.value })}
                  placeholder="Ex: Auto Mecânica Estrela / Locadora Alpha"
                  className="w-full bg-tech-fundo border border-tech-borda rounded-lg px-3 py-2 text-xs text-white focus:border-tech-destaque focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold text-slate-300 uppercase mb-1">
                  Responsável Técnico / Contato *
                </label>
                <input
                  type="text"
                  required
                  value={formData.responsavel}
                  onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
                  placeholder="Ex: Marcos Silva"
                  className="w-full bg-tech-fundo border border-tech-borda rounded-lg px-3 py-2 text-xs text-white focus:border-tech-destaque focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold text-slate-300 uppercase mb-1">
                  Telefone / WhatsApp *
                </label>
                <input
                  type="text"
                  required
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  placeholder="(11) 98765-4321"
                  className="w-full bg-tech-fundo border border-tech-borda rounded-lg px-3 py-2 text-xs text-white focus:border-tech-destaque focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold text-slate-300 uppercase mb-1">
                  Cidade e Estado (UF)
                </label>
                <input
                  type="text"
                  value={formData.cidadeUf}
                  onChange={(e) => setFormData({ ...formData, cidadeUf: e.target.value })}
                  placeholder="Ex: São Paulo / SP"
                  className="w-full bg-tech-fundo border border-tech-borda rounded-lg px-3 py-2 text-xs text-white focus:border-tech-destaque focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-mono font-bold text-slate-300 uppercase mb-1">
                  Segmento de Atuação
                </label>
                <select
                  value={formData.segmento}
                  onChange={(e) => setFormData({ ...formData, segmento: e.target.value })}
                  className="w-full bg-tech-fundo border border-tech-borda rounded-lg px-3 py-2 text-xs text-white focus:border-tech-destaque focus:outline-none"
                >
                  <option value="Oficina Mecânica Multimarcas">Oficina Mecânica Multimarcas</option>
                  <option value="Autoelétrica e Eletrônica Embarcada">Autoelétrica e Eletrônica Embarcada</option>
                  <option value="Especializada em Veículos Elétricos e Híbridos">Especializada em Veículos Elétricos e Híbridos</option>
                  <option value="Funilaria e Pintura Express">Funilaria e Pintura Express</option>
                  <option value="Gestão de Frota / Locadora de Veículos">Gestão de Frota / Locadora de Veículos</option>
                  <option value="Distribuidora de Peças Automotivas">Distribuidora de Peças Automotivas</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-mono font-bold text-slate-300 uppercase mb-1">
                  Mensagem Adicional (Opcional)
                </label>
                <textarea
                  rows={3}
                  value={formData.mensagem}
                  onChange={(e) => setFormData({ ...formData, mensagem: e.target.value })}
                  placeholder="Conte um pouco sobre a estrutura da sua oficina, volume mensal de veículos atendidos ou objetivos com a parceria..."
                  className="w-full bg-tech-fundo border border-tech-borda rounded-lg px-3 py-2 text-xs text-white focus:border-tech-destaque focus:outline-none resize-none"
                />
              </div>
            </div>

            <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-tech-borda">
              <div className="text-[11px] text-slate-400 font-mono">
                Email direto: <strong className="text-tech-destaque">natanaelmessiasdesouza@gmail.com</strong>
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs py-3 px-8 rounded-xl transition cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.3)] flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Enviar Solicitação de Parceria</span>
              </button>
            </div>
          </form>
        )}
      </div>

    </div>
  );
}
