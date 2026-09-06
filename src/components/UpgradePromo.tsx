import React from 'react';
import { 
  Lock, ArrowRight, Sparkles, Check, 
  Layers, Database, Activity, ShieldAlert, Cpu, Wrench, Globe, BookOpen
} from 'lucide-react';

interface UpgradePromoProps {
  targetPlatform: 'oficia' | 'oricia' | 'predicia';
  currentLicence: 'oficia_only' | 'oricia_only' | 'predicia_only';
  lang: 'pt' | 'en' | 'es';
  onActivateThisIndividual: () => void;
  onActivateTrindia: () => void;
}

export default function UpgradePromo({ 
  targetPlatform, 
  currentLicence, 
  lang, 
  onActivateThisIndividual, 
  onActivateTrindia 
}: UpgradePromoProps) {

  // Texts in Portuguese, English, and Spanish
  const textContent = {
    pt: {
      oficia: {
        title: "OficIA™ — Gerenciador Inteligente de Oficinas",
        subtitle: "Gestão Operacional de Campo e Diagnósticos Técnicos",
        desc: "O aplicativo líder para oficinas mecânicas modernas. Funciona 100% offline, permitindo o controle de estoque de peças, emissão de laudos de diagnóstico certificados e listas de checagem diárias de segurança.",
        benefits: [
          "Checklist obrigatório de EPIs e calibração de ferramentas",
          "Emissão rápida de Laudos e Ordens de Serviço",
          "Calculadora inteligente de torque e mão de obra",
          "Banco de dados local sincronizado por cache inteligente"
        ],
        badge: "IDEAL PARA OFICINAS"
      },
      oricia: {
        title: "OricIA™ — O Oráculo de Conhecimento RAG",
        subtitle: "Base Técnica de Rede & Esquemas Elétricos",
        desc: "O oráculo inteligente desenvolvido para engenheiros, técnicos de elite e intelectuais de reparação. Utiliza RAG para pesquisar manuais complexos, diagramas de fiação elétrica e fóruns com resposta em menos de 8 segundos.",
        benefits: [
          "Chatbot altamente técnico integrado com manuais oficiais",
          "Acesso instantâneo a torques de biela e virabrequim",
          "Mecanismo RAG avançado de rede sem latência",
          "Ideal para consultas rápidas no terminal"
        ],
        badge: "IDEAL PARA INTELECTUAIS & ENGENHEIROS"
      },
      predicia: {
        title: "PredicIA™ — IA Preditiva e Rotina de Vida",
        subtitle: "Saúde Probabilística do Carro + Agenda Pessoal",
        desc: "O co-piloto definitivo do proprietário do veículo. Associa a pontuação de integridade das peças (catalisador, freios, fluidos) diretamente à sua agenda pessoal, sugerindo agendamentos preventivos inteligentes nos seus horários livres.",
        benefits: [
          "Cálculo de Score de Integridade mecânica em tempo real",
          "Sincronização com Open Finance para fluxo de caixa de reparos",
          "Agenda Integrada: Reserva horários livres do proprietário",
          "Checklists inteligentes para viagens e férias seguras"
        ],
        badge: "IDEAL PARA PROPRIETÁRIOS"
      },
      notPurchased: "Sistema Não Contratado",
      notPurchasedDesc: "Sob o seu plano atual, você está simulando uma licença individual. Cada sistema da HENIZA TECH funciona de maneira 100% autônoma e independente.",
      pricingLabel: "Contratação Individual Separada",
      oficiaPrice: "R$ 149,00 /mês por oficina",
      oriciaPrice: "R$ 89,00 /mês por usuário",
      prediciaPrice: "R$ 39,00 /mês por veículo",
      btnIndividual: "Contratar Apenas este Módulo",
      btnTrindia: "Desbloquear TrindIA™ Completa (Economize 35%)",
      trindiaDesc: "Adquira a trilogia integrada para unificar ordens de serviço, manuais e a rotina do veículo."
    },
    en: {
      oficia: {
        title: "OficIA™ — Smart Workshop Manager",
        subtitle: "Field Operations Management & Technical Diagnostics",
        desc: "The leading application for modern auto repair shops. Runs 100% offline, allowing parts inventory control, certified diagnostic reports, and daily safety checklists.",
        benefits: [
          "Mandatory PPE and tool calibration checklists",
          "Quick print of Technical Reports and Work Orders",
          "Smart torque and labor cost calculator",
          "Local IndexedDB database synced with smart cloud backup"
        ],
        badge: "IDEAL FOR WORKSHOPS"
      },
      oricia: {
        title: "OricIA™ — The RAG Knowledge Oracle",
        subtitle: "Network Technical Database & Wiring Diagrams",
        desc: "The intelligent oracle developed for elite engineers, technicians, and repair scholars. Uses RAG to scan complex manuals, electrical wiring diagrams, and forums with responses under 8 seconds.",
        benefits: [
          "Highly technical chatbot integrated with official repair manuals",
          "Instant access to connecting rod and crankshaft torque specs",
          "Advanced network RAG engine with zero manual overhead",
          "Excellent for rapid command-line terminal lookups"
        ],
        badge: "IDEAL FOR SCHOLARS & ENGINEERS"
      },
      predicia: {
        title: "PredicIA™ — Predictive AI & Life Planner",
        subtitle: "Probabilistic Vehicle Health + Personal Calendar",
        desc: "The ultimate car owner's co-pilot. Links vehicle health score (catalytic converter, brakes, ignition) directly to your calendar, proposing proactive preventative maintenance on your free slots.",
        benefits: [
          "Real-time parts durability and integrity scores",
          "Open Finance cashflow integration for pending repair costs",
          "Smart Calendar Sync: Recommends slots during free time",
          "Dynamic safe travel and holiday planning checklists"
        ],
        badge: "IDEAL FOR OWNERS"
      },
      notPurchased: "System Not Subscribed",
      notPurchasedDesc: "Under your current plan, you are simulating an individual license. Every HENIZA TECH system is designed to work completely autonomously and independently.",
      pricingLabel: "Individual Separate Pricing",
      oficiaPrice: "$29.00 /month per workshop",
      oriciaPrice: "$19.00 /month per user",
      prediciaPrice: "$9.00 /month per vehicle",
      btnIndividual: "Subscribe Only to this Module",
      btnTrindia: "Unlock Complete TrindIA™ (Save 35%)",
      trindiaDesc: "Get the integrated trilogy to unify repair orders, manuals, and owner routine."
    },
    es: {
      oficia: {
        title: "OficIA™ — Gestor Inteligente de Talleres",
        subtitle: "Gestión Operativa de Campo y Diagnósticos Técnicos",
        desc: "La aplicación líder para talleres mecánicos modernos. Funciona 100% offline, permitiendo el control de inventario de repuestos, emisión de informes certificados y listas de verificación de seguridad.",
        benefits: [
          "Checklist obligatorio de EPP y calibración de herramientas",
          "Emisión rápida de Informes Técnicos y Órdenes de Trabajo",
          "Calculadora inteligente de torque y mano de obra",
          "Base de datos local sincronizada mediante caché inteligente"
        ],
        badge: "IDEAL PARA TALLERES"
      },
      oricia: {
        title: "OricIA™ — El Oráculo de Conocimiento RAG",
        subtitle: "Base Técnica de Red y Esquemas Eléctricos",
        desc: "El oráculo inteligente desarrollado para ingenieros, técnicos de élite e intelectuales de reparación. Utiliza RAG para buscar manuales complejos, diagramas eléctricos y foros con respuestas en menos de 8 segundos.",
        benefits: [
          "Chatbot altamente técnico integrado con manuales oficiales",
          "Acceso instantáneo a especificaciones de torque de biela",
          "Mecanismo RAG avanzado de red sin latencia manual",
          "Ideal para consultas rápidas en terminal de comandos"
        ],
        badge: "IDEAL PARA INTELECTUALES E INGENIEROS"
      },
      predicia: {
        title: "PredicIA™ — IA Predictiva y Rutina de Vida",
        subtitle: "Salud Probabilística del Auto + Agenda Personal",
        desc: "El copiloto definitivo del propietario de vehículos. Asocia la puntuación de salud de las piezas directamente a la agenda personal, sugiriendo turnos de taller preventivos en los horarios libres del dueño.",
        benefits: [
          "Cálculo de Score de Integridad mecánica en tiempo real",
          "Sincronización con Open Finance para flujo de caja de reparaciones",
          "Agenda Integrada: Reserva turnos automáticos en horas libres",
          "Listas de verificación inteligentes para viajes y vacaciones"
        ],
        badge: "IDEAL PARA PROPIETARIOS"
      },
      notPurchased: "Sistema No Contratado",
      notPurchasedDesc: "Bajo su plan actual, está simulando una licencia individual. Cada sistema de HENIZA TECH funciona de manera 100% autónoma e independiente.",
      pricingLabel: "Contratación Individual Separada",
      oficiaPrice: "USD 29.00 /mes por taller",
      oriciaPrice: "USD 19.00 /mes por usuario",
      prediciaPrice: "USD 9.00 /mes por vehículo",
      btnIndividual: "Contratar Solo este Módulo",
      btnTrindia: "Desbloquear TrindIA™ Completo (Ahorre 35%)",
      trindiaDesc: "Adquiera la trilogía integrada para unificar órdenes de servicio, manuales y rutina del vehículo."
    }
  };

  const t = textContent[lang] || textContent.pt;
  const info = t[targetPlatform];

  // Pick color theme based on targeted locked platform
  const colorMap = {
    oficia: {
      border: 'border-sapare-teal/40',
      bg: 'from-sapare-teal/10 to-blue-950/20',
      text: 'text-sapare-teal',
      shadow: 'shadow-sapare-teal/5',
      icon: <Wrench className="w-10 h-10 text-sapare-teal" />,
      price: t.oficiaPrice
    },
    oricia: {
      border: 'border-sapare-gold/45',
      bg: 'from-sapare-gold/10 to-amber-950/20',
      text: 'text-sapare-gold',
      shadow: 'shadow-sapare-gold/5',
      icon: <BookOpen className="w-10 h-10 text-sapare-gold" />,
      price: t.oriciaPrice
    },
    predicia: {
      border: 'border-sapare-violet/40',
      bg: 'from-sapare-violet/10 to-purple-950/20',
      text: 'text-sapare-violet2',
      shadow: 'shadow-sapare-violet/5',
      icon: <Activity className="w-10 h-10 text-sapare-violet2" />,
      price: t.prediciaPrice
    }
  };

  const currentTheme = colorMap[targetPlatform];

  return (
    <div className="max-w-4xl mx-auto my-4 sm:my-8 px-1 sm:px-0 animate-fadeIn">
      
      {/* Main Locking Jumbotron card */}
      <div className={`bg-tech-cartao border ${currentTheme.border} rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 relative overflow-hidden shadow-2xl`}>
        <div className="absolute top-0 right-0 w-96 h-96 bg-sapare-glass/5 rounded-full blur-3xl pointer-events-none" />
        
        {/* Floating Lock indicator */}
        <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-tech-fundo border border-tech-borda rounded-full py-1 px-3">
          <Lock className="w-3.5 h-3.5 text-tech-alerta" />
          <span className="text-[9px] font-black uppercase text-tech-alerta font-mono">{t.notPurchased}</span>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 sm:gap-6 border-b border-tech-borda pb-4 sm:pb-6">
          <div className="p-3 sm:p-4 bg-tech-fundo rounded-2xl border border-tech-borda shadow-lg shrink-0">
            {currentTheme.icon}
          </div>
          <div>
            <span className={`text-[10px] font-black tracking-widest ${currentTheme.text} uppercase bg-white/5 px-2.5 py-1 rounded-md border border-white/10`}>
              {info.badge}
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-tech-texto font-display tracking-tight mt-2">
              {info.title}
            </h2>
            <p className="text-xs text-tech-secundario mt-0.5 font-semibold font-mono">
              {info.subtitle}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 pt-4 sm:pt-6">
          
          {/* Left Column: Product pitch & advantages */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-tech-texto uppercase tracking-wider">
              Funcionalidade Independente do Módulo
            </h3>
            <p className="text-xs text-tech-texto/85 leading-relaxed">
              {info.desc}
            </p>

            <div className="bg-tech-fundo p-4 rounded-2xl border border-tech-borda space-y-3">
              <span className="text-[10px] font-black text-tech-secundario uppercase block tracking-wider">
                Recursos Inclusos neste Sistema:
              </span>
              <ul className="space-y-2 text-xs">
                {info.benefits.map((b, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-tech-texto/90">
                    <Check className="w-4 h-4 text-tech-sucesso shrink-0 mt-0.5" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right Column: Pricing & Quick Simulated Activation */}
          <div className="bg-tech-fundo/45 border border-tech-borda rounded-2xl p-4 sm:p-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-black text-tech-secundario uppercase block tracking-wider font-mono">
                  {t.pricingLabel}
                </span>
                <div className="text-2xl font-black text-tech-texto mt-1">
                  {currentTheme.price}
                </div>
                <p className="text-[10px] text-tech-secundario mt-1 leading-relaxed">
                  {t.notPurchasedDesc}
                </p>
              </div>

              {/* Individual Simulation Activation button */}
              <button
                onClick={onActivateThisIndividual}
                className="w-full bg-tech-cartao hover:bg-tech-borda text-tech-texto border border-tech-borda text-xs font-black py-3 px-4 rounded-xl transition shadow flex items-center justify-center gap-2 cursor-pointer"
              >
                <Cpu className="w-4 h-4 text-tech-destaque animate-pulse" />
                {t.btnIndividual}
              </button>
            </div>

            {/* TrindIA Integrator bundle Pitch */}
            <div className="border-t border-tech-borda pt-4 mt-4 space-y-3">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-sapare-gold animate-bounce" />
                <span className="text-[10px] font-black text-tech-texto uppercase tracking-wider">
                  TrindIA™ Ecosystem Upgrade
                </span>
              </div>
              <p className="text-[10px] text-tech-secundario leading-relaxed">
                {t.trindiaDesc}
              </p>
              <button
                onClick={onActivateTrindia}
                className="w-full bg-gradient-to-r from-sapare-teal via-sapare-gold to-sapare-violet2 text-sapare-dark text-xs font-black py-3 px-4 rounded-xl hover:scale-102 transition shadow-lg shadow-sapare-teal/10 flex items-center justify-center gap-2 cursor-pointer"
              >
                {t.btnTrindia}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>

        </div>

      </div>

      <div className="mt-4 text-center text-[10px] text-tech-secundario font-mono">
        🔒 A sua escolha de licença é persistida localmente. Altere o perfil de simulação comercial a qualquer momento na barra superior.
      </div>

    </div>
  );
}
