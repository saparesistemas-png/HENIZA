import React, { useState } from 'react';
import { 
  Glasses, Award, FileText, ChevronLeft, ChevronRight, 
  Sparkles, Check, Play, Shield, Eye, Cpu, Radio, 
  BookOpen, ChevronDown, ChevronUp, Layers, Zap, Wrench, 
  Activity, ShieldAlert, CheckCircle2, RefreshCcw
} from 'lucide-react';
import HenizaBrand, { HenizaEmblem, HenizaCircularBadge, HenizaWordmark } from './HenizaBrand';

interface GlassIAProps {
  lang: 'pt' | 'en' | 'es';
  setSuccessToast: (msg: string | null) => void;
}

const DECK_SLIDES = [
  {
    title: 'Plataforma TrindIA™',
    subtitle: 'HENIZA TECH (Holding HENIZA)',
    content: 'Cada sistema funciona de forma individual e independente. Mas, ao adquirir os três pilares, o usuário destrava a orquestração integrada TrindIA™.',
    tag: 'Visão Geral',
    bulletPoints: [
      '• Sistemas Autônomos: OficIA, OricIA e PredicIA operam e faturam separadamente',
      '• Base Central Inteligente: OricIA (RAG de Conhecimento) + PredicIA (Probabilidade & Vida)',
      '• Hardware Proprietário: GlassIA™ estende todos os sistemas para o campo visual sem usar as mãos'
    ],
    color: 'from-sapare-teal to-blue-900'
  },
  {
    title: 'O Problema de Mercado',
    subtitle: 'Assimetria & Ineficiência Técnica',
    content: 'O setor mecânico sofre com três dores crônicas profundas que drenam bilhões anualmente:',
    tag: 'Dores de Mercado',
    bulletPoints: [
      '• Assimetria de Informação: Mecânicos demoram horas pesquisando torques e esquemas elétricos dispersos',
      '• Falha Preventiva: Proprietários esquecem manutenções críticas, gerando quebras graves',
      '• Ausência de Conexão: O veículo opera isolado do calendário pessoal e financeiro do dono'
    ],
    color: 'from-red-900 to-sapare-dark'
  },
  {
    title: 'A Solução: TrindIA',
    subtitle: 'O Ecossistema Unificado',
    content: 'A HENIZA TECH, empresa filha da holding HENIZA, unifica dados de oficina, conhecimento técnico e a rotina do usuário em uma única plataforma:',
    tag: 'Proposta de Valor',
    bulletPoints: [
      '• OficIA: Gerenciamento inteligente e diagnósticos rápidos para oficinas',
      '• OricIA: O Oráculo centralizado de rede (manuais, fóruns e esquemas elétricos via RAG)',
      '• PredicIA: IA preditiva que associa score mecânico à agenda de vida do proprietário'
    ],
    color: 'from-sapare-teal to-sapare-dark'
  },
  {
    title: 'OficIA: Gestão Avançada',
    subtitle: 'Oficinas na Era da Inteligência Artificial',
    content: 'Plataforma operacional web e mobile que elimina intermediários e automatiza as ordens de serviço:',
    tag: 'Produto 01 - Ativo',
    bulletPoints: [
      '• Checklist diário obrigatório de EPIs e equipamentos calibrados',
      '• Emissão de Laudos Técnicos formatados para impressão em 1 clique',
      '• Sincronismo automático em cache local para funcionamento 100% offline'
    ],
    color: 'from-blue-900 to-sapare-dark'
  },
  {
    title: 'OricIA: O Oráculo RAG',
    subtitle: 'O Conhecimento de Toda a Rede Disponível',
    content: 'Mecanismo RAG (Retrieval-Augmented Generation) com latência de resposta inferior a 8 segundos:',
    tag: 'Base Inteligente 01 - Ativo',
    bulletPoints: [
      '• Base unificada de especificações de torque de biela, cabeçote e virabrequim',
      '• Transcrições de vídeo e fóruns mecânicos integrados por IA',
      '• Chatbot terminal altamente técnico para apoio em diagnósticos complexos'
    ],
    color: 'from-sapare-gold/80 to-sapare-dark'
  },
  {
    title: 'PredicIA: Score & Vida',
    subtitle: 'Orquestração Pessoal + Veicular',
    content: 'A primeira inteligência a cruzar a saúde física do carro com os compromissos diários do proprietário:',
    tag: 'Base Inteligente 02 - Ativo',
    bulletPoints: [
      '• Score de Saúde em tempo real (Catalisador, Freios, Ignição, Radiador)',
      '• Agenda de Vida: Sugere e agenda revisões preventivas nos horários livres do usuário',
      '• Finanças Integradas: Fluxo de caixa de manutenção integrado via Open Finance'
    ],
    color: 'from-sapare-violet to-sapare-dark'
  },
  {
    title: 'EletricIA™ & OpicIA™',
    subtitle: 'Roadmap de Próximas Verticais',
    content: 'A mesma base inteligente estendida para novas indústrias e profissionais utilizando o mesmo hardware:',
    tag: 'Futuro Modular',
    bulletPoints: [
      '• EletricIA™: O assistente inteligente de realidade aumentada para eletricistas prediais ou de rede',
      '• OpicIA™: O co-piloto e assistente de segurança para operários de chão de fábrica industrial',
      '• Plug-and-Play: Ambos consumirão a inteligência OricIA e as previsões da PredicIA'
    ],
    color: 'from-amber-900 to-sapare-dark'
  },
  {
    title: 'GlassIA™: Smart Glass PPE',
    subtitle: 'Hardware Estendido Universal',
    content: 'Óculos de AR industrial ultraleves (EPI homologado) que trazem dados diretamente ao campo de visão:',
    tag: 'Hardware Proprietário',
    bulletPoints: [
      '• Projeção HUD de esquemas elétricos, diagramas unifilares e torques em tempo real',
      '• Latência Bluetooth Low Energy inferior a 15ms com isolamento acústico industrial',
      '• Compatibilidade total: Suporta OficIA (Mecânico), EletricIA (Eletricista) e OpicIA (Operário)'
    ],
    color: 'from-cyan-900 to-sapare-dark'
  },
  {
    title: 'Tamanho do Mercado (TAM)',
    subtitle: 'Mercado Endereçável Gigantesco',
    content: 'Análise de oportunidade financeira no Brasil e América Latina:',
    tag: 'Oportunidade',
    bulletPoints: [
      '• TAM (Mercado Total): R$ 180 Bilhões (Setor de autopeças e serviços mecânicos no Brasil)',
      '• SAM (Mercado Disponível): R$ 6 Bilhões (Oficinas e frotas de médio e grande porte acessíveis)',
      '• SOM (Mercado Focado): R$ 12 Milhões (Meta de receita anual recorrente até o Ano 3)'
    ],
    color: 'from-sapare-teal to-blue-950'
  },
  {
    title: 'Go-To-Market & Expansão',
    subtitle: 'Foco Inicial Estratégico',
    content: 'Nossa estratégia de entrada e posicionamento tático regionalizado:',
    tag: 'Estratégia comercial',
    bulletPoints: [
      '• Fase 1 (Homologação): Polo piloto em Caraguatatuba - SP e região do Litoral Norte',
      '• Fase 2 (Escala): Expansão via rede integrada para o Vale do Paraíba e Grande São Paulo',
      '• Fase 3 (Nacional): Parcerias com grandes distribuidores de autopeças e montadoras'
    ],
    color: 'from-sapare-gold/60 to-sapare-dark'
  },
  {
    title: 'Arquitetura de Tecnologia',
    subtitle: 'Pilha Robusta & Offline-Ready',
    content: 'Arquitetura técnica projetada para escalabilidade extrema e latência zero:',
    tag: 'Arquitetura de Software',
    bulletPoints: [
      '• Backend: FastAPI / Python unificado que substitui orquestradores de terceiros',
      '• Frontend: React + Tailwind CSS com persistência local em IndexedDB / Cache',
      '• Conectores Nativos: Gateway de WhatsApp, Teams e SharePoint integrados na raiz'
    ],
    color: 'from-slate-900 to-sapare-dark'
  },
  {
    title: 'Modelo de Negócios (SaaS)',
    subtitle: 'Canais de Receita Recorrente',
    content: 'Como a HENIZA TECH monetiza o ecossistema TrindIA:',
    tag: 'Monetização',
    bulletPoints: [
      '• Assinatura SaaS individual para cada aplicativo (OficIA, EletricIA, OpicIA)',
      '• Venda/Locação do Hardware GlassIA™ (Hardware as a Service)',
      '• Taxa de transação no marketplace de autopeças, componentes elétricos e insumos'
    ],
    color: 'from-blue-900 to-sapare-dark'
  },
  {
    title: 'Captação de Recursos (Seed)',
    subtitle: 'Rodada de Investimento Anjo/Seed',
    content: 'Buscamos parceiros estratégicos para acelerar a entrega da visão TrindIA:',
    tag: 'Financiamento',
    bulletPoints: [
      '• Alvo: R$ 500.000,00 por 10% de Equity na HENIZA TECH (Holding HENIZA)',
      '• Uso dos Recursos: 60% Desenvolvimento de Produto, 20% Marketing, 20% Hardware GlassIA™',
      '• Breakeven estimado no mês 18 após rodada'
    ],
    color: 'from-sapare-violet to-blue-950'
  },
  {
    title: 'Visão de Futuro',
    subtitle: 'HENIZA TECH',
    content: 'Apoiamos o técnico de campo e empoderamos a cadeia de serviços industriais de precisão.',
    tag: 'Contato & Fechamento',
    bulletPoints: [
      '• Fundador: Natanael Messias de Souza',
      '• E-mail Estratégico: natanaelmessiasdesouza@gmail.com',
      '• TrindIA: Conectando máquinas, mentes e metodologias'
    ],
    color: 'from-sapare-teal via-sapare-gold to-sapare-violet'
  }
];

const STRATEGIC_CHAPTERS = [
  {
    title: 'Capítulo 01: O Desafio Estratégico da Reparação & Operação de Campo',
    content: 'O mercado de pós-venda automotivo e serviços industriais de campo no Brasil opera com altos índices de desperdício técnico e de tempo. Profissionais de manutenção perdem até 30% do seu dia útil buscando especificações de torque, esquemas unifilares ou diagramas em apostilas PDFs lentas. Essa dor de assimetria de informação resulta em manutenções imperfeitas e riscos à integridade física do técnico.'
  },
  {
    title: 'Capítulo 02: A Trilogia TrindIA & Portfólio Modular de Verticais',
    content: 'Para quebrar essa ineficiência, a HENIZA TECH (empresa de tecnologia da holding HENIZA) introduz a Plataforma TrindIA, composta por sistemas individuais integráveis. OricIA (RAG técnico de conhecimento) e PredicIA (análise probabilística) constituem a base estrutural. Sobre essa base, conectam-se as soluções de campo de cada especialidade: o OficIA (para oficinas mecânicas), o futuro EletricIA (para eletricistas prediais e de rede) e o futuro OpicIA (para operários industriais).'
  },
  {
    title: 'Capítulo 03: Hardware Estendido GlassIA™ como EPI Inteligente',
    content: 'Diferente de sistemas legados que exigem que o mecânico ou eletricista limpe as mãos para interagir com telas, o GlassIA™ projeta as especificações técnicas diretamente na lente ótica HUD do operador. Sendo um EPI oficial homologado, ele garante segurança ao trabalhador e traz as informações necessárias (como perigos de voltagem, ordens de aperto ou alertas de sensores) em tempo real.'
  }
];

export default function GlassIA({ lang, setSuccessToast }: GlassIAProps) {
  const [slideIndex, setSlideIndex] = useState(0);
  const [hudTargetActive, setHudTargetActive] = useState(true);
  const [expandedChapter, setExpandedChapter] = useState<number | null>(null);
  
  // HUD mode selector: 'oficia' (Mecânico), 'eletricia' (Eletricista), 'opicia' (Industrial)
  const [hudMode, setHudMode] = useState<'oficia' | 'eletricia' | 'opicia'>('oficia');

  const nextSlide = () => {
    setSlideIndex(prev => (prev + 1) % DECK_SLIDES.length);
  };

  const prevSlide = () => {
    setSlideIndex(prev => (prev - 1 + DECK_SLIDES.length) % DECK_SLIDES.length);
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fadeIn max-w-5xl mx-auto px-1 sm:px-0">
      
      {/* Title block */}
      <div className="bg-tech-cartao border border-tech-borda rounded-2xl p-4 sm:p-6 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-tech-destaque/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="shrink-0">
              <HenizaEmblem size={44} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black tracking-widest text-tech-destaque uppercase bg-tech-destaque/10 px-2 py-0.5 rounded border border-tech-destaque/30 font-mono">
                  HENIZA TECH • HOLDING HENIZA
                </span>
                <span className="text-[9px] text-tech-secundario font-mono">ROADMAP DE HARDWARE</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-tech-texto font-display flex items-center gap-2 mt-1">
                GlassIA™ Hub & Deck
              </h2>
            </div>
          </div>
          <p className="text-xs text-tech-secundario max-w-md md:text-right font-mono">
            Central de apresentações institucionais da HENIZA TECH, especificações de EPIs de Realidade Aumentada e expansão da Plataforma TrindIA™.
          </p>
        </div>
      </div>

      {/* Concept Architecture Map Banner */}
      <div className="bg-tech-cartao border border-tech-borda rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-sapare-teal/5 rounded-full blur-2xl pointer-events-none" />
        <h3 className="text-xs font-black text-tech-texto uppercase tracking-wider mb-4 flex items-center gap-1.5 border-b border-tech-borda pb-2">
          <Layers className="w-4 h-4 text-sapare-teal" />
          Mapeamento da Arquitetura Modular TrindIA™
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 text-center">
          
          {/* Base 1 */}
          <div className="bg-sapare-dark/40 border border-tech-borda rounded-xl p-4 space-y-1 relative">
            <span className="absolute top-2 right-2 text-[8px] bg-sapare-gold/15 text-sapare-gold border border-sapare-gold/25 px-1 rounded font-bold">BASE CRÍTICA</span>
            <div className="w-8 h-8 rounded-lg bg-sapare-gold/15 text-sapare-gold flex items-center justify-center mx-auto mb-2">
              <BookOpen className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-black text-tech-texto">OricIA™ Engine</h4>
            <p className="text-[10px] text-tech-secundario">Oráculo técnico e RAG de dados unificados de rede.</p>
          </div>

          {/* Base 2 */}
          <div className="bg-sapare-dark/40 border border-tech-borda rounded-xl p-4 space-y-1 relative">
            <span className="absolute top-2 right-2 text-[8px] bg-sapare-violet/15 text-sapare-violet2 border border-sapare-violet/25 px-1 rounded font-bold">BASE CRÍTICA</span>
            <div className="w-8 h-8 rounded-lg bg-sapare-violet/15 text-sapare-violet2 flex items-center justify-center mx-auto mb-2">
              <Activity className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-black text-tech-texto">PredicIA™ Engine</h4>
            <p className="text-[10px] text-tech-secundario">Análise de probabilidades e orquestração de vida do usuário.</p>
          </div>

          {/* Active Specialized Module */}
          <div className="bg-sapare-dark/80 border-2 border-sapare-teal/50 rounded-xl p-4 space-y-1 relative shadow-lg shadow-sapare-teal/5">
            <span className="absolute top-2 right-2 text-[8px] bg-sapare-teal/20 text-sapare-teal border border-sapare-teal/45 px-1 rounded font-black">MÓDULO ATIVO</span>
            <div className="w-8 h-8 rounded-lg bg-sapare-teal/20 text-sapare-teal flex items-center justify-center mx-auto mb-2 animate-pulse">
              <Wrench className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-black text-sapare-teal">OficIA™ App</h4>
            <p className="text-[10px] text-tech-texto/90">Especializado em oficinas mecânicas e manutenção automotiva.</p>
          </div>

          {/* Future Modules */}
          <div className="bg-sapare-dark/30 border border-tech-borda/40 rounded-xl p-4 space-y-1.5 relative opacity-85">
            <span className="absolute top-2 right-2 text-[8px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-1 rounded font-bold uppercase tracking-wider">ROADMAP</span>
            <div className="flex gap-1 justify-center mb-1">
              <span className="text-[9px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/20 font-bold">EletricIA™</span>
              <span className="text-[9px] bg-orange-500/10 text-orange-400 px-1.5 py-0.5 rounded border border-orange-500/20 font-bold">OpicIA™</span>
            </div>
            <h4 className="text-xs font-black text-tech-texto/70">Novas Verticais</h4>
            <p className="text-[10px] text-tech-secundario">Módulos especializados para eletricistas e operários de fábricas.</p>
          </div>

        </div>

        <div className="mt-3 text-[10px] text-center text-tech-secundario font-mono">
          🔗 Todos os módulos individuais utilizam nativamente o hardware de proteção <strong className="text-sapare-glass font-bold">GlassIA™</strong> para exibição em Realidade Aumentada.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Interactive Slides Presenter */}
        <div className="bg-tech-cartao border border-tech-borda rounded-2xl p-5 shadow-lg flex flex-col justify-between min-h-[550px]">
          
          <div className="border-b border-tech-borda pb-3 mb-4 flex justify-between items-center text-xs">
            <span className="font-black text-tech-texto uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-4 h-4 text-sapare-glass" />
              Pitch Deck do Investidor ({DECK_SLIDES.length} Slides)
            </span>
            <span className="font-mono text-sapare-glass font-bold">{slideIndex + 1} / {DECK_SLIDES.length}</span>
          </div>

          {/* Slide canvas */}
          <div className={`flex-1 bg-gradient-to-br ${DECK_SLIDES[slideIndex].color} rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden transition-all duration-300 border border-white/5`}>
            
            {/* Background grid overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />
            
            <div className="flex justify-between items-start relative z-10">
              <span className="text-[9px] font-black bg-white/10 text-white px-2.5 py-1 rounded-full uppercase tracking-wider font-mono">
                {DECK_SLIDES[slideIndex].tag}
              </span>
              <span className="text-[9px] text-white/50 font-bold uppercase tracking-widest">TRINDIA PITCH</span>
            </div>

            <div className="my-6 space-y-3 relative z-10">
              <span className="text-[10px] text-sapare-glass font-mono font-bold uppercase tracking-wider block">
                {DECK_SLIDES[slideIndex].subtitle}
              </span>
              <h3 className="text-2xl font-black text-white font-display tracking-tight leading-none">
                {DECK_SLIDES[slideIndex].title}
              </h3>
              <p className="text-xs text-white/80 leading-relaxed max-w-lg mt-2">
                {DECK_SLIDES[slideIndex].content}
              </p>

              <div className="pt-3 space-y-1.5 text-xs text-white/95 font-mono">
                {DECK_SLIDES[slideIndex].bulletPoints.map((bp, i) => (
                  <div key={i} className="pl-1">
                    {bp}
                  </div>
                ))}
              </div>
            </div>

            <div className="text-[9px] text-white/40 font-semibold relative z-10">
              HENIZA TECH • Holding HENIZA • CONFIDENCIAL • natanaelmessiasdesouza@gmail.com
            </div>

          </div>

          {/* Controller buttons */}
          <div className="flex justify-between items-center mt-4 pt-3 border-t border-tech-borda">
            <button 
              onClick={prevSlide}
              className="bg-sapare-dark hover:bg-tech-borda text-tech-texto border border-tech-borda p-2.5 rounded-xl transition flex items-center gap-1 cursor-pointer font-bold text-xs"
            >
              <ChevronLeft className="w-4 h-4" /> Anterior
            </button>

            {/* Slide dots */}
            <div className="flex gap-1 overflow-x-auto max-w-[150px] sm:max-w-[250px] py-1">
              {DECK_SLIDES.map((_, idx) => (
                <div 
                  key={idx} 
                  onClick={() => setSlideIndex(idx)}
                  className={`w-1.5 h-1.5 rounded-full cursor-pointer transition-all flex-shrink-0 ${slideIndex === idx ? 'bg-sapare-glass w-4' : 'bg-tech-secundario/30'}`}
                />
              ))}
            </div>

            <button 
              onClick={nextSlide}
              className="bg-sapare-glass text-sapare-dark hover:scale-102 font-black py-2 px-4 rounded-xl transition flex items-center gap-1 cursor-pointer text-xs"
            >
              Próximo <ChevronRight className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Right Column: GlassIA AR HUD Simulator */}
        <div className="bg-tech-cartao border border-tech-borda rounded-2xl p-5 shadow-lg space-y-4 flex flex-col justify-between">
          
          <div>
            <div className="flex justify-between items-center border-b border-tech-borda pb-2">
              <h3 className="text-xs font-black text-tech-texto uppercase tracking-wider flex items-center gap-1.5">
                <Glasses className="w-4 h-4 text-sapare-glass" />
                GlassIA™ AR HUD Simulator (Selecione a Profissão)
              </h3>
              <span className="text-[10px] bg-sapare-glass/15 text-sapare-glass border border-sapare-glass/30 px-2 py-0.5 rounded font-black tracking-wider uppercase">
                Estilo HUD
              </span>
            </div>
            
            {/* HUD Profile Selector */}
            <div className="flex gap-2 mt-3">
              <button 
                onClick={() => {
                  setHudMode('oficia');
                  setSuccessToast("Simulador GlassIA: Modo OficIA (Mecânico) ativado.");
                }}
                className={`flex-1 text-[10px] py-1.5 rounded-lg border transition font-bold uppercase tracking-wider ${
                  hudMode === 'oficia' 
                    ? 'bg-sapare-teal/25 border-sapare-teal text-sapare-teal' 
                    : 'bg-sapare-dark border-tech-borda text-tech-secundario hover:border-tech-borda/80'
                }`}
              >
                🛠️ OficIA (Mecânico)
              </button>
              <button 
                onClick={() => {
                  setHudMode('eletricia');
                  setSuccessToast("Simulador GlassIA: Modo EletricIA (Eletricista) ativado.");
                }}
                className={`flex-1 text-[10px] py-1.5 rounded-lg border transition font-bold uppercase tracking-wider ${
                  hudMode === 'eletricia' 
                    ? 'bg-amber-500/25 border-amber-500 text-amber-400' 
                    : 'bg-sapare-dark border-tech-borda text-tech-secundario hover:border-tech-borda/80'
                }`}
              >
                ⚡ EletricIA (Futuro)
              </button>
              <button 
                onClick={() => {
                  setHudMode('opicia');
                  setSuccessToast("Simulador GlassIA: Modo OpicIA (Operário) ativado.");
                }}
                className={`flex-1 text-[10px] py-1.5 rounded-lg border transition font-bold uppercase tracking-wider ${
                  hudMode === 'opicia' 
                    ? 'bg-orange-500/25 border-orange-500 text-orange-400' 
                    : 'bg-sapare-dark border-tech-borda text-tech-secundario hover:border-tech-borda/80'
                }`}
              >
                ⚙️ OpicIA (Futuro)
              </button>
            </div>
          </div>

          {/* HUD Simulator Screen */}
          <div className="bg-sapare-dark aspect-video rounded-2xl border border-sapare-glass/30 relative overflow-hidden flex flex-col justify-between p-4 text-xs font-mono">
            
            {/* Scanline and glowing overlays */}
            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,212,255,0.06)_50%,rgba(0,0,0,0)_50%)] bg-[size:100%_4px] pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-t from-sapare-glass/5 via-transparent to-transparent pointer-events-none" />

            {/* Top info bar */}
            <div className="flex justify-between text-[10px] text-sapare-glass/80 relative z-10">
              <div className="flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5 animate-spin" />
                <span>GLASSIA OS v2.0 - HUD EMULATOR</span>
              </div>
              <div className="flex items-center gap-3">
                <span>BT LATENCY: 11ms</span>
                <span>BAT: 94%</span>
              </div>
            </div>

            {/* Target crosshair in center */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className={`w-12 h-12 rounded-full border-2 border-dashed border-sapare-glass/50 flex items-center justify-center ${hudTargetActive ? 'animate-spin' : ''}`}>
                <div className="w-2 h-2 rounded-full bg-sapare-glass" />
              </div>
              
              {/* Profile Specific Overlays */}
              {hudMode === 'oficia' && (
                <>
                  {/* Box framing engine component */}
                  <div className="absolute top-[28%] left-[24%] border-2 border-red-500 w-24 h-20 rounded p-1 flex flex-col justify-between">
                    <span className="text-[8px] text-red-500 font-bold bg-sapare-dark/80 px-1 rounded absolute -top-3">CATALISADOR</span>
                    <span className="text-[7px] text-white/90">DTC P0420</span>
                    <span className="text-[8px] text-red-400 font-black">73% SAÚDE</span>
                  </div>
                  
                  <div className="absolute top-[40%] right-[20%] border border-sapare-teal w-28 h-12 rounded p-1">
                    <span className="text-[8px] text-sapare-teal font-bold bg-sapare-dark/80 px-1 rounded absolute -top-3">ALTERNADOR</span>
                    <span className="text-[8px] text-sapare-teal/95 font-bold">14.1 V (OK)</span>
                  </div>
                </>
              )}

              {hudMode === 'eletricia' && (
                <>
                  {/* Box framing electric panel component */}
                  <div className="absolute top-[25%] left-[20%] border-2 border-amber-500 w-32 h-24 rounded p-1 flex flex-col justify-between">
                    <span className="text-[8px] text-amber-500 font-bold bg-sapare-dark/80 px-1 rounded absolute -top-3">QD-03 GERAL</span>
                    <span className="text-[7px] text-white/90">MONITORAMENTO FASES</span>
                    <div className="text-[8px] text-amber-400 font-black space-y-0.5">
                      <div>R: 220V (OK)</div>
                      <div>S: 218V (OK)</div>
                      <div>T: 198V (ALERTA)</div>
                    </div>
                  </div>
                  
                  <div className="absolute top-[45%] right-[15%] border border-red-500 w-36 h-12 rounded p-1 bg-red-950/20">
                    <span className="text-[8px] text-red-500 font-bold bg-sapare-dark/80 px-1 rounded absolute -top-3">ALERTA SEGURANÇA</span>
                    <span className="text-[8px] text-red-400 font-bold animate-pulse">RISCO ARCO VOLTAICO - USE EPI</span>
                  </div>
                </>
              )}

              {hudMode === 'opicia' && (
                <>
                  {/* Box framing CNC / mechanical component */}
                  <div className="absolute top-[30%] left-[25%] border-2 border-orange-500 w-28 h-20 rounded p-1 flex flex-col justify-between">
                    <span className="text-[8px] text-orange-500 font-bold bg-sapare-dark/80 px-1 rounded absolute -top-3">MOTOR CNC #02</span>
                    <span className="text-[7px] text-white/90">ROTAÇÃO ATIVA</span>
                    <span className="text-[8px] text-orange-400 font-black">1.450 RPM</span>
                  </div>
                  
                  <div className="absolute top-[45%] right-[18%] border border-sapare-teal w-32 h-14 rounded p-1">
                    <span className="text-[8px] text-sapare-teal font-bold bg-sapare-dark/80 px-1 rounded absolute -top-3">SENSORES LINHA</span>
                    <div className="text-[8px] text-sapare-teal/95 font-bold space-y-0.5">
                      <div>PNEUMÁTICA: 6.2 BAR</div>
                      <div>VIBRAÇÃO: NORMAL</div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Bottom voice instructions bar */}
            <div className="flex justify-between items-end text-[9px] relative z-10">
              <div className="bg-sapare-glass/10 border border-sapare-glass/40 text-sapare-glass p-2 rounded-xl">
                <div>FALAR COMANDO DE VOZ:</div>
                <div className="font-bold text-white uppercase">
                  {hudMode === 'oficia' && '“ORÁCULO, TORQUE CABEÇOTE EA111”'}
                  {hudMode === 'eletricia' && '“ORÁCULO, MAPA MONOFÁSICO QD-03”'}
                  {hudMode === 'opicia' && '“ORÁCULO, PRESSÃO LIMITE DE VÁLVULA”'}
                </div>
              </div>
              
              <div className="text-right text-sapare-glass/60">
                <div>FPS: 60Hz</div>
                <div>ANSI Z87.1 SAFE</div>
              </div>
            </div>

          </div>

          {/* Quick interactive controls */}
          <div className="flex justify-between items-center pt-2">
            <button
              onClick={() => {
                setHudTargetActive(!hudTargetActive);
                setSuccessToast("Sinalizador de mira do HUD recalibrado.");
              }}
              className="text-[10px] bg-tech-fundo hover:bg-tech-borda border border-tech-borda text-tech-texto py-1 px-3 rounded-lg transition font-semibold cursor-pointer"
            >
              {hudTargetActive ? 'Desativar Giro de Mira' : 'Ativar Giro de Mira'}
            </button>
            
            <div className="flex items-center gap-1.5 text-[10px] text-tech-secundario">
              <Radio className="w-3 h-3 text-sapare-glass animate-pulse" />
              <span>Conexão BLE: <strong className="text-sapare-glass">Conectado (&lt;15ms)</strong></span>
            </div>
          </div>

        </div>

      </div>

      {/* Chapter Strategic Document */}
      <div className="bg-tech-cartao border border-tech-borda rounded-2xl p-5 shadow-lg space-y-4">
        <h3 className="text-xs font-black text-tech-texto uppercase tracking-wider flex items-center gap-1.5 border-b border-tech-borda pb-2">
          <BookOpen className="w-4 h-4 text-sapare-glass" />
          Documento Estratégico: Visão TrindIA (HENIZA TECH)
        </h3>

        <div className="space-y-3">
          {STRATEGIC_CHAPTERS.map((chap, i) => {
            const isExpanded = expandedChapter === i;
            return (
              <div key={i} className="bg-sapare-dark/45 border border-tech-borda rounded-xl p-4">
                <div 
                  onClick={() => setExpandedChapter(isExpanded ? null : i)}
                  className="flex justify-between items-center cursor-pointer"
                >
                  <h4 className="text-xs font-black text-tech-texto">{chap.title}</h4>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-tech-secundario" /> : <ChevronDown className="w-4 h-4 text-tech-secundario" />}
                </div>

                {isExpanded && (
                  <p className="text-xs text-tech-texto/80 mt-3 leading-relaxed border-t border-tech-borda/40 pt-3">
                    {chap.content}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
