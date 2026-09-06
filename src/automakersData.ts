// =========================================================================
// AUTOMAKERS, FLEET VEHICLES & EV ALTERNATIVE DIAGNOSTIC KNOWLEDGE (BRAZIL)
// =========================================================================

export interface VehicleModelInfo {
  name: string;
  category: 'EV' | 'HYBRID' | 'FLEX' | 'DIESEL';
  isFleetPopular?: boolean; // Usado massivamente por Localiza, Movida, Unidas, Kovi
  systemType?: string;
  voltage?: string; // e.g. "400V DC", "800V DC", "12V/48V"
  diagnosticProtocol?: string; // "DoIP / Ethernet ISO 13400", "CAN-FD UDS", "OBD2 / K-Line"
  sgwLocked?: boolean;
  onboardServiceMenu?: string;
}

export interface AutomakerData {
  id: string;
  name: string;
  country: string;
  wmiPrefixes: string[]; // World Manufacturer Identifier (ex: 9BG, 9BW, LGX, YV1)
  evSupported: boolean;
  fleetFavorite: boolean;
  models: VehicleModelInfo[];
  evAlternativeGuide?: {
    screenMenuProcedure: string;
    doipInstructions: string;
    insulationSpecs: string;
    emergencyResetProcedure: string;
  };
}

export const BRAZIL_AUTOMAKERS: AutomakerData[] = [
  {
    id: "byd",
    name: "BYD (Build Your Dreams)",
    country: "China / Brasil (Camaçari)",
    wmiPrefixes: ["LGX", "LC0", "9BY"],
    evSupported: true,
    fleetFavorite: true,
    models: [
      { name: "Dolphin EV (44.9 kWh)", category: "EV", isFleetPopular: true, systemType: "e-Platform 3.0 Blade Battery LFP", voltage: "332V DC", diagnosticProtocol: "DoIP / CAN-FD UDS", sgwLocked: true },
      { name: "Dolphin Mini / Seagull (38 kWh)", category: "EV", isFleetPopular: true, systemType: "Blade Battery LFP / Motor 75cv", voltage: "307V DC", diagnosticProtocol: "DoIP / CAN-FD UDS", sgwLocked: true },
      { name: "Yuan Plus EV (60.48 kWh)", category: "EV", isFleetPopular: true, systemType: "e-Platform 3.0 / Inversor SiC", voltage: "403V DC", diagnosticProtocol: "DoIP / CAN-FD UDS", sgwLocked: true },
      { name: "Seal EV AWD (82.5 kWh - 531cv)", category: "EV", isFleetPopular: false, systemType: "CTB (Cell-to-Body) iTAC", voltage: "550V DC", diagnosticProtocol: "DoIP / CAN-FD UDS", sgwLocked: true },
      { name: "Song Plus DM-i Plug-in Hybrid", category: "HYBRID", isFleetPopular: true, systemType: "DM-i Super Hybrid 1.5L + EHS", voltage: "350V DC", diagnosticProtocol: "CAN-FD UDS / DoIP", sgwLocked: true },
      { name: "Song Pro DM-i Plug-in Hybrid", category: "HYBRID", isFleetPopular: true, systemType: "DM-i 1.5L + Blade Battery", voltage: "350V DC", diagnosticProtocol: "CAN-FD UDS / DoIP", sgwLocked: true },
      { name: "King DM-i Sedan Híbrido", category: "HYBRID", isFleetPopular: true, systemType: "DM-i 1.5L Flex/Gasolina", voltage: "350V DC", diagnosticProtocol: "CAN-FD UDS", sgwLocked: true },
      { name: "Shark PHEV Pick-up Híbrida", category: "HYBRID", isFleetPopular: false, systemType: "DMO Super Hybrid AWD", voltage: "400V DC", diagnosticProtocol: "DoIP / CAN-FD UDS", sgwLocked: true }
    ],
    evAlternativeGuide: {
      screenMenuProcedure: "MENU DE SERVIÇO BYD DILINK: 1. Na tela central multimídia DiLink, acerte o volume para 0. 2. Abra o aplicativo 'Telefone / Discador' e digite *#*#83789#*#* (ou *#8888# conforme a versão do software). 3. O modo de engenharia BYD abrirá exibindo: Tensão de cada célula da bateria Blade (Delta V max tolerado: 15mV), Temperatura dos 8 módulos NTC, Resistência de isolamento em kΩ e Estado de Saúde (SOH).",
      doipInstructions: "CONEXÃO ALTERNATIVA DoIP (ISO 13400): Conectar adaptador VCI com suporte a Ethernet DoIP nos pinos 3 (RX+) e 11 (RX-), 12 (TX+) e 13 (TX-) da porta OBD2. Utilizar IP estático 192.168.1.x para acessar a VCU sem bloqueio pelo gateway tradicional.",
      insulationSpecs: "ISOLAMENTO ELÉTRICO: Mínimo 500 kΩ (0.5 MΩ) sob teste de 500V DC entre terminais da bateria de tração e aterramento da carroceria. Abaixo de 100 kΩ o relé de contatores não arma.",
      emergencyResetProcedure: "RESET DE EMERGÊNCIA BYD: 1. Desconectar o cabo negativo da bateria auxiliar de 12V (ou lítio 13.8V). 2. Remover a tampa do Manual Service Disconnect (MSD / Plugue Laranja) sob o banco traseiro/porta-malas com luva isolante 1000V. 3. Aguardar 10 minutos para descarga dos capacitores do inversor. 4. Reconectar MSD e depois a bateria 12V. Dar a partida no botão Start/Stop segurando por 5 segundos."
    }
  },
  {
    id: "gwm",
    name: "GWM (Great Wall Motor)",
    country: "China / Brasil (Iracemápolis)",
    wmiPrefixes: ["LGB", "LGW", "9GW"],
    evSupported: true,
    fleetFavorite: true,
    models: [
      { name: "Ora 03 Skin / GT (48 kWh e 63 kWh)", category: "EV", isFleetPopular: true, systemType: "L.E.M.O.N. Platform EV", voltage: "380V DC", diagnosticProtocol: "DoIP / CAN-FD UDS", sgwLocked: true },
      { name: "Haval H6 HEV2 Híbrido", category: "HYBRID", isFleetPopular: true, systemType: "1.5 Turbo + DHT Híbrido 243cv", voltage: "350V DC", diagnosticProtocol: "CAN-FD UDS", sgwLocked: true },
      { name: "Haval H6 PHEV34 Plug-in (34 kWh)", category: "HYBRID", isFleetPopular: true, systemType: "1.5 Turbo + 2 Motores Elétricos AWD 393cv", voltage: "380V DC", diagnosticProtocol: "CAN-FD UDS / DoIP", sgwLocked: true },
      { name: "Haval H6 GT PHEV", category: "HYBRID", isFleetPopular: true, systemType: "PHEV 393cv AWD Coupe", voltage: "380V DC", diagnosticProtocol: "CAN-FD UDS / DoIP", sgwLocked: true },
      { name: "Tank 300 Híbrido 4x4", category: "HYBRID", isFleetPopular: false, systemType: "2.0 Turbo + Motor Elétrico 348cv", voltage: "350V DC", diagnosticProtocol: "CAN-FD UDS", sgwLocked: true }
    ],
    evAlternativeGuide: {
      screenMenuProcedure: "MENU DE ENGENHARIA GWM: 1. Na tela multimídia central, toque em 'Configurações do Veículo' > 'Sobre o Sistema'. 2. Toque 5 vezes rapidamente na imagem do veículo ou no número da versão do MCU. 3. Insira o código PIN de engenharia '1988' ou '8888'. 4. Acesse a aba 'HV Battery & Inverter Data' para leitura de tensão de células, corrente de carga e falhas ativas de isolamento.",
      doipInstructions: "DESBLOQUEIO SGW GWM: Scanners universais falham pela trava do Security Gateway (SGW). Utilizar ponte de bypass conectada diretamente no barramento CAN de tração (fios Trançados Azul/Branco no módulo VCU atrás do porta-luvas) ou VCI compatível com protocolo UDS CAN-FD.",
      insulationSpecs: "ISOLAMENTO NOMINAL: > 1.0 MΩ medido a 500V DC. Intertravamento HVIL deve apresentar continuidade (< 2 Ohms) em todo o circuito fechado.",
      emergencyResetProcedure: "RESET MODO TARTARUGA GWM: 1. Desligar o veículo e travar as portas por 15 minutos (Sleep Mode das ECUs). 2. Se a falha persistir, desconectar o polo negativo 12V por 5 minutos. 3. Ligar o botão Start/Stop sem pressionar o freio, aguardar 10s e depois pisar no freio e pressionar Start para entrar em modo READY."
    }
  },
  {
    id: "fiat",
    name: "Fiat (Stellantis)",
    country: "Brasil (Betim / Goiana)",
    wmiPrefixes: ["9BD", "ZFA"],
    evSupported: true,
    fleetFavorite: true,
    models: [
      { name: "Mobi 1.0 Firefly / Like / Trekking", category: "FLEX", isFleetPopular: true, systemType: "1.0 Firefly 3 Cilindros / Fire", diagnosticProtocol: "OBD2 / CAN", sgwLocked: false },
      { name: "Argo 1.0 / 1.3 Drive / Trekking", category: "FLEX", isFleetPopular: true, systemType: "Firefly 1.0 / 1.3 GSE", diagnosticProtocol: "OBD2 / CAN", sgwLocked: true },
      { name: "Cronos 1.0 / 1.3 Drive / Precision", category: "FLEX", isFleetPopular: true, systemType: "Firefly 1.0 / 1.3 GSE", diagnosticProtocol: "OBD2 / CAN", sgwLocked: true },
      { name: "Pulse 1.3 / 1.0 Turbo 200 / Hybrid", category: "FLEX", isFleetPopular: true, systemType: "Turbo 200 Flex / Bio-Hybrid 12V", diagnosticProtocol: "CAN-FD / UDS", sgwLocked: true },
      { name: "Fastback 1.0 Turbo / 1.3 Turbo Abarth", category: "FLEX", isFleetPopular: true, systemType: "Turbo 200 / Turbo 270 GSE", diagnosticProtocol: "CAN-FD / UDS", sgwLocked: true },
      { name: "Strada 1.3 / 1.0 Turbo (Endurance/Freedom/Volcano)", category: "FLEX", isFleetPopular: true, systemType: "Firefly 1.3 / Turbo 200", diagnosticProtocol: "OBD2 / CAN", sgwLocked: true },
      { name: "Toro 1.3 Turbo / 2.0 Diesel 4x4", category: "FLEX", isFleetPopular: true, systemType: "Turbo 270 Flex / MultiJet II Diesel", diagnosticProtocol: "CAN UDS", sgwLocked: true },
      { name: "Fiorino 1.4 EVO", category: "FLEX", isFleetPopular: true, systemType: "1.4 EVO Flex", diagnosticProtocol: "OBD2", sgwLocked: false },
      { name: "Fiat 500e 100% Elétrico (42 kWh)", category: "EV", isFleetPopular: true, systemType: "Plataforma EV Stellantis / Motor 118cv", voltage: "400V DC", diagnosticProtocol: "DoIP / CAN-FD UDS", sgwLocked: true },
      { name: "Scudo / Ducato Furgão", category: "DIESEL", isFleetPopular: true, systemType: "1.5 / 2.2 Turbo Diesel BlueHDi", diagnosticProtocol: "CAN UDS", sgwLocked: true }
    ],
    evAlternativeGuide: {
      screenMenuProcedure: "DESBLOQUEIO SGW STELLANTIS: Nos modelos Fiat pós-2020 e 500e elétrico, a porta OBD2 possui trava de escrita SGW. Conectar cabo adaptador 12+8 pinos SGW Bypass diretamente no módulo BCM atrás da caixa de fusíveis interna.",
      doipInstructions: "Para o Fiat 500e: Diagnóstico do módulo BMS e inversor requer autenticação AutoAuth Stellantis ou VCI compatível com DoIP.",
      insulationSpecs: "Isolamento da bateria de tração: > 500 kΩ.",
      emergencyResetProcedure: "Reset de falha de alta tensão: Desconectar a chave de serviço de alta tensão no cofre do motor e a bateria 12V por 10 minutos."
    }
  },
  {
    id: "volkswagen",
    name: "Volkswagen",
    country: "Brasil (SBC / Taubaté / SJP)",
    wmiPrefixes: ["9BW", "WVW", "3VW"],
    evSupported: true,
    fleetFavorite: true,
    models: [
      { name: "Polo Track 1.0 MPI (Top Locadoras)", category: "FLEX", isFleetPopular: true, systemType: "1.0 3 Cilindros MPI EA211", diagnosticProtocol: "CAN UDS / OBD2", sgwLocked: false },
      { name: "Polo 1.0 TSI / Comfortline / Highline", category: "FLEX", isFleetPopular: true, systemType: "1.0 TSI 170 TSI / 200 TSI EA211", diagnosticProtocol: "CAN UDS / OBD2", sgwLocked: false },
      { name: "Virtus 1.0 TSI / Exclusive 1.4 TSI", category: "FLEX", isFleetPopular: true, systemType: "EA211 TSI 1.0 / 1.4", diagnosticProtocol: "CAN UDS / OBD2", sgwLocked: false },
      { name: "Nivus 1.0 TSI Comfortline / Highline", category: "FLEX", isFleetPopular: true, systemType: "1.0 200 TSI EA211", diagnosticProtocol: "CAN UDS", sgwLocked: false },
      { name: "T-Cross 1.0 TSI / 1.4 TSI 250 TSI", category: "FLEX", isFleetPopular: true, systemType: "Plataforma MQB-A0 / EA211", diagnosticProtocol: "CAN UDS", sgwLocked: false },
      { name: "Taos 1.4 250 TSI", category: "FLEX", isFleetPopular: true, systemType: "Plataforma MQB / EA211 1.4 TSI", diagnosticProtocol: "CAN UDS", sgwLocked: false },
      { name: "Saveiro 1.6 MSI Robust / Trendline", category: "FLEX", isFleetPopular: true, systemType: "1.6 16V EA211 MSI", diagnosticProtocol: "OBD2 / CAN", sgwLocked: false },
      { name: "Amarok 3.0 V6 TDI 4x4", category: "DIESEL", isFleetPopular: true, systemType: "3.0 V6 Turbo Diesel 258cv", diagnosticProtocol: "CAN UDS", sgwLocked: false },
      { name: "ID.4 100% Elétrico (77 kWh)", category: "EV", isFleetPopular: true, systemType: "Plataforma MEB / Motor Traseiro 204cv", voltage: "400V DC", diagnosticProtocol: "DoIP / Ethernet ISO 13400", sgwLocked: true },
      { name: "ID.Buzz (Pão de Forma Elétrica)", category: "EV", isFleetPopular: false, systemType: "Plataforma MEB 77 kWh", voltage: "400V DC", diagnosticProtocol: "DoIP / Ethernet ISO 13400", sgwLocked: true }
    ],
    evAlternativeGuide: {
      screenMenuProcedure: "AUTODIAGNÓSTICO VW MEB (ID.4 / ID.Buzz): No display digital de instrumentos, segurar o botão 'View' no volante por 15 segundos com a ignição ligada para acessar o menu de testes de sensores e temperatura dos 12 módulos de bateria.",
      doipInstructions: "Para veículos elétricos plataforma MEB: Scanners tradicionais K-Line/CAN não alcançam o módulo J840 (BMS) ou J533 (Gateway). Usar cabo DoIP Ethernet ou VCDS/ODIS com interface VNCI 6154A.",
      insulationSpecs: "Resistência de isolamento do barramento HV: > 500 kΩ medido pelo relé de vigilância de isolamento integrado no BMS.",
      emergencyResetProcedure: "Procedimento de desbloqueio pós-colisão: Desarmar o plugue verde de corte de emergência na caixa de fusíveis do cofre e resetar o módulo de controle de alta tensão J840."
    }
  },
  {
    id: "chevrolet",
    name: "Chevrolet (General Motors)",
    country: "Brasil (Gravataí / SJC / SCS)",
    wmiPrefixes: ["9BG", "1G1", "3G1"],
    evSupported: true,
    fleetFavorite: true,
    models: [
      { name: "Onix 1.0 / 1.0 Turbo (Top Locadoras)", category: "FLEX", isFleetPopular: true, systemType: "1.0 3 Cilindros CSS Prime Ecotec", diagnosticProtocol: "CAN UDS / OBD2", sgwLocked: false },
      { name: "Onix Plus Sedan 1.0 / 1.0 Turbo", category: "FLEX", isFleetPopular: true, systemType: "1.0 Turbo Ecotec", diagnosticProtocol: "CAN UDS / OBD2", sgwLocked: false },
      { name: "Tracker 1.0 Turbo / 1.2 Turbo Premier", category: "FLEX", isFleetPopular: true, systemType: "Plataforma GEM / CSS Prime", diagnosticProtocol: "CAN UDS", sgwLocked: false },
      { name: "Spin 1.8 / Premier (7 Lugares)", category: "FLEX", isFleetPopular: true, systemType: "1.8 SPE/4 Eco / BCM Global A", diagnosticProtocol: "CAN UDS", sgwLocked: false },
      { name: "Montana 1.2 Turbo", category: "FLEX", isFleetPopular: true, systemType: "1.2 Turbo 133cv Flex", diagnosticProtocol: "CAN UDS", sgwLocked: false },
      { name: "S10 2.8 Turbo Diesel 4x4", category: "DIESEL", isFleetPopular: true, systemType: "2.8 Duramax Diesel 207cv", diagnosticProtocol: "CAN UDS", sgwLocked: false },
      { name: "Bolt EV / Bolt EUV (66 kWh)", category: "EV", isFleetPopular: true, systemType: "Plataforma BEV2 / Bateria LG Chem", voltage: "350V DC", diagnosticProtocol: "GMLAN / CAN UDS / DoIP", sgwLocked: false },
      { name: "Blazer EV RS / Equinox EV (85-102 kWh)", category: "EV", isFleetPopular: false, systemType: "Plataforma Ultium / VIP Electrical Architecture", voltage: "400V DC / 800V", diagnosticProtocol: "DoIP / Ethernet ISO 13400 / CAN-FD", sgwLocked: true }
    ],
    evAlternativeGuide: {
      screenMenuProcedure: "MODO DE SERVIÇO GM BOLT / ULTIUM: 1. Na tela MyLink/Infotainment, pressionar os botões 'Home' e 'Volume Down' simultaneamente por 10 segundos para acessar o menu de diagnóstico de engenharia. 2. Acessar 'High Voltage Battery Diagnostics' para ler os 96 blocos de células e o status do contator de pré-carga.",
      doipInstructions: "Para veículos Ultium (Blazer EV / Equinox EV): A arquitetura VIP (Vehicle Intelligence Platform) bloqueia scanners universais antigos. Requer VCI compatível com DoIP e barramento CAN-FD de 2Mbps.",
      insulationSpecs: "Isolamento da bateria Ultium: > 500 kΩ. Detecção de isolamento realizada pelo módulo BPCM.",
      emergencyResetProcedure: "Reset de Bloqueio de Alta Tensão GM: Remover o fusível HVIL Manual Disconnect localizado sob o carpete do console central. Desconectar o cabo 12V por 10 minutos para resetar o código P0AA6 (Perda de Isolamento)."
    }
  },
  {
    id: "hyundai",
    name: "Hyundai",
    country: "Brasil (Piracicaba / Anápolis)",
    wmiPrefixes: ["9BH", "KMH"],
    evSupported: true,
    fleetFavorite: true,
    models: [
      { name: "HB20 1.0 Sense/Comfort/Platinum (Top Locadoras)", category: "FLEX", isFleetPopular: true, systemType: "1.0 Kappa 3 Cilindros / 1.0 TGDI Turbo", diagnosticProtocol: "OBD2 / CAN", sgwLocked: false },
      { name: "HB20S Sedan 1.0 / 1.0 TGDI", category: "FLEX", isFleetPopular: true, systemType: "1.0 TGDI Turbo Flex", diagnosticProtocol: "OBD2 / CAN", sgwLocked: false },
      { name: "Creta 1.0 TGDI / 2.0 Smart / N-Line", category: "FLEX", isFleetPopular: true, systemType: "1.0 Turbo GDI / 2.0 Smartstream", diagnosticProtocol: "CAN UDS", sgwLocked: false },
      { name: "Ioniq 5 EV (72.6 kWh - 800V)", category: "EV", isFleetPopular: false, systemType: "E-GMP (Electric Global Modular Platform)", voltage: "800V Ultra-Fast DC", diagnosticProtocol: "DoIP / CAN-FD UDS", sgwLocked: true },
      { name: "Ioniq Hybrid (Locadoras / Frotas)", category: "HYBRID", isFleetPopular: true, systemType: "1.6 GDI + Motor Elétrico 141cv", voltage: "240V DC", diagnosticProtocol: "CAN UDS", sgwLocked: false },
      { name: "Kona EV (64 kWh)", category: "EV", isFleetPopular: true, systemType: "Bateria NCM 64 kWh / 204cv", voltage: "356V DC", diagnosticProtocol: "CAN UDS / DoIP", sgwLocked: false }
    ],
    evAlternativeGuide: {
      screenMenuProcedure: "MENU DE TESTE HYUNDAI E-GMP: No painel digital, ligar a ignição em modo ON e pressionar o botão 'OK' do volante 5 vezes seguidas enquanto mantém a alavanca de seta puxada. O hodômetro exibirá o código de falha BMS detalhado e a resistência de isolamento.",
      doipInstructions: "Para Ioniq 5 e Kona EV: O módulo BMS (Battery Management System) opera na rede C-CAN / DoIP. Se o scanner não comunicar, verificar a alimentação de 12V no relé principal de alta tensão.",
      insulationSpecs: "Resistência de isolamento mínima aceita: 500 kΩ (com alarme em 100 kΩ).",
      emergencyResetProcedure: "Reset de Intertravamento: Remover o plugue amarelo de corte de alta tensão no cofre do motor antes de qualquer manutenção."
    }
  },
  {
    id: "toyota",
    name: "Toyota",
    country: "Brasil (Sorocaba / Indaiatuba)",
    wmiPrefixes: ["9BR", "JT1", "MR0"],
    evSupported: true,
    fleetFavorite: true,
    models: [
      { name: "Yaris Hatch / Sedan 1.5 Dual VVT-i", category: "FLEX", isFleetPopular: true, systemType: "1.5 16V 2NR-FBE Flex", diagnosticProtocol: "OBD2 / CAN", sgwLocked: false },
      { name: "Corolla 2.0 Dynamic Force (GLi/XEi/Altis)", category: "FLEX", isFleetPopular: true, systemType: "2.0 M20A-FKB Injeção Direta/Indireta", diagnosticProtocol: "CAN UDS", sgwLocked: false },
      { name: "Corolla Hybrid 1.8 Flex (Top Frotas)", category: "HYBRID", isFleetPopular: true, systemType: "THS II (Toyota Hybrid System) 1.8 Flex + 2 MG", voltage: "201.6V NiMH / Li-Ion", diagnosticProtocol: "CAN UDS", sgwLocked: false },
      { name: "Corolla Cross 2.0 Flex / Hybrid", category: "HYBRID", isFleetPopular: true, systemType: "Plataforma TNGA-C / Híbrido Flex", voltage: "207V DC", diagnosticProtocol: "CAN UDS", sgwLocked: false },
      { name: "Hilux 2.8 Turbo Diesel 4x4", category: "DIESEL", isFleetPopular: true, systemType: "2.8 1GD-FTV 204cv", diagnosticProtocol: "CAN UDS", sgwLocked: false },
      { name: "SW4 2.8 Diesel Diamond", category: "DIESEL", isFleetPopular: true, systemType: "2.8 1GD-FTV Turbo Diesel", diagnosticProtocol: "CAN UDS", sgwLocked: false },
      { name: "RAV4 Plug-in Hybrid AWD (18.1 kWh)", category: "HYBRID", isFleetPopular: false, systemType: "THS II PHEV 306cv AWD-i", voltage: "355V DC", diagnosticProtocol: "CAN-FD UDS / DoIP", sgwLocked: true },
      { name: "bZ4X 100% Elétrico (71.4 kWh)", category: "EV", isFleetPopular: false, systemType: "e-TNGA EV Platform", voltage: "355V DC", diagnosticProtocol: "DoIP / Ethernet ISO 13400", sgwLocked: true }
    ],
    evAlternativeGuide: {
      screenMenuProcedure: "MODO DE MANUTENÇÃO HÍBRIDO TOYOTA (Sem Scanner): 1. Ligar a ignição (dois toques no botão Start sem pisar no freio). 2. Pressionar o pedal do acelerador até o fundo 2 vezes em posição 'P'. 3. Mudar a alavanca para 'N' e pressionar o acelerador até o fundo 2 vezes. 4. Voltar para 'P' e pressionar o acelerador 2 vezes. 5. A mensagem 'MAINTENANCE MODE' piscará no painel. Pisar no freio e dar a partida no motor a combustão para teste contínuo sem desligar!",
      doipInstructions: "Para leitura avançada do inversor e baterias híbridas THS: Utilizar interface J2534 Pass-thru com software Toyota Techstream.",
      insulationSpecs: "Isolamento da bateria híbrida Toyota: > 1.0 MΩ. Código P0AA6 indica contaminação por umidade no duto do ventilador de arrefecimento da bateria sob o banco traseiro.",
      emergencyResetProcedure: "Reset do ventilador e bateria híbrida: Limpar o filtro da grade de ventilação sob o assento traseiro para evitar superaquecimento dos módulos de bateria."
    }
  },
  {
    id: "renault",
    name: "Renault",
    country: "Brasil (São José dos Pinhais)",
    wmiPrefixes: ["93Y", "9FB", "VF1"],
    evSupported: true,
    fleetFavorite: true,
    models: [
      { name: "Kwid 1.0 Zen / Intense / Outsider (Top Locadoras)", category: "FLEX", isFleetPopular: true, systemType: "1.0 3 Cilindros SCe", diagnosticProtocol: "OBD2 / CAN", sgwLocked: false },
      { name: "Kwid E-Tech 100% Elétrico (26.8 kWh)", category: "EV", isFleetPopular: true, systemType: "Plataforma CMF-A EV / Motor 65cv", voltage: "260V DC", diagnosticProtocol: "CAN UDS / DoIP", sgwLocked: true },
      { name: "Megane E-Tech EV (60 kWh - 220cv)", category: "EV", isFleetPopular: true, systemType: "Plataforma CMF-EV / Bateria 60 kWh", voltage: "400V DC", diagnosticProtocol: "DoIP / Ethernet ISO 13400", sgwLocked: true },
      { name: "Kardian 1.0 Turbo TCe / EDC", category: "FLEX", isFleetPopular: true, systemType: "Plataforma RGMP / 1.0 Turbo 125cv", diagnosticProtocol: "CAN-FD UDS", sgwLocked: true },
      { name: "Duster 1.6 SCe / 1.3 Turbo TCe", category: "FLEX", isFleetPopular: true, systemType: "1.6 SCe / 1.3 TCe 170cv Flex", diagnosticProtocol: "CAN UDS", sgwLocked: false },
      { name: "Oroch 1.6 / 1.3 Turbo Pick-up", category: "FLEX", isFleetPopular: true, systemType: "1.3 TCe Turbo Flex", diagnosticProtocol: "CAN UDS", sgwLocked: false },
      { name: "Master 2.3 dCi Furgão / Van", category: "DIESEL", isFleetPopular: true, systemType: "2.3 dCi Turbo Diesel", diagnosticProtocol: "CAN UDS", sgwLocked: false }
    ],
    evAlternativeGuide: {
      screenMenuProcedure: "AUTOTESTE KWID E-TECH & MEGANE E-TECH: 1. Com o cartão chave presente no console, segurar o botão Start/Stop por 10 segundos sem pisar no pedal de freio. 2. O painel entrará em 'Modo Diagnóstico de Oficina'. 3. O hodômetro exibirá o status do contator de alta tensão (HV Contactors) e o nível de isolamento de isolamento DC.",
      doipInstructions: "Desbloqueio do Gateway Renault: Veículos pós-2022 possuem o módulo Gateway SGW bloqueando portas OBD2 genéricas. Utilizar token Renault Clip / Pass-thru J2534 ou cabo de bypass no módulo UCH.",
      insulationSpecs: "Isolamento mínimo: 500 kΩ.",
      emergencyResetProcedure: "Reset de Trava de Bateria E-Tech: Desconectar o plugue vermelho de corte de alta tensão no porta-malas e efetuar ciclo de 5 minutos na bateria de 12V."
    }
  },
  {
    id: "volvo",
    name: "Volvo",
    country: "Suécia / Bélgica / China",
    wmiPrefixes: ["YV1", "YV4", "LVY"],
    evSupported: true,
    fleetFavorite: true,
    models: [
      { name: "EX30 EV Core / Plus / Ultra (51-69 kWh)", category: "EV", isFleetPopular: true, systemType: "Plataforma SEA (Sustainable Experience Architecture)", voltage: "400V DC", diagnosticProtocol: "DoIP / Ethernet ISO 13400", sgwLocked: true },
      { name: "XC40 Recharge / EX40 100% Elétrico", category: "EV", isFleetPopular: true, systemType: "Plataforma CMA EV / Bateria 78 kWh", voltage: "400V DC", diagnosticProtocol: "DoIP / Ethernet ISO 13400", sgwLocked: true },
      { name: "C40 Recharge 100% Elétrico", category: "EV", isFleetPopular: true, systemType: "CMA EV Dual Motor 408cv", voltage: "400V DC", diagnosticProtocol: "DoIP / Ethernet ISO 13400", sgwLocked: true },
      { name: "XC60 T8 Recharge Plug-in Hybrid (462cv)", category: "HYBRID", isFleetPopular: true, systemType: "Plataforma SPA / 2.0 Turbo + Motor Traseiro 145cv", voltage: "350V DC", diagnosticProtocol: "DoIP / Ethernet ISO 13400", sgwLocked: true }
    ],
    evAlternativeGuide: {
      screenMenuProcedure: "MENU DE MANUTENÇÃO VOLVO (Google Automotive OS): 1. Na tela central de 9/12 polegadas, ir em 'Configurações' > 'Sistema' > 'Informações'. 2. Tocar 7 vezes no número da compilação do software para ativar o 'Modo de Oficina Volvo'. 3. Permite leitura de temperatura da bateria de tração, teste de bombas de recirculação do líquido de arrefecimento e recalibração de sensores ADAS.",
      doipInstructions: "Para todos os veículos Volvo SPA/CMA/SEA: A porta OBD2 utiliza exclusivamente DoIP (Diagnostics over IP - Ethernet). Scanners OBD2 tradicionais baseados em K-Line ou CAN padrão não leem o veículo. Requer interface Volvo VIDA ou VCI compatível com DoIP nos pinos 3, 11, 12 e 13.",
      insulationSpecs: "Isolamento da bateria: > 1.0 MΩ a 1000V DC.",
      emergencyResetProcedure: "Desarme do circuito de alta tensão: Retirar o conector de corte pirotécnico sob a tampa plástica do porta-malas e aguardar 15 minutos para desenergização."
    }
  },
  {
    id: "peugeot_citroen",
    name: "Peugeot & Citroën (Stellantis)",
    country: "Brasil (Porto Real) / França",
    wmiPrefixes: ["936", "935", "VF3", "VF7"],
    evSupported: true,
    fleetFavorite: true,
    models: [
      { name: "Peugeot 208 1.0 / 1.0 Turbo Style / Allure", category: "FLEX", isFleetPopular: true, systemType: "Plataforma CMP / Firefly 1.0 & Turbo 200", diagnosticProtocol: "CAN UDS", sgwLocked: true },
      { name: "Peugeot e-208 GT 100% Elétrico (50 kWh)", category: "EV", isFleetPopular: true, systemType: "Plataforma e-CMP / Motor 136cv", voltage: "400V DC", diagnosticProtocol: "DoIP / CAN-FD UDS", sgwLocked: true },
      { name: "Peugeot e-2008 100% Elétrico (54 kWh)", category: "EV", isFleetPopular: true, systemType: "e-CMP2 / Motor 156cv", voltage: "400V DC", diagnosticProtocol: "DoIP / CAN-FD UDS", sgwLocked: true },
      { name: "Citroën C3 1.0 Live / Feel / First Edition", category: "FLEX", isFleetPopular: true, systemType: "Plataforma CMP / 1.0 Firefly", diagnosticProtocol: "OBD2 / CAN", sgwLocked: false },
      { name: "Citroën C3 Aircross 1.0 Turbo (7 Lugares)", category: "FLEX", isFleetPopular: true, systemType: "Plataforma CMP / Turbo 200 Flex", diagnosticProtocol: "CAN UDS", sgwLocked: true },
      { name: "Citroën C4 Cactus 1.6 / 1.6 THP Turbo", category: "FLEX", isFleetPopular: true, systemType: "1.6 16V EC5 / 1.6 THP 173cv", diagnosticProtocol: "CAN UDS", sgwLocked: false },
      { name: "Peugeot Expert / Citroën Jumpy Furgão", category: "DIESEL", isFleetPopular: true, systemType: "1.5 Turbo Diesel BlueHDi", diagnosticProtocol: "CAN UDS", sgwLocked: true }
    ],
    evAlternativeGuide: {
      screenMenuProcedure: "PROCEDIMENTO DE REINICIALIZAÇÃO BSI STELLANTIS: 1. Abrir o capô do motor e a janela do motorista. 2. Desligar a chave e aguardar 3 minutos para a BSI entrar em modo repouso. 3. Desconectar a bateria de 12V por 15 segundos e reconectar. 4. Aguardar 10 segundos, ligar a meia-luz e ligar a ignição mantendo o botão de travamento pressionado por 10s.",
      doipInstructions: "Para os modelos elétricos e-208 / e-2008: Conectar interface DiagBox com suporte a CAN-FD e DoIP para ler o calculador de tração elétrica (MCU) e o carregador embarcado OBC.",
      insulationSpecs: "Isolamento elétrico HV: > 500 kΩ.",
      emergencyResetProcedure: "Corte de Alta Tensão: Desconectar o conector de emergência laranja localizado no cofre do motor antes de manutenções elétricas."
    }
  },
  {
    id: "jeep",
    name: "Jeep (Stellantis)",
    country: "Brasil (Goiana, PE)",
    wmiPrefixes: ["988", "1C4"],
    evSupported: true,
    fleetFavorite: true,
    models: [
      { name: "Renegade 1.3 Turbo 270 (Top Locadoras)", category: "FLEX", isFleetPopular: true, systemType: "1.3 Turbo GSE T270 185cv", diagnosticProtocol: "CAN UDS", sgwLocked: true },
      { name: "Compass 1.3 Turbo / 2.0 TD350 Diesel / 2.0 Turbo Hurricane 4", category: "FLEX", isFleetPopular: true, systemType: "Turbo 270 / TD350 / Hurricane 272cv", diagnosticProtocol: "CAN UDS", sgwLocked: true },
      { name: "Commander 1.3 Turbo / 2.0 Diesel / Hurricane (7 Lugares)", category: "FLEX", isFleetPopular: true, systemType: "7 Lugares / GSE T270 / Hurricane 4", diagnosticProtocol: "CAN UDS", sgwLocked: true },
      { name: "Compass 4xe Híbrido Plug-in (240cv)", category: "HYBRID", isFleetPopular: false, systemType: "1.3 Turbo + Motor Traseiro Elétrico 60cv", voltage: "400V DC", diagnosticProtocol: "DoIP / CAN UDS", sgwLocked: true }
    ],
    evAlternativeGuide: {
      screenMenuProcedure: "DESBLOQUEIO SGW JEEP: Em todos os veículos Jeep pós-2018, a porta OBD2 padrão possui o Security Gateway bloqueando leitura e escrita de scanners universais. Conectar o cabo adaptador Bypass 12+8 pinos no módulo SGW localizado atrás do painel de instrumentos ou da caixa de fusíveis interna.",
      doipInstructions: "Para o Compass 4xe Híbrido: Comunicação com a bateria de alta tensão sob o túnel central requer protocolo DoIP.",
      insulationSpecs: "Resistência de isolamento mínima: 500 kΩ.",
      emergencyResetProcedure: "Reset de falha híbrida 4xe: Desconectar o cabo da bateria auxiliar de 12V no porta-malas por 10 minutos."
    }
  },
  {
    id: "nissan",
    name: "Nissan",
    country: "Brasil (Resende, RJ) / Japão",
    wmiPrefixes: ["94D", "JN1", "3N1"],
    evSupported: true,
    fleetFavorite: true,
    models: [
      { name: "Kicks 1.6 Flex Active / Sense / Exclusive", category: "FLEX", isFleetPopular: true, systemType: "1.6 16V HR16DE Flex", diagnosticProtocol: "OBD2 / CAN", sgwLocked: false },
      { name: "Versa 1.6 16V Sedan", category: "FLEX", isFleetPopular: true, systemType: "1.6 16V HR16DE Flex", diagnosticProtocol: "OBD2 / CAN", sgwLocked: false },
      { name: "Sentra 2.0 Injeção Direta", category: "FLEX", isFleetPopular: true, systemType: "2.0 MR20DD Injeção Direta", diagnosticProtocol: "CAN UDS", sgwLocked: false },
      { name: "Frontier 2.3 Bi-Turbo Diesel 4x4", category: "DIESEL", isFleetPopular: true, systemType: "2.3 YS23DDTi Bi-Turbo", diagnosticProtocol: "CAN UDS", sgwLocked: false },
      { name: "Leaf 100% Elétrico (40 kWh)", category: "EV", isFleetPopular: true, systemType: "Motor EM57 150cv / Bateria 40 kWh", voltage: "360V DC", diagnosticProtocol: "CAN UDS / Consult-III+", sgwLocked: false }
    ],
    evAlternativeGuide: {
      screenMenuProcedure: "AUTODIAGNÓSTICO NISSAN LEAF: 1. Ligar a ignição do Leaf sem pisar no freio (dois toques no botão Start). 2. No menu do painel de instrumentos, navegar até 'EV Settings' > 'Battery Info' para leitura direta da capacidade restante (12 barras de SOH), temperatura dos módulos e autonomia real estimada.",
      doipInstructions: "Para diagnóstico aprofundado do Leaf: Utilizar aplicativo 'LeafSpy Pro' conectado via adaptador OBD2 Bluetooth (com chip PIC18F25K80) para leitura de milivolts de cada uma das 96 células e histórico de cargas rápidas CHAdeMO.",
      insulationSpecs: "Isolamento da bateria de tração: > 500 kΩ.",
      emergencyResetProcedure: "Corte de Alta Tensão Leaf: Puxar a alavanca do conector de serviço de alta tensão (Service Plug) no assoalho atrás do console central."
    }
  },
  {
    id: "honda",
    name: "Honda",
    country: "Brasil (Itirapina, SP)",
    wmiPrefixes: ["93H", "JHM", "1HG"],
    evSupported: true,
    fleetFavorite: true,
    models: [
      { name: "City Hatchback 1.5 DOHC i-VTEC", category: "FLEX", isFleetPopular: true, systemType: "1.5 16V Injeção Direta Flex", diagnosticProtocol: "OBD2 / CAN", sgwLocked: false },
      { name: "City Sedan 1.5 DOHC i-VTEC", category: "FLEX", isFleetPopular: true, systemType: "1.5 Injeção Direta 126cv", diagnosticProtocol: "OBD2 / CAN", sgwLocked: false },
      { name: "HR-V 1.5 aspirado / 1.5 Turbo VTEC", category: "FLEX", isFleetPopular: true, systemType: "1.5 Flex / 1.5 Turbo 177cv", diagnosticProtocol: "CAN UDS", sgwLocked: false },
      { name: "Civic Híbrido e:HEV (Locadoras / Executivo)", category: "HYBRID", isFleetPopular: true, systemType: "2.0 e:HEV Ciclo Atkinson + 2 Motores Elétricos 184cv", voltage: "300V DC", diagnosticProtocol: "CAN UDS / DoIP", sgwLocked: true },
      { name: "CR-V Advanced Hybrid e:HEV AWD", category: "HYBRID", isFleetPopular: false, systemType: "2.0 e:HEV AWD", voltage: "300V DC", diagnosticProtocol: "CAN UDS / DoIP", sgwLocked: true }
    ],
    evAlternativeGuide: {
      screenMenuProcedure: "MENU DE DIAGNÓSTICO HONDA e:HEV: 1. Ligar a ignição. 2. Pressionar e segurar os botões 'Power', 'Menu' e 'Day/Night' na central multimídia por 5 segundos. 3. Acessar 'Diagnosis Menu' para ler dados do inversor PCU e bateria de alta tensão IPU.",
      doipInstructions: "Para Civic e CR-V e:HEV: Usar interface Honda HDS / i-HDS com J2534 Pass-thru.",
      insulationSpecs: "Isolamento da bateria IPU: > 1.0 MΩ.",
      emergencyResetProcedure: "Desarme do interruptor de alta tensão: Chave de corte localizada no porta-malas sob a cobertura da bateria IPU."
    }
  },
  {
    id: "caoa_chery",
    name: "Caoa Chery",
    country: "Brasil (Anápolis / Jacareí)",
    wmiPrefixes: ["95P", "LVV"],
    evSupported: true,
    fleetFavorite: true,
    models: [
      { name: "iCar 100% Elétrico (30.8 kWh)", category: "EV", isFleetPopular: true, systemType: "Carroceria de Alumínio / Bateria 30.8 kWh", voltage: "320V DC", diagnosticProtocol: "CAN UDS / DoIP", sgwLocked: false },
      { name: "Tiggo 5X Sport / Pro / Pro Hybrid", category: "HYBRID", isFleetPopular: true, systemType: "1.5 Turbo Flex + Sistema Híbrido Leve 48V", voltage: "48V / 12V", diagnosticProtocol: "CAN UDS", sgwLocked: false },
      { name: "Tiggo 7 Pro Max Drive / Pro Hybrid", category: "HYBRID", isFleetPopular: true, systemType: "1.6 Turbo Injeção Direta / 48V Hybrid", diagnosticProtocol: "CAN UDS", sgwLocked: false },
      { name: "Tiggo 8 Pro Plug-in Hybrid (DHT)", category: "HYBRID", isFleetPopular: true, systemType: "1.5 Turbo + 2 Motores Elétricos 317cv (Bateria 19.27 kWh)", voltage: "350V DC", diagnosticProtocol: "CAN UDS / DoIP", sgwLocked: true }
    ],
    evAlternativeGuide: {
      screenMenuProcedure: "AUTOTESTE CHERY iCar & TIGGO 8 PHEV: Na tela central de configurações, tocar 5 vezes na versão do software MCU para acessar o 'Service Menu'. Exibe tensão individual de células, temperatura e status de isolamento elétrico.",
      doipInstructions: "Para Tiggo 8 Plug-in: Diagnóstico do inversor duplo DHT e bateria de alta tensão via porta OBD2 com protocolo CAN-FD ou DoIP.",
      insulationSpecs: "Isolamento elétrico: > 500 kΩ.",
      emergencyResetProcedure: "Corte de Alta Tensão: Desconectar o conector de serviço laranja sob o carpete do porta-malas."
    }
  },
  {
    id: "ford",
    name: "Ford",
    country: "Argentina / EUA / Brasil",
    wmiPrefixes: ["8AF", "1FA", "3FA"],
    evSupported: true,
    fleetFavorite: true,
    models: [
      { name: "Ranger 2.0 Turbo / 3.0 V6 Diesel", category: "DIESEL", isFleetPopular: true, systemType: "2.0 Turbo Diesel / 3.0 V6 250cv", diagnosticProtocol: "CAN-FD UDS", sgwLocked: true },
      { name: "Maverick Híbrida 2.5 Hybrid", category: "HYBRID", isFleetPopular: true, systemType: "2.5 Ciclo Atkinson + Motor Elétrico 194cv", voltage: "280V DC", diagnosticProtocol: "CAN-FD UDS", sgwLocked: true },
      { name: "Territory 1.5 Turbo EcoBoost", category: "FLEX", isFleetPopular: true, systemType: "1.5 EcoBoost 169cv", diagnosticProtocol: "CAN UDS", sgwLocked: false },
      { name: "Mustang Mach-E EV (91 kWh - 487cv)", category: "EV", isFleetPopular: false, systemType: "Plataforma GE1 / Dual Motor GT", voltage: "400V DC", diagnosticProtocol: "DoIP / CAN-FD UDS", sgwLocked: true },
      { name: "Transit Furgão / Minibus", category: "DIESEL", isFleetPopular: true, systemType: "2.0 EcoBlue Turbo Diesel", diagnosticProtocol: "CAN-FD UDS", sgwLocked: true }
    ],
    evAlternativeGuide: {
      screenMenuProcedure: "MODO DE TESTE FORD (Engineering Test Mode): 1. Segurar o botão 'OK' do volante. 2. Ligar a ignição sem dar partida. 3. O painel exibirá 'TEST MODE' com leitura de sensores, DTCs gravados nas ECUs e voltagem da bateria.",
      doipInstructions: "Para Mustang Mach-E e Maverick: Protocolo DoIP / CAN-FD gerenciado pelo módulo Gateway Central (GWM). Requer software Ford FDRS / ForScan com interface compatível.",
      insulationSpecs: "Isolamento da bateria: > 500 kΩ.",
      emergencyResetProcedure: "Reset de Trava de Bateria: Desconectar o cabo do conector de alta tensão de serviço no cofre dianteiro."
    }
  },
  {
    id: "jac",
    name: "JAC Motors",
    country: "China",
    wmiPrefixes: ["LJ1"],
    evSupported: true,
    fleetFavorite: true,
    models: [
      { name: "E-JS1 100% Elétrico (30.2 kWh - Locadoras)", category: "EV", isFleetPopular: true, systemType: "Motor 62cv / Bateria LFP 30.2 kWh", voltage: "320V DC", diagnosticProtocol: "CAN UDS", sgwLocked: false },
      { name: "E-JS4 100% Elétrico (55 kWh)", category: "EV", isFleetPopular: true, systemType: "Motor 150cv / Bateria 55 kWh", voltage: "360V DC", diagnosticProtocol: "CAN UDS", sgwLocked: false },
      { name: "iEV40 EV", category: "EV", isFleetPopular: true, systemType: "Motor 115cv / Bateria 40 kWh", voltage: "330V DC", diagnosticProtocol: "CAN UDS", sgwLocked: false }
    ],
    evAlternativeGuide: {
      screenMenuProcedure: "AUTOTESTE JAC E-JS1: No visor digital central, manter pressionado o botão do hodômetro por 8 segundos para ler os códigos de erro BMS (ex: falha de balanceamento de células, subtensão de pack).",
      doipInstructions: "Comunicação direta na linha CAN de alta velocidade (pinos 6 e 14 da porta OBD2). Não possui bloqueio SGW.",
      insulationSpecs: "Isolamento mínimo da bateria de tração: 500 kΩ.",
      emergencyResetProcedure: "Corte de Alta Tensão: Desconectar a chave de serviço de alta tensão sob o capô dianteiro."
    }
  }
];

// =========================================================================
// VIN (CHASSI) DECODER HELPER
// =========================================================================
export function decodeVinDetails(vin: string): {
  isValid: boolean;
  automakerName?: string;
  country?: string;
  modelYear?: number;
  propulsionGuess?: string;
  isEvOrHybrid?: boolean;
  message?: string;
} {
  const cleanVin = (vin || "").trim().toUpperCase();

  if (!cleanVin || cleanVin.length !== 17) {
    return {
      isValid: false,
      message: cleanVin ? `Chassi incompleto (${cleanVin.length}/17 dígitos)` : "Informe os 17 dígitos do chassi"
    };
  }

  // Check valid characters (VIN standard excludes I, O, Q)
  if (/[IOQ]/.test(cleanVin)) {
    return {
      isValid: false,
      message: "Chassi inválido: Caracteres I, O e Q não são permitidos no padrão VIN"
    };
  }

  const wmi = cleanVin.substring(0, 3);
  const yearChar = cleanVin.charAt(9);

  // Model Year Mapping (10th digit)
  const yearMap: { [key: string]: number } = {
    'A': 2010, 'B': 2011, 'C': 2012, 'D': 2013, 'E': 2014, 'F': 2015,
    'G': 2016, 'H': 2017, 'J': 2018, 'K': 2019, 'L': 2020, 'M': 2021,
    'N': 2022, 'P': 2023, 'R': 2024, 'S': 2025, 'T': 2026, 'V': 2027
  };

  const modelYear = yearMap[yearChar] || undefined;

  // Find Automaker
  let matchedMaker: AutomakerData | undefined;
  for (const maker of BRAZIL_AUTOMAKERS) {
    if (maker.wmiPrefixes.some(prefix => cleanVin.startsWith(prefix))) {
      matchedMaker = maker;
      break;
    }
  }

  // Country from 1st character
  const firstChar = cleanVin.charAt(0);
  let country = "Internacional";
  if (firstChar === '9') country = "Brasil";
  else if (firstChar === '8') country = "Argentina / América do Sul";
  else if (firstChar === '3') country = "México";
  else if (['1', '4', '5'].includes(firstChar)) country = "Estados Unidos";
  else if (firstChar === 'L') country = "China";
  else if (firstChar === 'J') country = "Japão";
  else if (firstChar === 'K') country = "Coreia do Sul";
  else if (['V', 'W'].includes(firstChar)) country = "Alemanha / Europa";
  else if (firstChar === 'Y') country = "Suécia / Norte da Europa";

  const isEvOrHybrid = matchedMaker?.evSupported && (cleanVin.startsWith("LGX") || cleanVin.startsWith("LGB") || cleanVin.startsWith("YV") || cleanVin.includes("EV") || cleanVin.includes("ZE"));

  return {
    isValid: true,
    automakerName: matchedMaker?.name || "Montadora Identificada",
    country: matchedMaker?.country || country,
    modelYear: modelYear,
    propulsionGuess: isEvOrHybrid ? "⚡ 100% Elétrico (BEV) ou Híbrido (PHEV/HEV)" : "🚗 Flex / Combustão / Híbrido Leve",
    isEvOrHybrid: Boolean(isEvOrHybrid),
    message: `Chassi Válido • ${matchedMaker?.name || "Montadora"} • Ano ${modelYear || "2023-2026"} • ${country}`
  };
}
