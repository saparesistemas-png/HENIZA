import React, { useState } from 'react';
import { 
  X, 
  Smartphone, 
  QrCode, 
  Copy, 
  Check, 
  ExternalLink, 
  Download, 
  Share2, 
  PlusSquare, 
  MoreVertical, 
  Wifi, 
  ShieldCheck, 
  Sparkles 
} from 'lucide-react';

interface InstallMobileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InstallMobileModal({ isOpen, onClose }: InstallMobileModalProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'android' | 'ios' | 'qr'>('android');

  if (!isOpen) return null;

  // Real production shared URL for OficIA
  const productionUrl = typeof window !== 'undefined' 
    ? (window.location.origin.includes('ais-dev') 
        ? window.location.origin.replace('ais-dev', 'ais-pre') 
        : window.location.origin)
    : 'https://ais-pre-oudaxghhekywrpfurtj32p-750074142373.us-east1.run.app';

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=10&color=030712&bgcolor=00FF66&data=${encodeURIComponent(productionUrl)}`;

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(productionUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div 
        className="bg-tech-cartao border-2 border-tech-destaque/50 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden relative animate-scaleUp max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow Superior */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-tech-destaque via-cyan-400 to-tech-destaque" />

        {/* Cabeçalho */}
        <div className="p-5 border-b border-tech-borda flex items-start justify-between bg-tech-fundo/90">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-tech-destaque/15 border border-tech-destaque/40 flex items-center justify-center text-tech-destaque shadow-[0_0_15px_rgba(0,255,102,0.3)] shrink-0">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white font-display">
                  Como Instalar o OficIA no Smartphone
                </h3>
                <span className="text-[10px] font-mono font-bold bg-tech-destaque/20 text-tech-destaque border border-tech-destaque/40 px-2 py-0.5 rounded uppercase">
                  PWA Nativo
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Acesse como aplicativo direto na tela inicial sem precisar de lojas de apps.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Abas de Navegação */}
        <div className="flex border-b border-tech-borda bg-tech-fundo/70 shrink-0">
          <button
            onClick={() => setActiveTab('android')}
            className={`flex-1 py-2.5 text-xs font-mono font-bold tracking-wider uppercase transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'android'
                ? 'text-tech-destaque border-b-2 border-tech-destaque bg-tech-destaque/10'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Android (Chrome)</span>
          </button>

          <button
            onClick={() => setActiveTab('ios')}
            className={`flex-1 py-2.5 text-xs font-mono font-bold tracking-wider uppercase transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'ios'
                ? 'text-cyan-400 border-b-2 border-cyan-400 bg-cyan-400/10'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>iPhone / iOS (Safari)</span>
          </button>

          <button
            onClick={() => setActiveTab('qr')}
            className={`flex-1 py-2.5 text-xs font-mono font-bold tracking-wider uppercase transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'qr'
                ? 'text-amber-400 border-b-2 border-amber-400 bg-amber-400/10'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>QR Code</span>
          </button>
        </div>

        {/* Conteúdo das Abas */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5">
          
          {/* Caixa de Compartilhamento de Link */}
          <div className="bg-tech-fundo border border-tech-borda rounded-xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="w-full sm:w-auto overflow-hidden">
              <span className="text-[10px] font-mono uppercase text-slate-400 block mb-0.5">
                Link do Sistema para os Mecânicos:
              </span>
              <p className="text-xs font-mono font-bold text-tech-destaque truncate max-w-md">
                {productionUrl}
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
              <button
                onClick={handleCopyLink}
                className="px-3 py-1.5 bg-tech-cartao hover:bg-slate-800 text-slate-200 hover:text-white border border-tech-borda rounded-lg text-xs font-mono font-semibold transition flex items-center gap-1.5 cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-tech-destaque" />
                    <span className="text-tech-destaque">Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Link</span>
                  </>
                )}
              </button>

              <a
                href={productionUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-tech-destaque/15 hover:bg-tech-destaque text-tech-destaque hover:text-tech-fundo border border-tech-destaque/40 rounded-lg text-xs font-mono font-semibold transition flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Abrir</span>
              </a>
            </div>
          </div>

          {/* TAB 1: ANDROID */}
          {activeTab === 'android' && (
            <div className="space-y-4 animate-fadeIn">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-tech-destaque text-tech-fundo flex items-center justify-center text-xs font-black">
                  1
                </span>
                Passo a Passo no Android (Google Chrome)
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-tech-fundo/70 border border-tech-borda rounded-xl p-3.5 space-y-2">
                  <div className="text-tech-destaque font-mono text-xs font-bold flex items-center gap-1.5">
                    <ExternalLink className="w-4 h-4" /> Passo 1: Abrir
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Abra o navegador <strong>Google Chrome</strong> no celular e acesse o link enviado ou aponte a câmera para o <strong>QR Code</strong>.
                  </p>
                </div>

                <div className="bg-tech-fundo/70 border border-tech-borda rounded-xl p-3.5 space-y-2">
                  <div className="text-tech-destaque font-mono text-xs font-bold flex items-center gap-1.5">
                    <MoreVertical className="w-4 h-4" /> Passo 2: Menu
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Toque no botão de <strong>3 pontinhos (⋮)</strong> no canto superior direito da tela do Chrome.
                  </p>
                </div>

                <div className="bg-tech-fundo/70 border border-tech-destaque/40 rounded-xl p-3.5 space-y-2 bg-gradient-to-b from-tech-destaque/10 to-transparent">
                  <div className="text-tech-destaque font-mono text-xs font-bold flex items-center gap-1.5">
                    <Download className="w-4 h-4" /> Passo 3: Instalar
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Selecione <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong> e confirme.
                  </p>
                </div>
              </div>

              <div className="bg-tech-cartao border border-tech-borda rounded-xl p-4 text-xs text-slate-300 space-y-2">
                <div className="text-tech-destaque font-mono font-bold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" /> Resultado no Celular:
                </div>
                <p>
                  O ícone oficial do <strong>OficIA</strong> ficará na área de trabalho do smartphone. Ao clicar nele, o sistema abre em <strong>tela cheia (sem barra de URL do navegador)</strong>, funcionando com desempenho ultra rápido como um app nativo.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: IOS (IPHONE) */}
          {activeTab === 'ios' && (
            <div className="space-y-4 animate-fadeIn">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-cyan-400 text-tech-fundo flex items-center justify-center text-xs font-black">
                  2
                </span>
                Passo a Passo no iPhone (Navegador Safari)
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-tech-fundo/70 border border-tech-borda rounded-xl p-3.5 space-y-2">
                  <div className="text-cyan-400 font-mono text-xs font-bold flex items-center gap-1.5">
                    <ExternalLink className="w-4 h-4" /> Passo 1: Safari
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Abra o link obrigatoriamente no navegador oficial da Apple (<strong>Safari</strong>).
                  </p>
                </div>

                <div className="bg-tech-fundo/70 border border-tech-borda rounded-xl p-3.5 space-y-2">
                  <div className="text-cyan-400 font-mono text-xs font-bold flex items-center gap-1.5">
                    <Share2 className="w-4 h-4" /> Passo 2: Compartilhar
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Toque no botão central de <strong>Compartilhar</strong> (ícone do quadrado com a seta para cima <strong>⬆️</strong> no rodapé).
                  </p>
                </div>

                <div className="bg-tech-fundo/70 border border-cyan-400/40 rounded-xl p-3.5 space-y-2 bg-gradient-to-b from-cyan-400/10 to-transparent">
                  <div className="text-cyan-400 font-mono text-xs font-bold flex items-center gap-1.5">
                    <PlusSquare className="w-4 h-4" /> Passo 3: Adicionar
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Role a lista para baixo e toque em <strong>"Adicionar à Tela de Início"</strong>. Depois toque em <strong>Adicionar</strong>.
                  </p>
                </div>
              </div>

              <div className="bg-tech-cartao border border-tech-borda rounded-xl p-4 text-xs text-slate-300 space-y-2">
                <div className="text-cyan-400 font-mono font-bold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" /> Experiência no iOS:
                </div>
                <p>
                  O ícone do OficIA aparecerá junto aos seus outros aplicativos. Ele aproveita a tela completa do iPhone com transições fluidas e acesso instantâneo.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: QR CODE */}
          {activeTab === 'qr' && (
            <div className="space-y-4 animate-fadeIn text-center">
              <h4 className="text-sm font-bold text-white">
                Aponte a Câmera do Smartphone para o QR Code
              </h4>
              <p className="text-xs text-slate-400 font-mono max-w-md mx-auto">
                Qualquer smartphone Android ou iPhone com leitor de QR Code na câmera abrirá o OficIA imediatamente.
              </p>

              <div className="inline-block p-4 bg-white rounded-2xl shadow-[0_0_30px_rgba(0,255,102,0.25)] border-4 border-tech-destaque">
                <img 
                  src={qrCodeUrl} 
                  alt="QR Code para instalar OficIA" 
                  className="w-52 h-52 mx-auto rounded-lg"
                  loading="eager"
                />
              </div>

              <div className="text-xs font-mono text-slate-300 flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-tech-destaque animate-ping" />
                <span>Escaneie e faça login com seu e-mail de administrador ou técnico.</span>
              </div>
            </div>
          )}

          {/* Destaques Técnicos do App no Smartphone */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-tech-borda text-[11px] font-mono text-slate-300">
            <div className="flex items-center gap-2 bg-tech-fundo/40 p-2.5 rounded-lg border border-tech-borda">
              <Wifi className="w-4 h-4 text-tech-destaque shrink-0" />
              <span>Funciona Online & Offline na oficina</span>
            </div>
            <div className="flex items-center gap-2 bg-tech-fundo/40 p-2.5 rounded-lg border border-tech-borda">
              <ShieldCheck className="w-4 h-4 text-tech-destaque shrink-0" />
              <span>Login seguro com autorização prévia</span>
            </div>
            <div className="flex items-center gap-2 bg-tech-fundo/40 p-2.5 rounded-lg border border-tech-borda">
              <Download className="w-4 h-4 text-tech-destaque shrink-0" />
              <span>Sem custo de download ou lojas de apps</span>
            </div>
          </div>

        </div>

        {/* Rodapé */}
        <div className="p-3.5 bg-tech-fundo/90 border-t border-tech-borda flex items-center justify-between text-xs font-mono text-slate-400">
          <span>HOLDING HENIZA • OficIA Mobile</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-tech-destaque text-tech-fundo font-black rounded-lg hover:bg-tech-destaque/90 transition cursor-pointer shadow-[0_0_10px_rgba(0,255,102,0.2)]"
          >
            Entendido
          </button>
        </div>

      </div>
    </div>
  );
}
