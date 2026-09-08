import React, { useState, useMemo } from 'react';
import { 
  Database, Brain, MessageSquare, Search, Video, MapPin, 
  Users, Terminal, ArrowRight, Sparkles, Cpu, BookOpen, 
  Compass, HelpCircle, FileText, CheckCircle2, ChevronDown, 
  ChevronUp, ExternalLink, Globe, Zap, Network, HardDrive, 
  LineChart, Plus, Share2, Shield, AlertTriangle
} from 'lucide-react';

interface OricIAProps {
  lang: 'pt' | 'en' | 'es';
  setSuccessToast: (msg: string | null) => void;
}

// Preset multi-domain manual database
const INITIAL_MANUALS = {
  automotivo: [
    {
      id: 'ea111',
      title: 'VW EA111 (Gol/Fox/Voyage 1.0/1.6)',
      category: 'Especificações de Torque, Ponto & Injeção Magneti Marelli 4GV/9GV',
      details: [
        { item: 'Parafusos do Cabeçote', val: 'Etapa 1: 30 Nm | Etapa 2: 90° | Etapa 3: 90°' },
        { item: 'Mancais de Biela & Virabrequim', val: 'Biela: 30 Nm + 90° | Virabrequim: 50 Nm + 90°' },
        { item: 'Pressão de Óleo Nominal', val: 'Mínimo 2.0 Bar a 2000 RPM (Óleo 5W40 502.00)' },
        { item: 'Pinagem ECU 9GV (T121)', val: 'Pino 11/12: Massa | Pino 13: +12V Pós-chave | Pino 68: Sinal CKP' }
      ],
      notes: 'Gargalos comuns: Desgaste na chaveta do virabrequim, acendimento da luz EPC por interruptor de freio ou corpo de borboleta sujo, e obstrução do respiro de óleo (pcf valve).'
    },
    {
      id: 'gm-spe4',
      title: 'Chevrolet SPE/4 & Ecotec (Onix/Prisma/Cruze)',
      category: 'Esquema Elétrico, Injeção Delphi MT27e / E83 & Códigos do Painel',
      details: [
        { item: 'Código 89 no Painel', val: 'Falha no circuito da válvula termostática pilotada (Resistência do aquecedor)' },
        { item: 'Código 82 no Painel', val: 'Troca de Óleo do Motor requerida / Reset do contador de vida útil' },
        { item: 'Bobina de Ignição Única (4 Pinos)', val: 'Pino A: +12V | Pino B: Massa Signal Ground | Pino C/D: Pulsos ECU' }
      ],
      notes: 'Para apagar o Code 82: Ligue a chave sem dar partida, pressione o pedal do acelerador até o fim 3 vezes em 5 segundos ou via menu do painel.'
    },
    {
      id: 'fiat-firefly',
      title: 'Fiat Firefly 1.0/1.3 GSE (Argo/Cronos/Mobi)',
      category: 'Mecanismo de Válvulas BorgWarner MultiAir & Rede CAN',
      details: [
        { item: 'Torque Módulo VVT MultiAir', val: '12 Nm + 45° com parafuso novo lubrificado' },
        { item: 'Pressão da Galeria de Combustível', val: 'Injeção Direta GSE Turbo: Até 200 Bar' },
        { item: 'Comunicação CAN Bus (OBD2)', val: 'Pino 6 (CAN-H 500kbps) | Pino 14 (CAN-L 500kbps)' }
      ],
      notes: 'Uso de óleo incorreto no sistema MultiAir (diferente do Selenia 0W20) causa travamento hidráulico das válvulas de admissão e código P1061.'
    },
    {
      id: 'm139',
      title: 'Mercedes AMG M139 2.0T (421cv)',
      category: 'Fadiga de Catalisador, Injeção Dupla & EGT',
      details: [
        { item: 'Coletor de Escape & Turbo Twin-Scroll', val: '25 Nm em espiral cruzada (Prisioneiros Inconel)' },
        { item: 'Pressão de Injeção Direta (Piezo)', val: '200 Bar (Direta) + 6.5 Bar (Port Injection)' },
        { item: 'Sonda Lambda Pós-Catalisador', val: '45 Nm - Sensor A/F Ampla Banda' }
      ],
      notes: 'Altas temperaturas EGT. Emissões fora do padrão indicam desgaste precoce do catalisador cerâmico por combustível de baixa octanagem.'
    },
    {
      id: 'ecu-software-hardware',
      title: 'Módulos ECU, Software OBD2 & Hardware de Bancada',
      category: 'Interface de Programação, KESS v2, KTAG, WinOLS & VCDS',
      details: [
        { item: 'Protocolo Bootmode TriCore (TC1766/TC1797)', val: 'Resistor 1kΩ no pino BOOT + 12V VCC estabilizado' },
        { item: 'Software VCDS (VW/Audi)', val: 'Canal 060: Adaptação TBI | Canal 063: Kickdown | Canal 001: Ponto Injeção' },
        { item: 'Rede CAN Bus Hardware', val: 'Resistência de terminação nominal: 60Ω (Dois resistores de 120Ω em paralelo)' }
      ],
      notes: 'Sempre conecte uma fonte automotiva estabilizada de 13.8V de no mínimo 30A ao ler/escrever arquivos de mapas ECU para evitar brick do módulo.'
    }
  ],
  eletrica_iot: [
    {
      id: 'sonoff-tasmota',
      title: 'Dispositivo Smart Sonoff Switch (IoT)',
      category: 'Pinagem & Flash de Firmware',
      details: [
        { item: 'Tensão Operacional', val: '3.3V DC (Não alimentar por 110/220V enquanto conectado ao FTDI)' },
        { item: 'Pino de Gravação (Flash)', val: 'Aterrar GPIO0 durante a inicialização' }
      ],
      notes: 'Se houver perda frequente de conexão Wi-Fi, revise o capacitor eletrolítico de filtragem da fonte interna de 3.3V.'
    },
    {
      id: 'inversor-solar',
      title: 'Inversor Fronius Symo 5.0',
      category: 'Diagrama de Instalação & Códigos de Erro',
      details: [
        { item: 'Erro 401 (Ausência de Rede)', val: 'Verificar fusível AC e disjuntor de entrada' },
        { item: 'Resistência de Isolamento Mínima', val: '> 100 kΩ' }
      ],
      notes: 'Arco elétrico DC pode ser prevevido mantendo os conectores MC4 crimpados com ferramenta específica de pressão calibrada.'
    }
  ],
  ti_codigo: [
    {
      id: 'docker-compose-prod',
      title: 'Docker Compose (Ambiente de Produção)',
      category: 'Orquestração & Políticas de Reinício',
      details: [
        { item: 'Restart Policy', val: 'restart: unless-stopped' },
        { item: 'Limites de Recurso', val: 'cpus: "2.0" | memory: 2048M' }
      ],
      notes: 'Para evitar vazamento de memória em NodeJS, configure NODE_ENV=production para otimizar garbage collection.'
    },
    {
      id: 'redis-cluster',
      title: 'Redis Cluster In-Memory DB',
      category: 'Parâmetros de Persistência',
      details: [
        { item: 'Append Only File (AOF)', val: 'appendfsync everysec' },
        { item: 'Máximo de Clientes', val: 'maxclients 10000' }
      ],
      notes: 'Monitore o indicador rdb_changes_since_last_save. Variações bruscas podem degradar a performance de I/O em discos magnéticos.'
    }
  ],
  mecanica_geral: [
    {
      id: 'bomba-hidraulica-ksb',
      title: 'Bomba Centrífuga KSB Megabloc',
      category: 'Alinhamento de Eixo & Selo Mecânico',
      details: [
        { item: 'Desalinhamento Radial Máx', val: '0.05 mm' },
        { item: 'Aperto do Selo Mecânico', val: 'Garantir pré-carga de 3.2mm de compressão de mola' }
      ],
      notes: 'Ruído de cavitação sugere NPSH disponível menor que o requerido. Reduza restrições na linha de sucção do fluido.'
    }
  ],
  geral: [
    {
      id: 'climatizador-carrier',
      title: 'Chiller Carrier 30RBA',
      category: 'Análise de Fluxo & Compressor Scroll',
      details: [
        { item: 'Carga de Refrigerante R410A', val: '8.5 kg por circuito' },
        { item: 'Pressão de Sucção Nominal', val: '120 psi' }
      ],
      notes: 'Congelamento frequente na serpentina indica restrição severa de fluxo de ar ou falta parcial de carga de fluido refrigerante.'
    }
  ]
};

export default function OricIA({ lang, setSuccessToast }: OricIAProps) {
  // --- STATE MANAGEMENT FOR DOMAIN ADAPTABILITY ---
  const [activeDomain, setActiveDomain] = useState<'automotivo' | 'eletrica_iot' | 'ti_codigo' | 'mecanica_geral' | 'geral'>('automotivo');
  
  // Evolving Brain Statistics
  const [brainSynapses, setBrainSynapses] = useState(1420890);
  const [knowledgeNodes, setKnowledgeNodes] = useState(42912);
  const [solutionsCreated, setSolutionsCreated] = useState(854);
  const [ingestedSources, setIngestedSources] = useState<string[]>([
    'mecanica-global-specs.org',
    'stack-overflow-technical.com',
    'ieee-standards-database.edu',
    'carrier-chiller-maintenance-manual'
  ]);

  // Crawler Simulation State
  const [crawlerUrl, setCrawlerUrl] = useState('');
  const [crawlerLogs, setCrawlerLogs] = useState<string[]>([]);
  const [isCrawling, setIsCrawling] = useState(false);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedManual, setExpandedManual] = useState<string | null>(null);

  // Synthesizer State
  const [problemInput, setProblemInput] = useState('');
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [synthesizedSolution, setSynthesizedSolution] = useState<any | null>(null);

  // Chat State
  const [customQuestion, setCustomQuestion] = useState('');
  const [isOracleTyping, setIsOracleTyping] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([
    {
      sender: 'oracle',
      text: 'Saudações! Eu sou o **OricIA - O Oráculo de Conhecimento Técnico Global**. Sou um organismo vivo que busca soluções vasculhando a rede mundial para qualquer domínio em que você esteja trabalhando. Eu aprendo, me especializo em tempo real e respondo tanto individualmente quanto integrando com os sistemas OficIA™ e PredicIA™. Como posso te apoiar hoje?'
    }
  ]);

  // Dynamic Translations & Texts based on Domain
  const translations = useMemo(() => {
    return {
      pt: {
        title: "OricIA™ Engine",
        subtitle: "Oráculo Vivo de Conhecimento Global & RAG",
        desc: "Organismo de busca mundial e síntese em tempo real. Adapta-se a qualquer setor tecnológico, aprende dinamicamente a cada consulta e integra soluções de forma bidirecional com os demais módulos HENIZA TECH.",
        domainLabel: "Selecione o Domínio de Foco da IA",
        synapses: "Sinapses Conectadas",
        nodes: "Nós de Conhecimento",
        solutions: "Soluções Criadas",
        ingested: "Fontes Ingeridas na Rede",
        
        // Domains
        domain_automotivo: "Mecânica Automotiva",
        domain_eletrica_iot: "Elétrica & IoT",
        domain_ti_codigo: "TI & Programação",
        domain_mecanica_geral: "Mecânica Geral & Industrial",
        domain_geral: "Geral & Outros Sistemas",

        // Crawler Labels
        crawlerTitle: "Vasculhador e Rastreador da Rede Mundial",
        crawlerDesc: "Insira uma URL técnica, repositório ou base de fórum para o OricIA buscar, indexar e ingerir novas soluções.",
        crawlerBtn: "Rastrear e Ingerir",
        crawlerPlaceholder: "Ex: github.com/lib-arduino ou autoforum.net/topic-321...",
        crawlerSuccess: "Fonte rastreada e integrada à inteligência do Oráculo!",

        // Synthesizer Labels
        synthTitle: "Sintetizador de Soluções em Tempo Real",
        synthDesc: "Descreva qualquer falha ou enigma tecnológico. OricIA cruzará dados globais em milissegundos para gerar um plano técnico de resolução estruturado.",
        synthBtn: "Sintetizar Solução Técnica",
        synthPlaceholder: "Ex: Ar condicionado pingando água dentro de casa / Erro de OutOfMemory no contêiner Docker / Carro morrendo em marcha lenta quente...",
        synthResultTitle: "Solução Gerada com Sucesso!",
        synthExportOficia: "Exportar para OficIA (Laudo)",
        synthExportPredicia: "Integrar à Agenda PredicIA",
        synthExportSuccess: "Inteligência sincronizada com sucesso no ecossistema TrindIA!",

        // Preset Questions
        presetsTitle: "Sugestões rápidas baseadas no domínio atual:",
        manualsTitle: "Base de Manuais e Fichas Ingeridas",
        forumTitle: "Pesquisas Globais & Resoluções Recentes",
        integrationTitle: "Status de Conexão e Rede de Compartilhamento TrindIA"
      },
      en: {
        title: "OricIA™ Engine",
        subtitle: "Living Global Knowledge Oracle & RAG",
        desc: "A worldwide search and real-time synthesis organism. Adapts to any technological field, learns dynamically from queries, and bidirectionally integrates solutions across all HENIZA TECH modules.",
        domainLabel: "Select IA Focus Domain",
        synapses: "Connected Synapses",
        nodes: "Knowledge Nodes",
        solutions: "Solutions Synthesized",
        ingested: "Ingested Global Sources",

        domain_automotivo: "Automotive Mechanics",
        domain_eletrica_iot: "Electrical & IoT",
        domain_ti_codigo: "IT & Coding",
        domain_mecanica_geral: "General & Industrial Mech",
        domain_geral: "General & Custom Systems",

        crawlerTitle: "Worldwide Web Crawler & Ingestion Tool",
        crawlerDesc: "Provide any technical URL, forum, or repository for OricIA to search, index, and ingest new solution blueprints.",
        crawlerBtn: "Crawl & Ingest Source",
        crawlerPlaceholder: "E.g., stackoverflow.com/questions-9921 or custom-manuals.org...",
        crawlerSuccess: "Source successfully crawled and integrated into the Oracle's brain!",

        synthTitle: "Real-Time Solution Synthesizer",
        synthDesc: "Describe any technological breakdown, code error, or hardware failure. OricIA will match global patterns to create an immediate step-by-step fix.",
        synthBtn: "Synthesize Technical Solution",
        synthPlaceholder: "E.g., AC leaking water indoors / Docker container running out of memory / Car stalling when hot...",
        synthResultTitle: "Solution Synthesized Successfully!",
        synthExportOficia: "Export to OficIA (Report)",
        synthExportPredicia: "Schedule on PredicIA",
        synthExportSuccess: "Solution synced successfully across the TrindIA ecosystem!",

        presetsTitle: "Quick prompt presets based on current focus:",
        manualsTitle: "Ingested Manuals & Specifications",
        forumTitle: "Recent Global Forum Solved Threads",
        integrationTitle: "TrindIA Integrated Network & Synced Systems"
      },
      es: {
        title: "OricIA™ Engine",
        subtitle: "Oráculo Vivo de Conocimiento Global y RAG",
        desc: "Organismo vivo de búsqueda global y síntesis en tiempo real. Se adapta a cualquier sector tecnológico, aprende de las consultas e integra soluciones de manera bidireccional en el ecosistema HENIZA TECH.",
        domainLabel: "Seleccione el Dominio de Foco de la IA",
        synapses: "Sinapsis Conectadas",
        nodes: "Nodos de Conocimiento",
        solutions: "Soluciones Creadas",
        ingested: "Fuentes Globales Ingeridas",

        domain_automotivo: "Mecánica Automotriz",
        domain_eletrica_iot: "Eléctrica e IoT",
        domain_ti_codigo: "TI y Programación",
        domain_mecanica_geral: "Mecánica General e Industrial",
        domain_geral: "General y Otros Sistemas",

        crawlerTitle: "Rastreador y Buscador de la Red Mundial",
        crawlerDesc: "Ingrese una URL técnica, repositorio o foro para que OricIA busque, indexe e ingiera nuevas soluciones.",
        crawlerBtn: "Rastrear e Ingerir",
        crawlerPlaceholder: "Ej: github.com/esp8266-wifi o autoforum.net/topic-532...",
        crawlerSuccess: "¡Fuente rastreada e integrada a la base del Oráculo!",

        synthTitle: "Sintetizador de Soluciones en Tiempo Real",
        synthDesc: "Describa cualquier falla o enigma tecnológico. OricIA cruzará datos globales en milisegundos para generar un plan técnico estructurado.",
        synthBtn: "Sintetizar Solución Técnica",
        synthPlaceholder: "Ej: Aire acondicionado goteando agua en la sala / Error de OutOfMemory en Docker / Coche apagándose caliente...",
        synthResultTitle: "¡Solución Sintetizada Exitosamente!",
        synthExportOficia: "Exportar a OficIA (Informe)",
        synthExportPredicia: "Agendar en PredicIA",
        synthExportSuccess: "¡Inteligencia sincronizada con éxito en el ecosistema TrindIA!",

        presetsTitle: "Sugerencias rápidas basadas en el dominio actual:",
        manualsTitle: "Manuales y Fichas Técnicas Ingeridas",
        forumTitle: "Búsquedas Globales y Resoluciones Recientes",
        integrationTitle: "Red de Intercambio y Sistemas Sincronizados TrindIA"
      }
    };
  }, []);

  const cur = translations[lang] || translations.pt;

  // Preset Dashboard & Instrument Cluster Codes
  const DASHBOARD_CODES = [
    {
      code: "EPC",
      title: "Luz EPC (Electronic Power Control)",
      color: "amber",
      severity: "Atenção Média/Alta",
      make: "Volkswagen / Audi / SEAT",
      meaning: "Falha na eletrônica do motor, pedal do acelerador eletrônico, corpo de borboleta ou interruptor das luzes de freio.",
      action: "Inspecione o interruptor de freio no pedal e limpe a borboleta de aceleração (TBI). Se houver perda de potência, verifique falha nos cabos/velas de ignição."
    },
    {
      code: "Code 89",
      title: "Code 89 (Manutenção no Veículo)",
      color: "amber",
      severity: "Atenção",
      make: "Chevrolet (Onix, Prisma, Cruze, Spin, Cobalt, Tracker)",
      meaning: "Resistência do aquecedor da válvula termostática pilotada aberta ou em curto-circuito.",
      action: "Substitua o refil/carcaça da válvula termostática de acionamento eletrônico. Limpe o conector da carcaça do termostato para remover oxidação de aditivo."
    },
    {
      code: "Code 82",
      title: "Code 82 (Troca de Óleo do Motor)",
      color: "blue",
      severity: "Informativo",
      make: "Chevrolet",
      meaning: "Indicador de vida útil do óleo de motor atingiu o limite de km ou dias.",
      action: "Realize a troca do óleo e filtro. Para apagar: Ligue a chave (sem partida), pise no acelerador até o fundo 3 vezes dentro de 5 segundos ou resete no painel."
    },
    {
      code: "Check Engine / Injeção",
      title: "Luz de Injeção Eletrônica (MIL)",
      color: "amber",
      severity: "Atenção Média",
      make: "Multimarcas",
      meaning: "Anomalia detectada pelo sistema de injeção/emissões (Ex: P0300 Misfire, P0420 Catalisador, P0130 Sonda Lambda).",
      action: "Conecte o scanner OBD2 para leitura dos DTCs salvos na memória da ECU. Verifique combustível adulterado, bobinas e estanqueidade de estequiometria."
    },
    {
      code: "Pressão de Óleo 🛢️",
      title: "Luz de Pressão de Óleo Insuficiente",
      color: "red",
      severity: "CRÍTICA MAXIMA",
      make: "Multimarcas",
      meaning: "Pressão hidráulica de lubrificação abaixo do limite seguro (Abaixo de 0.5 Bar em marcha lenta).",
      action: "DESLIGUE O MOTOR IMEDIATAMENTE! Verifique o nível de óleo na vareta. Se o nível estiver correto, reboque o veículo para checar bomba de óleo e pescador entupido."
    },
    {
      code: "Temperatura 🌡️",
      title: "Luz de Sobreaquecimento do Motor",
      color: "red",
      severity: "CRÍTICA MAXIMA",
      make: "Multimarcas",
      meaning: "Temperatura do líquido de arrefecimento ultrapassou 115°C.",
      action: "Pare o veículo com segurança. NÃO abra a tampa do reservatório quente. Inspecione vazamento de aditivo, funcionamento do eletroventilador (ventoinha) e fusíveis."
    },
    {
      code: "InSP",
      title: "Indicador InSP (Service Inspection)",
      color: "blue",
      severity: "Informativo",
      make: "VW, GM, Opel, Fiat",
      meaning: "Aviso de revisão periódica agendada por quilometragem ou tempo.",
      action: "Mantenha o botão de zerar o odômetro parcial pressionado, ligue a chave mantendo pressionado por 10 segundos até os traços surgirem no display."
    },
    {
      code: "ABS & ESC 🛑",
      title: "Luz do Freio ABS / Controle de Estabilidade",
      color: "amber",
      severity: "Atenção",
      make: "Multimarcas",
      meaning: "Falha na leitura de rotação de roda (WSS) ou no módulo hidráulico do ABS.",
      action: "Verifique os sensores de roda ABS ( sujeira ou cabo partido) e limpe a roda fônica magnética nas moscas do rolamento de roda."
    },
    {
      code: "Bateria / Carga 🔋",
      title: "Luz de Carga da Bateria / Alternador",
      color: "red",
      severity: "Alta",
      make: "Multimarcas",
      meaning: "O alternador não está gerando energia para recarregar a bateria (Tensão abaixo de 12.8V com motor ligado).",
      action: "Verifique se a correia de acessórios (Poly-V) arrebentou. Meça a voltagem no alternador; se estiver em 12V, substitua o regulador de voltagem/escovas."
    },
    {
      code: "DPF 💨",
      title: "Filtro de Partículas Diesel Saturado",
      color: "amber",
      severity: "Atenção",
      make: "Veículos Diesel (Toro, Hilux, Ranger, Amarok)",
      meaning: "Filtro de fuligem DPF acumulou cinzas e necessita de regeneração ativa.",
      action: "Rode com o veículo em rodovia a mais de 60 km/h em rotação contínua (acima de 2000 RPM) por 20 minutos para acionar a regeneração automática da ECU."
    }
  ];

  // Selected Cluster Code Filter State
  const [selectedDashboardFilter, setSelectedDashboardFilter] = useState('');
  const [activeClusterCode, setActiveClusterCode] = useState<any | null>(null);
  const domainPresets = useMemo(() => {
    return {
      automotivo: [
        { label: "Cabeçote EA111", q: "Qual o torque do cabeçote do motor EA111?" },
        { label: "Mercedes P0420", q: "Como resolver o erro P0420 de baixa eficiência de catalisador em Mercedes?" },
        { label: "Ruído no Alternador", q: "Alternador fazendo zumbido agudo em marcha lenta, o que inspecionar?" }
      ],
      eletrica_iot: [
        { label: "Tasmota Sonoff", q: "Como colocar o Sonoff Switch em modo flash para instalar Tasmota?" },
        { label: "Fronius Erro 401", q: "Inversor Fronius apresentando Erro 401, o que pode ser na rede AC?" },
        { label: "Ruído ESP32", q: "ESP32 reiniciando constantemente ao acionar relé de 12V. Como desacoplar?" }
      ],
      ti_codigo: [
        { label: "Docker Memory Limit", q: "Como limitar CPU e memória de um contêiner no docker-compose?" },
        { label: "Redis Latency", q: "Qual parâmetro de appendfsync garante menor perda de dados com melhor I/O?" },
        { label: "API Rate Limiting", q: "Como configurar rate limiting em ExpressJS usando Redis como cache de tokens?" }
      ],
      mecanica_geral: [
        { label: "Bomba Centrífuga", q: "Como alinhar acoplamento de bomba KSB centrífuga contra desalinhamento radial?" },
        { label: "Cavitação Tubulação", q: "Sintomas e causas de cavitação em linhas de sucção de alta temperatura." }
      ],
      geral: [
        { label: "Carrier Chiller", q: "Chiller Carrier apresentando congelamento na serpentina. Causas prováveis." },
        { label: "Vazamento Interno AC", q: "Como desobstruir bandeja de condensado em condicionador de ar de janela?" }
      ]
    };
  }, []);

  const currentManuals = useMemo(() => {
    return INITIAL_MANUALS[activeDomain] || [];
  }, [activeDomain]);

  // Simulated Web Crawler Execution
  const handleWebCrawl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!crawlerUrl.trim()) return;

    setIsCrawling(true);
    setCrawlerLogs([`[OricIA Crawler] Iniciando varredura estocástica em: ${crawlerUrl}`]);

    const stepLogs = [
      `[HTTP GET] Estabelecendo conexão TLS v1.3 com servidores globais...`,
      `[DOM PARSER] Extraindo tags e identificando esquemas de dados JSON-LD...`,
      `[NLP RAG Engine] Tokenizando documentação técnica e diagramas associados...`,
      `[AI Ingestion] Cruzando conceitos com base de conhecimento prévia...`,
      `[Database Sync] Salvando dados persistentes em cache local indexado.`
    ];

    stepLogs.forEach((log, idx) => {
      setTimeout(() => {
        setCrawlerLogs(prev => [...prev, log]);
        // Update stats progressively
        setBrainSynapses(prev => prev + Math.floor(Math.random() * 500) + 100);
        
        if (idx === stepLogs.length - 1) {
          setIsCrawling(false);
          setKnowledgeNodes(prev => prev + Math.floor(Math.random() * 8) + 2);
          setIngestedSources(prev => [...prev, crawlerUrl.replace(/https?:\/\//, '')]);
          setCrawlerUrl('');
          setSuccessToast(cur.crawlerSuccess);
        }
      }, (idx + 1) * 450);
    });
  };

  const handleRealSynthesizeSolution = async (e: React.FormEvent) => {
    e.preventDefault();
    const problem = problemInput.trim();
    if (!problem || isSynthesizing) return;
    setIsSynthesizing(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: problem, domain: activeDomain, mode: 'synthesis' })
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.error || 'Falha na IA');
      setSynthesizedSolution({ ...payload.data, problem, domain: activeDomain, timestamp: new Date().toLocaleTimeString() });
      setSolutionsCreated(prev => prev + 1);
      setBrainSynapses(prev => prev + 2500);
      setSuccessToast(cur.synthResultTitle);
    } catch (error) {
      console.error('[v0] Erro ao sintetizar solução:', error);
      setSuccessToast(lang === 'pt' ? 'A IA está indisponível no momento.' : 'AI is currently unavailable.');
    } finally {
      setIsSynthesizing(false);
    }
  };

  // Fallback legado mantido para compatibilidade visual offline.
  const handleSynthesizeSolution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!problemInput.trim()) return;

    setIsSynthesizing(true);
    setTimeout(() => {
      // Create customized probabilistic and technical analysis output
      const probIndex1 = Math.floor(Math.random() * 35) + 45; // Primary cause probability
      const probIndex2 = 100 - probIndex1 - Math.floor(Math.random() * 15);
      const probIndex3 = 100 - probIndex1 - probIndex2;

      let cause1 = "Falta de lubrificação / Fadiga molecular de contatos";
      let cause2 = "Parâmetros incorretos de firmware ou oscilação elétrica de rede";
      let cause3 = "Acúmulo excessivo de poeira nos filtros / Obstrução de fluxo";
      let steps: string[] = [];

      const query = problemInput.toLowerCase();
      if (query.includes('ar') || query.includes('condicionado') || query.includes('chiller') || query.includes('frio') || query.includes('geladeira')) {
        cause1 = "Obstrução física na mangueira de drenagem de condensado";
        cause2 = "Saturação microbiológica no filtro de ar de retorno";
        cause3 = "Vazamento lento do fluido refrigerante por fadiga mecânica de tubulação";
        steps = [
          "1. Desligue a alimentação do equipamento no disjuntor de proteção.",
          "2. Utilize ar comprimido ou arame flexível para limpar e desobstruir o dreno de condensado.",
          "3. Higienize os filtros com álcool isopropílico ou substitua-os imediatamente.",
          "4. Aplique sabão neutro nas conexões de cobre para verificar vazamentos por bolhas de ar."
        ];
      } else if (query.includes('docker') || query.includes('code') || query.includes('erro') || query.includes('banco') || query.includes('ti') || query.includes('bug')) {
        cause1 = "Vazamento de conexões abertas com o banco de dados (Connection Leak)";
        cause2 = "Definição incorreta dos limites de memória do contêiner Docker (JVM/V8)";
        cause3 = "Incompatibilidade de versões de dependências NPM/Python transitivas";
        steps = [
          "1. Adicione um bloco try/finally para garantir o fechamento de conexões de conexões ativas.",
          "2. Edite o arquivo docker-compose.yml limitando o consumo: memory: 1024m.",
          "3. Execute 'npm prune' e limpe o cache do gerenciador de pacotes local.",
          "4. Habilite o Garbage Collector manual com a flag --expose-gc para testes pontuais."
        ];
      } else if (query.includes('carro') || query.includes('motor') || query.includes('freio') || query.includes('torque') || query.includes('volante')) {
        cause1 = "Fadiga extrema do sensor de oxigênio primário (Sonda Lambda)";
        cause2 = "Obstrução parcial da tubulação de exaustão e catalisador por resíduos carbonizados";
        cause3 = "Folga mecânica no tensionador da correia dentada de sincronismo";
        steps = [
          "1. Conecte o scanner OficIA™ para ler o histórico de falhas de injeção (DTCs).",
          "2. Meça a pressão de linha de combustível; deve estar em no mínimo 3.8 Bar.",
          "3. Realize a descarbonização química do motor utilizando aditivos de combustível de alta concentração.",
          "4. Agende a troca das pastilhas de freio caso o indicador de desgaste esteja abaixo de 30%."
        ];
      } else {
        cause1 = "Falta de calibração periódica e desgaste do elemento de contato";
        cause2 = "Instabilidade na entrada de energia com transientes acima de 150V";
        cause3 = "Configurações inadequadas do software de orquestração interna";
        steps = [
          "1. Desconecte o dispositivo e execute um ciclo completo de reset físico (Power Cycle).",
          "2. Limpe os conectores e verifique se há oxidação ou pontos de alta resistência térmica.",
          "3. Consulte o banco de manuais técnicos do OricIA para torques e encaixes originais.",
          "4. Solicite uma varredura profunda no osciloscópio para analisar ruídos de frequência."
        ];
      }

      setSynthesizedSolution({
        problem: problemInput,
        domain: activeDomain,
        probabilities: [
          { name: cause1, val: probIndex1 },
          { name: cause2, val: probIndex2 },
          { name: cause3, val: probIndex3 }
        ],
        steps,
        timestamp: new Date().toLocaleTimeString()
      });

      setSolutionsCreated(prev => prev + 1);
      setBrainSynapses(prev => prev + 2500);
      setIsSynthesizing(false);
      setSuccessToast(cur.synthResultTitle);
    }, 1500);
  };

  // Send synthesized data to OficIA task stream
  const handleExportOficia = () => {
    if (!synthesizedSolution) return;
    setSuccessToast(lang === 'pt' 
      ? `✓ Solução para "${synthesizedSolution.problem}" enviada para a fila de Ordens de Serviço do OficIA!` 
      : `✓ Solution for "${synthesizedSolution.problem}" exported as a certified report in OficIA!`
    );
  };

  // Send synthesized data to PredicIA agenda
  const handleExportPredicia = () => {
    if (!synthesizedSolution) return;
    setSuccessToast(lang === 'pt' 
      ? `✓ Alerta preventivo gerado! Agendado na agenda pessoal do PredicIA para manutenção recomendada.` 
      : `✓ Preventative alert registered! Scheduled on PredicIA's personal calendar for recommended upkeep.`
    );
  };

  const triggerRealOracleReply = async (question: string) => {
    setIsOracleTyping(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: question, domain: activeDomain, mode: 'chat' })
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.error || 'Falha na IA');
      setChatMessages(prev => [...prev, { sender: 'oracle', text: payload.data.answer }]);
      setBrainSynapses(prev => prev + 1200);
      setKnowledgeNodes(prev => prev + 1);
      setSuccessToast(lang === 'pt' ? 'Resposta gerada pelo OricIA.' : 'Response generated by OricIA.');
    } catch (error) {
      console.error('[v0] Erro no chat OricIA:', error);
      setChatMessages(prev => [...prev, { sender: 'oracle', text: lang === 'pt' ? 'Não consegui acessar a IA agora. Verifique a conexão e tente novamente.' : 'I could not reach the AI now. Check the connection and try again.' }]);
    } finally {
      setIsOracleTyping(false);
    }
  };

  // Fallback legado mantido para compatibilidade visual offline.
  const triggerOracleReply = (question: string) => {
    setIsOracleTyping(true);
    setTimeout(() => {
      let responseText = '';
      const q = question.toLowerCase();

      // Dynamic custom responses covering ALL technical domains beautifully
      if (q.includes('code 89') || q.includes('code 82') || q.includes('epc') || q.includes('painel') || q.includes('insp') || q.includes('luz')) {
        responseText = `### 🚘 Diagnóstico do Painel de Instrumentos — OricIA
        
Identifiquei uma consulta sobre **Códigos e Luzes do Painel de Veículos**:

* **Code 89 (GM/Chevrolet):** Indica falha no circuito elétrico do aquecedor da válvula termostática eletrônica. Solução: Troca da carcaça do termostato e limpeza do chicote.
* **Code 82 (GM/Chevrolet):** Aviso de troca do óleo de motor vencida. Para resetar: Ligue a chave sem partida, pise até o fundo do acelerador 3 vezes em 5 segundos.
* **Luz EPC (VW/Audi):** Falha no corpo de borboleta (TBI), pedal do acelerador eletrônico ou interruptor de freio.
* **Indicador InSP (VW/GM/Fiat):** Aviso de intervalo de manutenção/revisão preventiva.

*Recomendação OricIA:* Utilize a ferramenta "Decodificador de Luzes de Painel" abaixo para consultar diagnósticos detalhados e procedimentos de reset!`;
      } else if (q.includes('esquema') || q.includes('pinagem') || q.includes('ecu') || q.includes('can bus') || q.includes('software')) {
        responseText = `### ⚡ Esquema Elétrico & Pinout de ECU — OricIA
        
Varredura nos bancos de dados de pinagens e comunicação automotiva:

* **Injeção Magneti Marelli 9GV / 4GV (VW):** Pino 11/12 (Massa) | Pino 13 (+12V Pós-Chave) | Pino 68 (Sinal CKP do Virabrequim).
* **Injeção Delphi MT27e / E83 (GM):** Pino A (Massa) | Pino B (+12V Relé Principal) | Comunicação via pino 6 e 14 da tomada OBD2 (CAN-High 500kbps / CAN-Low 500kbps).
* **Softwares & Hardwares de Bancada:** VCDS (Adaptação TBI Canal 060), KESS v2/KTAG (Bootmode TriCore TC1766 com resistor 1kΩ no pino BOOT), WinOLS (Edição de mapas 16-bit).

*Dica de Segurança:* Sempre utilize fonte estabilizada de 13.8V 30A ao efetuar leitura ou gravação de firmware no módulo ECU.`;
      } else if (q.includes('cabeçote') || q.includes('torque') || q.includes('motor') || q.includes('ea111')) {
        responseText = `### 🚗 Retorno Técnico — Domínio: Mecânica\n\nIdentifiquei esquemas de torque para o motor consultado.\n\n**Aperto Padrão de Cabeçote:**\n* **Fase 1:** 30 Nm estável.\n* **Fase 2:** Gire 90 graus.\n* **Fase 3:** Adicione mais 90 graus.\n\n*Nota Importante do OricIA:* Substitua os parafusos elásticos para evitar quebra no torque de tração final.`;
      } else if (q.includes('sonoff') || q.includes('tasmota') || q.includes('esp32') || q.includes('wifi') || q.includes('firmware')) {
        responseText = `### ⚡ Retorno Técnico — Domínio: Elétrica & IoT\n\nPara gravação estável do firmware alternativo (Tasmota/ESPHome) no microcontrolador:\n\n1. Conecte o adaptador FTDI de maneira segura, selecionando a chave seletora em **3.3V** (alimentação externa de 5V queima a GPIO do chip).\n2. Mantenha o botão GPIO0 pressionado ao plugar a USB para forçar o microcontrolador a inicializar no Bootloader de gravação.\n3. Monitore se há ruídos de onda na tensão de entrada. Adicione um capacitor de desacoplamento de 100uF entre VCC e GND para estabilizar o Wi-Fi.`;
      } else if (q.includes('docker') || q.includes('compose') || q.includes('memoria') || q.includes('code') || q.includes('cpu')) {
        responseText = `### 💻 Retorno Técnico — Domínio: TI & Programação\n\nNo ambiente de conteinerização, gargalos de memória em NodeJS/Java ocorrem por falta de limitação do orquestrador de contêineres.\n\n**Solução Recomendada no docker-compose.yml:**\n\`\`\`yaml\nservices:\n  app-servico:\n    image: node:18-alpine\n    deploy:\n      resources:\n        limits:\n          cpus: "1.5"\n          memory: 1024M\n    restart: unless-stopped\n\`\`\`\n*Ação adicional:* Use o parâmetro \`node --max-old-space-size=800\` para instruir a V8 Engine a rodar o Garbage Collector antes do limite de memória do contêiner estourar.`;
      } else if (q.includes('bomba') || q.includes('centrífuga') || q.includes('ksb') || q.includes('cavitação') || q.includes('eixo')) {
        responseText = `### 🛠️ Retorno Técnico — Domínio: Mecânica Industrial\n\nO desalinhamento radial ou axial em bombas centrífugas KSB acarreta fadiga destrutiva nos rolamentos e quebra do selo mecânico.\n\n**Protocolo de Manutenção:**\n1. Use relógio comparador duplo ou ferramenta laser alinhadora para reduzir a tolerância para menos de **0.05 mm**.\n2. Para mitigar a cavitação, verifique se a pressão de sucção (NPSH disponível) está acima da curva nominal requerida pela fábrica. Limpe os filtros de cesta de entrada de água.`;
      } else {
        responseText = `### 🔮 Inteligência de Rede — Solução OricIA Integrada\n\nIdentifiquei a consulta técnica: *"${question}"* no setor **${cur[`domain_${activeDomain}`] || activeDomain}**.\n\nCom base em varreduras na rede técnica mundial e documentações oficiais, recomendo:\n1. **Inspecione a fonte de alimentação / Conexões físicas**: 75% dos problemas intermitentes em campo decorrem de conectores oxidados ou fiação com mau contato.\n2. **Valide a conformidade das especificações**: Verifique o torque, a amperagem nominal ou a versão de código recomendada nas abas de manuais e fontes ingeridas.\n3. **Habilite logs analíticos**: Faça leituras estocásticas em tempo real para isolar o componente que está gerando a anomalia técnica.`;
      }

      setChatMessages(prev => [
        ...prev,
        { sender: 'oracle', text: responseText }
      ]);
      // Grow brain stats dynamically
      setBrainSynapses(prev => prev + 1200);
      setKnowledgeNodes(prev => prev + 1);
      setIsOracleTyping(false);
      setSuccessToast(lang === 'pt' ? "Solução gerada pelo OricIA!" : "Solution generated by OricIA!");
    }, 1200);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuestion.trim()) return;

    const userQ = customQuestion;
    setChatMessages(prev => [...prev, { sender: 'user', text: userQ }]);
    setCustomQuestion('');
    triggerRealOracleReply(userQ);
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fadeIn max-w-5xl mx-auto px-1 sm:px-0">
      
      {/* Dynamic Jumbotron Header */}
      <div className="bg-tech-cartao border border-tech-borda rounded-2xl p-4 sm:p-6 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-sapare-gold/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-sapare-gold/15 text-sapare-gold flex items-center justify-center border border-sapare-gold/30 shadow-lg shadow-sapare-gold/5 shrink-0">
              <Brain className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black tracking-widest text-sapare-gold uppercase bg-sapare-gold/10 px-2 py-0.5 rounded border border-sapare-gold/20">
                  ORÁCULO VIVO MULTIDOMÍNIO
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping" />
                <span className="text-[9px] text-green-500 font-bold uppercase">RAG Global & Ativo</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-tech-texto font-display flex items-center gap-2 mt-1">
                {cur.title}
              </h2>
            </div>
          </div>
          <p className="text-xs text-tech-secundario max-w-md md:text-right">
            {cur.desc}
          </p>
        </div>
      </div>

      {/* DOMAIN FOCUS SELECTOR */}
      <div className="bg-tech-cartao border border-tech-borda rounded-xl p-3 sm:p-4 shadow">
        <span className="text-[10px] font-black text-tech-secundario uppercase block mb-2.5 tracking-wider font-mono">
          {cur.domainLabel}
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {[
            { id: 'automotivo', label: cur.domain_automotivo, emoji: '🚗' },
            { id: 'eletrica_iot', label: cur.domain_eletrica_iot, emoji: '⚡' },
            { id: 'ti_codigo', label: cur.domain_ti_codigo, emoji: '💻' },
            { id: 'mecanica_geral', label: cur.domain_mecanica_geral, emoji: '🛠️' },
            { id: 'geral', label: cur.domain_geral, emoji: '🌐' }
          ].map(dom => (
            <button
              key={dom.id}
              onClick={() => {
                setActiveDomain(dom.id as any);
                setExpandedManual(null);
                setSuccessToast(lang === 'pt' ? `OricIA focado em: ${dom.label}` : `OricIA focus updated to: ${dom.label}`);
              }}
              className={`px-3 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 border cursor-pointer ${
                activeDomain === dom.id
                  ? 'bg-sapare-gold text-sapare-dark border-sapare-gold shadow-md font-black'
                  : 'bg-tech-fundo border-tech-borda text-tech-secundario hover:text-tech-texto hover:border-tech-borda/80'
              }`}
            >
              <span className="text-sm">{dom.emoji}</span>
              <span className="truncate">{dom.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* BRAIN TELEMETRY HUD */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="bg-tech-cartao border border-tech-borda p-4 rounded-xl flex items-center gap-3">
          <div className="p-2 bg-sapare-gold/10 text-sapare-gold rounded-lg border border-sapare-gold/20">
            <Zap className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] text-tech-secundario uppercase block font-mono">{cur.synapses}</span>
            <span className="text-lg font-black text-tech-texto font-mono">{brainSynapses.toLocaleString()}</span>
          </div>
        </div>

        <div className="bg-tech-cartao border border-tech-borda p-4 rounded-xl flex items-center gap-3">
          <div className="p-2 bg-sapare-teal/10 text-sapare-teal rounded-lg border border-sapare-teal/20">
            <Network className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-tech-secundario uppercase block font-mono">{cur.nodes}</span>
            <span className="text-lg font-black text-tech-texto font-mono">{knowledgeNodes.toLocaleString()}</span>
          </div>
        </div>

        <div className="bg-tech-cartao border border-tech-borda p-4 rounded-xl flex items-center gap-3">
          <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg border border-purple-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-tech-secundario uppercase block font-mono">{cur.solutions}</span>
            <span className="text-lg font-black text-tech-texto font-mono">{solutionsCreated}</span>
          </div>
        </div>

        <div className="bg-tech-cartao border border-tech-borda p-4 rounded-xl flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20">
            <Globe className="w-5 h-5" />
          </div>
          <div className="overflow-hidden">
            <span className="text-[10px] text-tech-secundario uppercase block font-mono">{cur.ingested}</span>
            <span className="text-xs font-bold text-tech-texto block truncate font-mono">{ingestedSources.length} fontes ativas</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: AI Terminal Chat */}
        <div className="lg:col-span-2 flex flex-col bg-tech-cartao border border-tech-borda rounded-2xl p-5 shadow-lg h-[640px]">
          <div className="flex items-center justify-between border-b border-tech-borda pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-sapare-gold animate-pulse" />
              <span className="text-xs font-black text-tech-texto uppercase tracking-wide">
                Terminal de Soluções — {cur[`domain_${activeDomain}`]}
              </span>
            </div>
            <span className="text-[10px] font-mono text-tech-secundario">Status: Vivo & Aprendendo</span>
          </div>

          {/* Quick presets queries adapt to domain! */}
          <div className="mb-4">
            <span className="text-[9px] font-black text-tech-secundario uppercase block mb-1.5 tracking-wider">
              {cur.presetsTitle}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {domainPresets[activeDomain]?.map((preset, i) => (
                <button 
                  key={i}
                  onClick={() => {
                    setChatMessages(prev => [...prev, { sender: 'user', text: preset.q }]);
                    triggerOracleReply(preset.q);
                  }}
                  className="text-[10px] bg-tech-fundo hover:bg-tech-borda text-tech-texto px-2.5 py-1 rounded-lg border border-tech-borda transition font-bold cursor-pointer"
                >
                  💡 {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Messages display */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4 border border-tech-borda bg-sapare-dark rounded-xl p-4 font-mono text-xs">
            {chatMessages.map((msg, idx) => {
              const isOracle = msg.sender === 'oracle';
              return (
                <div key={idx} className={`flex ${isOracle ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[85%] rounded-2xl p-3.5 border ${
                    isOracle 
                      ? 'bg-tech-cartao/40 border-tech-borda text-tech-texto' 
                      : 'bg-sapare-gold/10 border-sapare-gold/35 text-sapare-gold'
                  }`}>
                    <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase text-tech-secundario mb-1">
                      {isOracle ? (
                        <>
                          <Brain className="w-3 h-3 text-sapare-gold" />
                          <span>ORICIA ORACLE</span>
                        </>
                      ) : (
                        <>
                          <Users className="w-3 h-3 text-sapare-gold" />
                          <span>USUÁRIO OPERADOR</span>
                        </>
                      )}
                    </div>
                    <div className="whitespace-pre-line leading-relaxed text-[11px]">
                      {msg.text}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {isOracleTyping && (
              <div className="flex justify-start">
                <div className="bg-tech-cartao/40 border border-tech-borda rounded-2xl p-3 text-tech-secundario flex items-center gap-2">
                  <Cpu className="w-3.5 h-3.5 text-sapare-gold animate-spin" />
                  <span className="text-[10px] animate-pulse">Oráculo consultando fontes de rede e computando probabilidades...</span>
                </div>
              </div>
            )}
          </div>

          {/* Input block */}
          <form onSubmit={handleSendChat} className="flex gap-2">
            <input 
              type="text"
              value={customQuestion}
              onChange={(e) => setCustomQuestion(e.target.value)}
              placeholder="Digite sua dúvida ou descreva a falha técnica para o Oráculo..."
              className="flex-1 bg-sapare-dark border border-tech-borda rounded-xl p-3 text-xs text-tech-texto font-mono focus:outline-none focus:border-sapare-gold/60"
            />
            <button 
              type="submit"
              className="bg-sapare-gold hover:scale-102 transition text-sapare-dark text-xs font-black px-4 rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              Consultar
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Right column: Web Crawler & Solutions Creator */}
        <div className="space-y-6">
          
          {/* WEB CRAWLER INGESTION PANEL */}
          <div className="bg-tech-cartao border border-tech-borda rounded-2xl p-5 shadow-lg space-y-4">
            <div>
              <h3 className="text-xs font-black text-tech-texto uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-sapare-gold" />
                {cur.crawlerTitle}
              </h3>
              <p className="text-[10px] text-tech-secundario mt-1">
                {cur.crawlerDesc}
              </p>
            </div>

            <form onSubmit={handleWebCrawl} className="space-y-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-tech-secundario absolute left-3 top-3" />
                <input 
                  type="text"
                  placeholder={cur.crawlerPlaceholder}
                  value={crawlerUrl}
                  onChange={(e) => setCrawlerUrl(e.target.value)}
                  disabled={isCrawling}
                  className="w-full pl-9 pr-3 py-2.5 bg-sapare-dark border border-tech-borda rounded-xl text-xs text-tech-texto focus:outline-none focus:border-sapare-gold"
                />
              </div>
              <button
                type="submit"
                disabled={isCrawling || !crawlerUrl.trim()}
                className="w-full bg-sapare-dark hover:bg-tech-borda text-tech-texto text-xs font-black py-2.5 rounded-xl border border-tech-borda transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isCrawling ? (
                  <>
                    <Cpu className="w-4 h-4 animate-spin text-sapare-gold" />
                    Buscando na Rede...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 text-sapare-gold" />
                    {cur.crawlerBtn}
                  </>
                )}
              </button>
            </form>

            {/* Simulated Crawler logs rendering */}
            {crawlerLogs.length > 0 && (
              <div className="bg-sapare-dark border border-tech-borda rounded-xl p-3 max-h-[140px] overflow-y-auto space-y-1.5 text-[9px] font-mono">
                {crawlerLogs.map((log, idx) => (
                  <div key={idx} className={idx === crawlerLogs.length - 1 && isCrawling ? "text-sapare-gold animate-pulse" : "text-tech-secundario"}>
                    {log}
                  </div>
                ))}
              </div>
            )}

            {/* Ingested Sources list */}
            <div className="space-y-1.5 pt-2 border-t border-tech-borda/40">
              <span className="text-[9px] font-black text-tech-secundario uppercase block tracking-wider font-mono">Últimas Fontes Ingeridas:</span>
              <div className="flex flex-wrap gap-1">
                {ingestedSources.slice(-4).map((src, idx) => (
                  <span key={idx} className="text-[9px] bg-sapare-dark border border-tech-borda px-2 py-0.5 rounded text-tech-texto font-mono">
                    🌐 {src}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* REAL TIME SOLUTION SYNTHESIZER */}
          <div className="bg-tech-cartao border border-tech-borda rounded-2xl p-5 shadow-lg space-y-4">
            <div>
              <h3 className="text-xs font-black text-tech-texto uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-sapare-gold" />
                {cur.synthTitle}
              </h3>
              <p className="text-[10px] text-tech-secundario mt-1">
                {cur.synthDesc}
              </p>
            </div>

            <form onSubmit={handleRealSynthesizeSolution} className="space-y-3">
              <textarea 
                placeholder={cur.synthPlaceholder}
                value={problemInput}
                onChange={(e) => setProblemInput(e.target.value)}
                rows={3}
                disabled={isSynthesizing}
                className="w-full p-3 bg-sapare-dark border border-tech-borda rounded-xl text-xs text-tech-texto focus:outline-none focus:border-sapare-gold resize-none"
              />
              <button
                type="submit"
                disabled={isSynthesizing || !problemInput.trim()}
                className="w-full bg-gradient-to-r from-sapare-teal via-sapare-gold to-sapare-violet2 text-sapare-dark text-xs font-black py-2.5 rounded-xl transition hover:scale-101 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSynthesizing ? (
                  <>
                    <Brain className="w-4 h-4 animate-spin" />
                    Processando Algoritmo...
                  </>
                ) : (
                  <>
                    <Cpu className="w-4 h-4" />
                    {cur.synthBtn}
                  </>
                )}
              </button>
            </form>

            {/* Solutions results card */}
            {synthesizedSolution && (
              <div className="bg-sapare-dark/80 border-2 border-sapare-gold/40 rounded-xl p-4 space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-tech-borda pb-1.5">
                  <span className="text-[10px] text-sapare-gold font-black uppercase font-mono tracking-wider flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5" /> {cur.synthResultTitle}
                  </span>
                  <span className="text-[9px] text-tech-secundario font-mono">{synthesizedSolution.timestamp}</span>
                </div>

                <div className="space-y-2">
                  <span className="text-[9px] text-tech-secundario uppercase block font-mono">Probabilidade Estocástica de Causas:</span>
                  <div className="space-y-1.5 text-[10px]">
                    {synthesizedSolution.probabilities.map((prob, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between font-mono">
                          <span className="text-tech-texto truncate max-w-[80%]">{prob.name}</span>
                          <span className="text-sapare-gold font-bold">{prob.val}%</span>
                        </div>
                        <div className="w-full h-1 bg-tech-fundo rounded">
                          <div className="h-full bg-sapare-gold rounded" style={{ width: `${prob.val}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-1 pt-2 border-t border-tech-borda/40">
                  <span className="text-[9px] text-tech-secundario uppercase block font-mono">Esquema Técnico / Plano de Ação:</span>
                  <div className="space-y-1 text-[10px] font-mono text-tech-texto/90 bg-tech-cartao p-2.5 rounded border border-tech-borda">
                    {synthesizedSolution.steps.map((st, i) => (
                      <div key={i}>{st}</div>
                    ))}
                  </div>
                </div>

                {/* Integration Actions buttons */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button 
                    onClick={handleExportOficia}
                    className="flex items-center justify-center gap-1 bg-tech-cartao hover:bg-tech-borda text-[9px] text-tech-texto py-2 rounded-lg border border-tech-borda transition font-bold cursor-pointer"
                  >
                    <Share2 className="w-3 h-3 text-sapare-teal" />
                    {cur.synthExportOficia}
                  </button>
                  <button 
                    onClick={handleExportPredicia}
                    className="flex items-center justify-center gap-1 bg-tech-cartao hover:bg-tech-borda text-[9px] text-tech-texto py-2 rounded-lg border border-tech-borda transition font-bold cursor-pointer"
                  >
                    <Plus className="w-3 h-3 text-sapare-violet2" />
                    {cur.synthExportPredicia}
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* DASHBOARD & CLUSTER WARNING LIGHTS / CODES DECODER (VEHICLE SPECIFIC) */}
      <div className="bg-tech-cartao border border-tech-borda rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-tech-borda pb-2">
          <div>
            <h3 className="text-xs font-black text-tech-texto uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 animate-pulse" />
              Decodificador de Luzes de Painel & Códigos de Informação de Veículos
            </h3>
            <p className="text-[10px] text-tech-secundario mt-0.5">
              Identificação instantânea de símbolos de aviso no display do painel de instrumentos (Code 89, Code 82, EPC, MIL, InSP, etc.)
            </p>
          </div>
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-tech-secundario absolute left-3 top-2.5" />
            <input 
              type="text"
              placeholder="Buscar código ou símbolo (ex: Code 89, EPC, 🛢️)..."
              value={selectedDashboardFilter}
              onChange={(e) => setSelectedDashboardFilter(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-sapare-dark border border-tech-borda rounded-xl text-[11px] text-tech-texto focus:outline-none focus:border-sapare-gold"
            />
          </div>
        </div>

        {/* Preset Code Chips for Quick Click */}
        <div className="flex flex-wrap gap-2">
          {DASHBOARD_CODES
            .filter(c => 
              !selectedDashboardFilter || 
              c.code.toLowerCase().includes(selectedDashboardFilter.toLowerCase()) || 
              c.title.toLowerCase().includes(selectedDashboardFilter.toLowerCase()) ||
              c.make.toLowerCase().includes(selectedDashboardFilter.toLowerCase())
            )
            .map((item, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setActiveClusterCode(activeClusterCode?.code === item.code ? null : item);
                  setSuccessToast(`Código do Painel selecionado: ${item.code}`);
                }}
                className={`px-3 py-2 rounded-xl text-xs font-mono font-bold border transition flex items-center gap-2 cursor-pointer ${
                  activeClusterCode?.code === item.code
                    ? 'bg-sapare-gold text-sapare-dark border-sapare-gold shadow-md'
                    : item.severity.includes('CRÍTICA')
                    ? 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20'
                    : item.color === 'amber'
                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
                    : 'bg-sapare-dark text-tech-texto border-tech-borda hover:border-sapare-gold/50'
                }`}
              >
                <span>{item.code}</span>
                <span className="text-[9px] opacity-75 font-sans">({item.make.split('/')[0]})</span>
              </button>
            ))}
        </div>

        {/* Selected Dashboard Code Analysis Box */}
        {activeClusterCode && (
          <div className="bg-sapare-dark/90 border-2 border-sapare-gold/40 rounded-xl p-4 space-y-3 animate-fadeIn font-mono text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-tech-borda pb-2">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                  activeClusterCode.severity.includes('CRÍTICA')
                    ? 'bg-red-500 text-white'
                    : 'bg-sapare-gold/20 text-sapare-gold border border-sapare-gold/30'
                }`}>
                  {activeClusterCode.severity}
                </span>
                <h4 className="text-sm font-bold text-tech-texto">{activeClusterCode.title}</h4>
              </div>
              <span className="text-[10px] text-sapare-teal font-bold">{activeClusterCode.make}</span>
            </div>

            <div className="space-y-2">
              <div>
                <span className="text-[9px] text-tech-secundario uppercase block font-bold">Significado & Causa Principal:</span>
                <p className="text-tech-texto/90 text-[11px] bg-tech-cartao p-2.5 rounded border border-tech-borda mt-1 leading-relaxed">
                  {activeClusterCode.meaning}
                </p>
              </div>

              <div>
                <span className="text-[9px] text-tech-secundario uppercase block font-bold">Ação Recomendada pelo Oráculo OricIA:</span>
                <p className="text-sapare-gold text-[11px] bg-sapare-gold/10 p-2.5 rounded border border-sapare-gold/30 mt-1 leading-relaxed">
                  {activeClusterCode.action}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={() => {
                  setProblemInput(`Como diagnosticar e resolver ${activeClusterCode.title} no veículo ${activeClusterCode.make}?`);
                  setSuccessToast("Pergunta transferida para o Sintetizador de Soluções!");
                }}
                className="bg-sapare-gold hover:scale-102 transition text-sapare-dark text-[10px] font-black px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer"
              >
                <Brain className="w-3.5 h-3.5" />
                Sintetizar Solução Completa
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MANUALS INGESTED ACCORDION */}
      <div className="bg-tech-cartao border border-tech-borda rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-tech-borda pb-2">
          <h3 className="text-xs font-black text-tech-texto uppercase tracking-wider flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-sapare-gold" />
            {cur.manualsTitle} (Foco: {cur[`domain_${activeDomain}`]})
          </h3>
          <span className="text-[10px] bg-sapare-gold/10 text-sapare-gold font-bold px-2 py-0.5 rounded border border-sapare-gold/25">
            {currentManuals.length} Fichas
          </span>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-tech-secundario absolute left-3 top-3" />
          <input 
            type="text"
            placeholder="Filtrar base de dados do foco atual..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-sapare-dark border border-tech-borda rounded-xl text-xs text-tech-texto focus:outline-none focus:border-sapare-gold"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentManuals
            .filter(m => m.title.toLowerCase().includes(searchQuery.toLowerCase()) || m.category.toLowerCase().includes(searchQuery.toLowerCase()))
            .map(man => {
              const isSelected = expandedManual === man.id;
              return (
                <div key={man.id} className="bg-sapare-dark/40 border border-tech-borda rounded-xl p-3.5 transition hover:border-tech-borda/80">
                  <div 
                    onClick={() => setExpandedManual(isSelected ? null : man.id)}
                    className="flex justify-between items-center cursor-pointer"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-tech-texto flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-sapare-gold" />
                        {man.title}
                      </h4>
                      <span className="text-[9px] text-sapare-gold font-mono ml-3.5">{man.category}</span>
                    </div>
                    {isSelected ? <ChevronUp className="w-3.5 h-3.5 text-tech-secundario" /> : <ChevronDown className="w-3.5 h-3.5 text-tech-secundario" />}
                  </div>

                  {isSelected && (
                    <div className="mt-3 pt-3 border-t border-tech-borda/40 space-y-3 text-[10px] font-mono">
                      <div className="space-y-1">
                        <span className="text-[9px] text-tech-secundario uppercase font-bold block">Esquemas & Valores Nominais:</span>
                        {man.details.map((d, i) => (
                          <div key={i} className="flex justify-between border-b border-tech-borda/20 pb-0.5">
                            <span className="text-tech-texto">{d.item}:</span>
                            <span className="text-sapare-gold font-bold">{d.val}</span>
                          </div>
                        ))}
                      </div>
                      <div>
                        <span className="text-[9px] text-tech-secundario uppercase font-bold block">Laudo de Engenharia Predic:</span>
                        <p className="text-tech-texto/80 mt-1 leading-relaxed bg-tech-cartao p-2 rounded border border-tech-borda">
                          {man.notes}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </div>

      {/* SHARED TRINDIA NETWORK */}
      <div className="bg-tech-cartao border border-tech-borda rounded-2xl p-5 shadow-lg space-y-4">
        <h3 className="text-xs font-black text-tech-texto uppercase tracking-wider flex items-center gap-1.5 border-b border-tech-borda pb-2">
          <Compass className="w-4 h-4 text-sapare-gold" />
          {cur.integrationTitle}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          <div className="bg-sapare-dark border border-tech-borda rounded-xl p-3 space-y-2">
            <span className="text-[9px] font-black text-sapare-teal uppercase block tracking-wider">OFICIA™ SYNC STATUS</span>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-tech-secundario">Status de Carga:</span>
              <span className="text-tech-sucesso font-bold">ONLINE & INTEGRADO</span>
            </div>
            <p className="text-[10px] text-tech-secundario">Permite que soluções geradas virem ordens de serviço certificadas instantaneamente.</p>
          </div>

          <div className="bg-sapare-dark border border-tech-borda rounded-xl p-3 space-y-2">
            <span className="text-[9px] font-black text-sapare-violet2 uppercase block tracking-wider">PREDICIA™ SYNC STATUS</span>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-tech-secundario">Status de Feedback:</span>
              <span className="text-tech-sucesso font-bold">MONTE CARLO FEED</span>
            </div>
            <p className="text-[10px] text-tech-secundario">Sincroniza datas e estimativas de manutenção preventiva com a agenda do usuário.</p>
          </div>

          <div className="bg-sapare-dark border border-tech-borda rounded-xl p-3 space-y-2">
            <span className="text-[9px] font-black text-sapare-gold uppercase block tracking-wider">GLOBAL CLOUD CRAWLER FEED</span>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-tech-secundario">Status de Crawler:</span>
              <span className="text-sapare-gold font-bold">LEARNING ENGAGED</span>
            </div>
            <p className="text-[10px] text-tech-secundario">OricIA consulta a web mundial dinamicamente para aumentar seu escopo de conhecimento.</p>
          </div>
        </div>
      </div>

    </div>
  );
}
