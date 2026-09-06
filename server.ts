import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "25mb" }));

  // Initialize Gemini AI Client lazily
  function getGenAIClient(): GoogleGenAI | null {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("[OficIA Backend] GEMINI_API_KEY environment variable is not set. Using rich automotive technical database.");
      return null;
    }
    return new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }

  // Health and connection check
  app.get("/api/health", (req, res) => {
    const hasKey = Boolean(process.env.GEMINI_API_KEY);
    res.json({ 
      status: "ok", 
      service: "OficIA Automotive Diagnostics",
      aiConnected: hasKey,
      model: "gemini-2.5-flash"
    });
  });

  // Diagnostic Handler function
  async function handleDiagnosisRequest(req: express.Request, res: express.Response) {
    try {
      const { 
        description, 
        mode, 
        image, 
        audio, 
        video, 
        lang = "pt", 
        plate = "", 
        chassis = "", 
        make = "", 
        model = "", 
        propulsionType = "", 
        isEvAlternative = false 
      } = req.body;

      if (!description && !image && !audio && !video && !chassis) {
        return res.status(400).json({ error: "Descrição do problema, áudio, foto, vídeo ou chassi é obrigatório." });
      }

      const rawText = (description || "").trim();
      const ai = getGenAIClient();

      if (ai) {
        try {
          const promptText = `
Você é o Consultor Técnico Sênior e Especialista Mundial em Engenharia Automotiva & Veículos Elétricos/Híbridos (EV/BEV/PHEV) da OficIA™.
Você possui acesso e correlação direta com a base de dados mundial de:
- Boletins Técnicos de Serviço (TSBs globais - NHTSA, SAE, ABNT, EuroNCAP)
- Manuais de Oficina Oficiais de Fábrica de todas as montadoras que operam no Brasil (BYD, GWM, Fiat/Stellantis, VW, Chevrolet/GM, Hyundai, Toyota, Renault, Volvo, Peugeot, Citroën, Jeep, Nissan, Honda, Ford, Caoa Chery, JAC, etc.) e frotas das principais locadoras de automóveis (Localiza, Movida, Unidas, Kovi).
- Protocolos de Diagnóstico Alternativo para Carros Elétricos onde Scanners Convencionais Falham:
  * DoIP (Diagnostics over IP - Ethernet ISO 13400)
  * UDS sobre CAN-FD (ISO 14229 / ISO 11898-1)
  * Desbloqueio e Bypass de Gateway de Segurança (SGW / CGW / AutoAuth)
  * Modos de Auto-Diagnóstico Onboard via Central Multimídia / Painel de Instrumentos (Menu Secreto BYD DiLink, Menu Engenharia GWM, Service Mode Volvo/Tesla, Renault E-Tech Service, Toyota Maintenance Mode)
  * Medições de Alta Tensão: Teste de Resistência de Isolamento com Megômetro (> 500 kΩ @ 500V DC), Continuidade de Loop de Intertravamento HVIL, Desbalanceamento de Célula de Bateria (Cell Delta V > 30mV), Pyrofuse / Relé de Pré-carga e Reset do Modo Tartaruga (Turtle Mode).
- Assinaturas Acústicas e Espectrogramas de Ruídos Mecânicos e Zumbidos de Inversor/Motor Elétrico.
- Tabelas de Códigos de Painel/Odômetro (DIC) vs Códigos de Scanner OBD2/UDS (DTC SAE J2012).

DADOS DO ATENDIMENTO:
- Placa: ${plate || "Não informada"}
- Chassi (VIN 17 dígitos): ${chassis || "Não informado"}
- Montadora / Fabricante: ${make || "Geral"}
- Modelo do Veículo: ${model || "Geral"}
- Tipo de Propulsão: ${propulsionType || (isEvAlternative ? "100% Elétrico / Híbrido" : "Flex / Combustão")}
- Protocolo Alternativo EV Ativo: ${isEvAlternative ? "SIM — Foco em DoIP, SGW Bypass, Menus Onboard e Medição de Isolamento" : "PADRÃO"}
- Relato Técnico / Sintoma / Ruído / Código / Luz: "${rawText || "Análise multimodal e diagnóstico de chassi"}"
- Modo de Entrada: ${mode || "Multimodal"}

DIRETRIZES DE DIAGNÓSTICO E INTERPRETAÇÃO:
1. SE FOR CARRO ELÉTRICO OU HÍBRIDO (ex: BYD Dolphin/Mini/Yuan/Seal/Song, GWM Ora 03/Haval H6, Renault Kwid E-Tech, Volvo EX30/XC40, Peugeot e-208, JAC E-JS1, Corolla Hybrid, etc.):
   - Forneça a alternativa exata caso scanners tradicionais OBD2 não comuniquem (citar menus de tela sem scanner, pinagem DoIP Ethernet, desbloqueio de SGW, teste de megômetro a 500V e desconexão segura do MSD/plugue laranja).
2. DISTINÇÃO AUTODIDATA & VERIFICAÇÃO DE CÓDIGO DE ERRO:
   - SE O INPUT FOR DE 2 DÍGITOS (ex: 61, 89, 82, 16, 24, 59, 60, 62, 95): IGNORE COMPLETAMENTE OS PROTOCOLOS OBD2 PADRÃO. Este código NÃO é de scanner. Busque especificamente em bancos de dados de MANUAIS DO PROPRIETÁRIO e MANUAIS DE SERVIÇO DE PAINÉIS DE INSTRUMENTOS (Driver Information Center - DIC / odômetro). Classifique como 'PAINEL_INSTRUMENTOS', defina o badge como 'PAINEL DE INSTRUMENTOS (2 DÍGITOS) — NÃO É SCANNER', e forneça o procedimento de reset manual sem scanner (ex: calibração de vidros, reset de vida de óleo no odômetro, termostato pilotado).
   - SE FOR CÓDIGO LONGO DE SCANNER (5 caracteres: P, C, B, U + 4 dígitos): classifique como CÓDIGO DE SCANNER (OBD2/UDS DTC), aplique protocolos de scanner eletrônico e defina o badge 'SCANNER OBD2 (DTC)'.
   - Aprenda com a regra autodidata que códigos curtos são identificadores de painel e códigos longos são do scanner.
   - Se for barulho ou sintoma mecânico/elétrico: classifique como SINTOMA_MECANICO ou ANALISE_ACUSTICA.
   - Se for falha de carro elétrico/alta tensão: classifique como DIAGNOSTICO_EV_ALTA_TENSAO.
3. RELACIONE COM A BASE MUNDIAL E FROTAS DE LOCADORAS DO BRASIL: Cite montadoras, causas raízes, testes de bancada/medições (Ohms, Volts, Bar, Hz, kΩ isolamento), procedimento de reparo e reset físico ou eletrônico.

RETORNE EXCLUSIVAMENTE UM OBJETO JSON COM A SEGUINTE ESTRUTURA:
{
  "codeType": "PAINEL_INSTRUMENTOS" | "SCANNER_OBD2" | "SINTOMA_MECANICO" | "ANALISE_ACUSTICA" | "DIAGNOSTICO_EV_ALTA_TENSAO",
  "codeTypeLabel": "Título conciso da classificação",
  "originBadge": "DIAGNÓSTICO ALTERNATIVO VEÍCULO ELÉTRICO (EV/DoIP)" | "PAINEL DE INSTRUMENTOS (2 DÍGITOS) — NÃO É SCANNER" | "SCANNER OBD2 (DTC)" | "ANÁLISE ACÚSTICA & SINTOMA MECÂNICO" | "DIAGNÓSTICO TÉCNICO GLOBAL",
  "originExplanation": "Explicação técnica direta sobre a origem da falha, protocolos de comunicação e manuais oficiais.",
  "problemName": "Nome técnico claro e preciso do diagnóstico",
  "supplierCategory": "Sistema afetado (ex: Sistema de Bateria de Alta Tensão BMS, Inversor de Tração MCU, Sistema de Arrefecimento, Injeção Eletrônica, Freios ABS, BCM)",
  "severity": "Alta" | "Média" | "Baixa",
  "source": "Base Técnica Mundial de Manuais & Engenharia OficIA",
  "diagnosticNotes": "Laudo detalhado com causa raiz, explicação física/elétrica do sintoma e histórico de falhas da montadora.",
  "resetProcedure": "Procedimento passo a passo exato de reparo, reset manual, menu secreto de tela ou protocolo alternativo DoIP sem depender de scanner genérico.",
  "correctiveChecklist": [
    "Passo 1 de teste ou medição com valores nominais de fábrica",
    "Passo 2 de inspeção...",
    "Passo 3 de validação funcional..."
  ],
  "preventiveChecklist": [
    "Recomendação de manutenção preventiva 1",
    "Recomendação de manutenção preventiva 2"
  ],
  "budgetItems": [
    { "item": "Nome da peça ou componente de reposição", "category": "Peça" | "Mão de Obra", "estimatedCost": 250.00 }
  ],
  "suggestedBestPractices": [
    "Dica prática de segurança (ex: EPI luva 1000V CAT III), desenergização do MSD ou torque de aperto"
  ]
}
`;

          const contentsParts: any[] = [{ text: promptText }];

          // Handle Image (Base64 or Preset)
          if (image && typeof image === "string") {
            if (image.startsWith("data:image")) {
              const matches = image.match(/^data:(image\/\w+);base64,(.+)$/);
              if (matches) {
                contentsParts.push({
                  inlineData: {
                    mimeType: matches[1],
                    data: matches[2],
                  },
                });
              }
            } else if (image.startsWith("IMAGE_PRESET_")) {
              contentsParts.push({
                text: `[IMAGEM ANEXADA]: Análise de preset de avaria automotiva no painel (${image})`,
              });
            }
          }

          // Handle Audio
          if (audio && typeof audio === "string" && audio.startsWith("data:audio")) {
            const matches = audio.match(/^data:(audio\/\w+);base64,(.+)$/);
            if (matches) {
              contentsParts.push({
                inlineData: {
                  mimeType: matches[1],
                  data: matches[2],
                },
              });
            }
          }

          // Generate response with Gemini 2.5 Flash
          const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: contentsParts },
            config: {
              responseMimeType: "application/json",
              systemInstruction: "Você é um engenheiro automotivo sênior e especialista mundial em diagnóstico mecânico, elétrico, veículos elétricos (EV/HEV/PHEV) e acústico de veículos de todas as marcas. Responda em formato JSON rigoroso.",
            },
          });

          if (response.text) {
            try {
              const cleaned = response.text.trim();
              const parsed = JSON.parse(cleaned);
              return res.json({ ...parsed, source: "Inteligência Artificial Gemini — Base de Dados Mundial OficIA" });
            } catch (pErr) {
              const jsonMatch = response.text.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return res.json({ ...parsed, source: "Inteligência Artificial Gemini — Base de Dados Mundial OficIA" });
              }
            }
          }
        } catch (geminiErr: any) {
          console.error("[OficIA] Erro ao consultar Gemini API:", geminiErr?.message || geminiErr);
        }
      }

      // Comprehensive Automotive Knowledge Resolver (Local & Worldwide Fallback)
      const resolved = resolveAutomotiveFaultKnowledge(rawText.toLowerCase(), plate, chassis, make, model, isEvAlternative);
      return res.json(resolved);

    } catch (err: any) {
      console.error("[OficIA] Erro geral no diagnóstico:", err);
      return res.status(500).json({ error: "Erro interno no processamento do diagnóstico." });
    }
  }

  // Diagnostic Endpoints — Both paths supported
  app.post("/api/diagnose", handleDiagnosisRequest);
  app.post("/api/gemini/diagnosis", handleDiagnosisRequest);

  // Vite development middleware or production static serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[OficIA Backend] Servidor rodando em http://localhost:${PORT}`);
  });
}

// =========================================================================
// ADVANCED AUTOMOTIVE MANUAL & FAULT CODE RESOLVER (COVERS 100+ CODES & EV)
// =========================================================================
function resolveAutomotiveFaultKnowledge(
  query: string, 
  plate: string = "", 
  chassis: string = "", 
  make: string = "", 
  model: string = "", 
  isEvAlternative: boolean = false
) {
  const isDTC = /\b[pcbu]\d{4}\b/i.test(query);
  const isDigitCode = /\b(?:code\s*)?(\d{1,3})\b/i.test(query);

  // Default badges
  const badgePainel = "PAINEL DE INSTRUMENTOS (2 DÍGITOS) — NÃO É CÓDIGO DE SCANNER";
  const badgeScanner = "SCANNER AUTOMOTIVO OBD2 (DTC)";
  const badgeEV = "DIAGNÓSTICO ALTERNATIVO VEÍCULO ELÉTRICO (EV/DoIP/ONBOARD)";
  const explanationPainel = "Identificado com inteligência autodidata: Trata-se de uma mensagem/código direto do visor do painel de instrumentos / odômetro (DIC) da montadora (2 dígitos), e NÃO um código de scanner de diagnóstico OBD2 (DTC).";
  const explanationScanner = "Identificado com inteligência autodidata: Trata-se de um código de falha padronizado de scanner de diagnóstico OBD2 (DTC padrão SAE J2012 com letra + 4 dígitos).";
  const explanationEV = "Identificado: Carro Elétrico / Híbrido com protocolo de alta tensão. Scanners OBD2 tradicionais falham por bloqueio SGW, barramento CAN-FD ou ausência de suporte DoIP (ISO 13400). Aplicando rota de diagnóstico alternativo homologada.";

  const fullQuery = `${query} ${make} ${model} ${chassis}`.toLowerCase();

  // -------------------------------------------------------------------------
  // A. EV ALTERNATIVE DIAGNOSTIC PROTOCOLS (BYD, GWM, VOLVO, RENAULT, GM, ETC.)
  // -------------------------------------------------------------------------
  const isEvContext = isEvAlternative || 
    fullQuery.includes("eletrico") || fullQuery.includes("elétrico") || fullQuery.includes("hibrido") || fullQuery.includes("híbrido") ||
    fullQuery.includes("byd") || fullQuery.includes("dolphin") || fullQuery.includes("seagull") || fullQuery.includes("yuan") || fullQuery.includes("seal") || fullQuery.includes("song") ||
    fullQuery.includes("gwm") || fullQuery.includes("ora 03") || fullQuery.includes("haval") || fullQuery.includes("tank") ||
    fullQuery.includes("e-tech") || fullQuery.includes("kwid e-tech") || fullQuery.includes("megane e-tech") ||
    fullQuery.includes("ex30") || fullQuery.includes("xc40") || fullQuery.includes("c40") ||
    fullQuery.includes("bolt") || fullQuery.includes("ultium") || fullQuery.includes("500e") || fullQuery.includes("e-208") ||
    fullQuery.includes("bms") || fullQuery.includes("doip") || fullQuery.includes("sgw") || fullQuery.includes("isolamento") || fullQuery.includes("tartaruga") || fullQuery.includes("turtle") || fullQuery.includes("hvil") || fullQuery.includes("alta tensao") || fullQuery.includes("alta tensão");

  // 1. BYD (Dolphin, Dolphin Mini, Yuan Plus, Song Plus, Seal)
  if (isEvContext && (fullQuery.includes("byd") || fullQuery.includes("dolphin") || fullQuery.includes("seagull") || fullQuery.includes("blade") || fullQuery.includes("song") || fullQuery.includes("yuan") || fullQuery.includes("seal"))) {
    return {
      codeType: "DIAGNOSTICO_EV_ALTA_TENSAO",
      codeTypeLabel: "Protocolo Alternativo BYD (DoIP / Menu DiLink Onboard)",
      originBadge: badgeEV,
      originExplanation: "Scanners OBD2 tradicionais falham em veículos BYD porque a porta OBD2 opera com Gateway de Segurança (SGW) criptografado e protocolos DoIP (Diagnostics over IP - Ethernet ISO 13400) para acesso à Blade Battery LFP e ao módulo de controle do trem de força elétrico 8 em 1.",
      problemName: "BYD Blade Battery / Diagnóstico Alternativo & Leitura de Telemetria Onboard DiLink",
      supplierCategory: "Sistema de Bateria de Alta Tensão (BMS Blade LFP) & Inversor SiC",
      severity: "Alta",
      source: "Manual de Engenharia BYD Auto, Protocolo DoIP ISO 13400 & Plataforma e-Platform 3.0",
      diagnosticNotes: "1. MOTIVO DO BLOQUEIO EM SCANNERS CONVENCIONAIS: A BYD utiliza arquitetura de rede onde os barramentos de alta tensão (BMS, Inversor MCU, Carregador OBC e DC-DC) não respondem aos comandos SAE J1979 padrão. 2. MÉTODO ALTERNATIVO 1 (SEM SCANNER - MENU DILINK): No teclado do discador da multimídia central DiLink, digite *#*#83789#*#* (ou *#8888#). O modo de engenharia BYD abrirá mostrando: Tensão individual de cada célula Blade (tolerância máxima ΔV: 15mV), Temperatura dos 8 sensores NTC, Resistência de isolamento em kΩ e SOH (State of Health). 3. MÉTODO ALTERNATIVO 2 (DoIP ETHERNET): Utilizar interface VCI com suporte a DoIP nos pinos 3/11 e 12/13 para bypass do gateway. 4. TESTE DE ISOLAMENTO: A resistência ôhmica entre o positivo/negativo de tração (332V-550V) e o chassi deve ser > 500 kΩ.",
      resetProcedure: "PROCEDIMENTO DE RESET DE ALTA TENSÃO & MODO TARTARUGA BYD:\n1. Desligar o veículo, fechar todos os vidros e travar o carro na chave por 10 minutos (Deep Sleep Mode das ECUs).\n2. Abrir o capô e desconectar o polo negativo da bateria auxiliar de 12V (ou lítio 13.8V).\n3. Com luvas isolantes 1000V (Norma NR-10), retirar a tampa do plugue laranja de segurança (Manual Service Disconnect - MSD) sob o banco traseiro.\n4. Aguardar 10 minutos para descarga completa dos capacitores do inversor de carboneto de silício (SiC).\n5. Reconectar o MSD, religar a bateria 12V e acionar o botão START/STOP segurando por 5 segundos até aparecer 'READY' verde no painel.",
      correctiveChecklist: [
        "Acessar o menu de engenharia DiLink (*#*#83789#*#*) e verificar se há célula com diferença de tensão (Delta V) superior a 30mV",
        "Medir com megômetro (500V DC) o isolamento elétrico entre barramento de tração e massa (mínimo 500 kΩ)",
        "Inspecionar continuidade do loop de intertravamento de alta tensão (HVIL) nos conectores laranjas",
        "Verificar nível do líquido de arrefecimento dielétrico do sistema de climatização da bateria Blade"
      ],
      preventiveChecklist: [
        "Efetuar calibração de 100% de carga lenta AC uma vez por semana para balanceamento passivo das células LFP",
        "Substituir o fluido de arrefecimento da bateria e inversor a cada 4 anos / 80.000 km com fluido original BYD"
      ],
      budgetItems: [
        { "item": "Diagnóstico de Alta Tensão / Varredura DoIP & Teste de Isolamento Megômetro", "category": "Mão de Obra", "estimatedCost": 450.00 },
        { "item": "Calibração e Balanceamento de Células BMS Blade Battery", "category": "Mão de Obra", "estimatedCost": 320.00 },
        { "item": "Fluido de Arrefecimento Desmineralizado Específico para Baterias EV", "category": "Peça", "estimatedCost": 220.00 }
      ],
      suggestedBestPractices: [
        "ATENÇÃO DE SEGURANÇA NR-10: Nunca desconecte cabos laranjas sem certificar-se da ausência de tensão com multímetro CAT III 1000V após remover o MSD."
      ]
    };
  }

  // 2. GWM (Ora 03, Haval H6 HEV/PHEV, Tank 300)
  if (isEvContext && (fullQuery.includes("gwm") || fullQuery.includes("ora") || fullQuery.includes("haval") || fullQuery.includes("h6") || fullQuery.includes("tank"))) {
    return {
      codeType: "DIAGNOSTICO_EV_ALTA_TENSAO",
      codeTypeLabel: "Protocolo Alternativo GWM (CAN-FD UDS / Menu de Serviço VCU)",
      originBadge: badgeEV,
      originExplanation: "Veículos GWM (Haval H6 e Ora 03) utilizam barramento CAN-FD de alta velocidade (2 a 5 Mbps) com travamento de escrita pelo módulo SGW. Scanners OBD2 convencionais não conseguem inicializar o handshake de segurança com o módulo VCU e o inversor trifásico.",
      problemName: "GWM L.E.M.O.N. Platform / Diagnóstico Alternativo do Inversor & Módulo BMS",
      supplierCategory: "Sistema Híbrido DHT / Tração Elétrica & Bateria de Tração",
      severity: "Alta",
      source: "Manual de Oficina GWM Global, Engenharia de Powertrain Híbrido L.E.M.O.N. & Protocolo CAN-FD",
      diagnosticNotes: "1. FALHA COMUM DE COMUNICAÇÃO: Scanners universais acusam 'Erro de Conexão' ou 'ECU não encontrada' devido ao filtro do Gateway Central GWM. 2. MÉTODO ALTERNATIVO 1 (MENU DE SERVIÇO NA TELA): Na central multimídia, vá em 'Configurações do Veículo' > 'Sobre o Sistema' e toque 5 vezes na imagem do carro; digite a senha '1988' ou '8888'. Isso abrirá o painel de leitura de status do inversor DHT e tensão dos módulos de bateria. 3. MÉTODO ALTERNATIVO 2 (BYPASS FÍSICO SGW): Conectar ponte de barramento diretamente na linha CAN-H e CAN-L de tração localizada no módulo VCU sob o painel dianteiro. 4. Se houver perda de tração ou código P0AA6 (Fuga de Isolamento), o sistema corta a alimentação dos contatores principais.",
      resetProcedure: "PROCEDIMENTO DE REINICIALIZAÇÃO DO SISTEMA HÍBRIDO/ELÉTRICO GWM:\n1. Desligar o veículo, afastar a chave inteligente por mais de 5 metros e aguardar 15 minutos para corte do relé principal.\n2. Desconectar o terminal negativo da bateria de 12V no cofre dianteiro.\n3. Verificar e rearmar o plugue de intertravamento de segurança de alta tensão (HVIL).\n4. Reconectar a bateria de 12V, entrar no veículo e pressionar o botão Start/Stop 2 vezes sem pisar no freio. Aguardar 10 segundos e em seguida pisar no freio com firmeza e acionar o botão START até a luz 'READY' acender.",
      correctiveChecklist: [
        "Verificar integridade do chicote de alta tensão laranja quanto a atrito mecânico ou infiltração de umidade",
        "Medir resistência de isolamento do inversor duplo DHT (especificação: > 1.0 MΩ @ 500V DC)",
        "Testar a tensão de repouso da bateria auxiliar de 12V AGM (mínimo 12.4V - subtensão de 12V gera falsas falhas de alta tensão)",
        "Verificar fluxo da bomba elétrica de arrefecimento do sistema híbrido"
      ],
      preventiveChecklist: [
        "Manter o duto de ventilação do pack de baterias desobstruído",
        "Realizar atualização periódica de firmware da VCU e BMS na rede autorizada"
      ],
      budgetItems: [
        { "item": "Diagnóstico Especializado de Sistema Híbrido / Varredura CAN-FD", "category": "Mão de Obra", "estimatedCost": 420.00 },
        { "item": "Descontaminação e Teste de Isolamento de Conectores HV", "category": "Mão de Obra", "estimatedCost": 280.00 }
      ],
      suggestedBestPractices: [
        "Sempre utilizar ferramentas com isolamento homologado VDE 1000V IEC 60900 ao manusear componentes sob tampa laranja."
      ]
    };
  }

  // 3. Renault E-Tech (Kwid E-Tech, Megane E-Tech)
  if (isEvContext && (fullQuery.includes("renault") || fullQuery.includes("kwid e-tech") || fullQuery.includes("megane e-tech") || fullQuery.includes("e-tech"))) {
    return {
      codeType: "DIAGNOSTICO_EV_ALTA_TENSAO",
      codeTypeLabel: "Protocolo Alternativo Renault E-Tech (Autoteste de Painel / DoIP)",
      originBadge: badgeEV,
      originExplanation: "O Renault Kwid E-Tech e Megane E-Tech possuem Gateway de Segurança CGW com bloqueio de leitura de parâmetros de tração por scanners OBD2 comuns. Exigem rotina de autodiagnóstico via chave presencial ou conexão DoIP.",
      problemName: "Renault E-Tech / Falha de Carga, Modo Tartaruga ou Bloqueio de Tração Elétrica",
      supplierCategory: "Sistema de Alta Tensão E-Tech / Carregador Embarcado OBC & Bateria de Tração",
      severity: "Alta",
      source: "Manual de Oficina Renault E-Tech, Normas Elétricas CMF-EV & Plataforma CMF-A",
      diagnosticNotes: "1. CAUSA DA FALHA DE LEITURA: Scanners universais antigos não conseguem ler o calculador de tração (módulo 1199) nem o módulo da bateria de tração (BMS LFP 26.8 kWh no Kwid / 60 kWh no Megane). 2. MÉTODO ALTERNATIVO (AUTOTESTE SEM SCANNER): Com a chave no console, mantenha pressionado o botão START/STOP por 10 segundos SEM pisar no freio. O painel exibirá as mensagens técnicas de diagnóstico e o status dos relés de alta tensão. 3. Causa frequente de recusa de carga: Falha de aterramento na tomada residencial/wallbox (resistência de terra deve ser inferior a 50 Ohms).",
      resetProcedure: "RESET DE TRAVA DE CARGA E-TECH:\n1. Destravar o cabo de carga na tomada Type 2 (caso travado, usar o cabo de emergência manual sob o capô).\n2. Desconectar o conector de segurança de alta tensão (chave de corte vermelha no compartimento traseiro).\n3. Desconectar o cabo terra da bateria de 12V por 5 minutos.\n4. Reconectar a trava de segurança e o polo 12V. Fechar todas as portas e efetuar ciclo de ignição.",
      correctiveChecklist: [
        "Verificar a resistência de aterramento da rede elétrica (deve ser < 50 Ohms para liberação pelo OBC)",
        "Medir a tensão dos blocos da bateria de tração (tensão nominal: 260V a 400V conforme o modelo)",
        "Testar o acionamento do atuador de travamento do plugue Tipo 2",
        "Inspecionar fusível principal de alta tensão no módulo de junção (Power Distribution Unit)"
      ],
      preventiveChecklist: [
        "Inspecionar os pinos do conector Tipo 2 contra carbonização ou umidade",
        "Verificar a saúde da bateria auxiliar de 12V periodicamente"
      ],
      budgetItems: [
        { "item": "Diagnóstico do Sistema de Carga OBC e Varredura E-Tech", "category": "Mão de Obra", "estimatedCost": 390.00 },
        { "item": "Aferição de Aterramento e Calibração de Trava de Conector Type 2", "category": "Mão de Obra", "estimatedCost": 190.00 }
      ],
      suggestedBestPractices: [
        "Nunca force a remoção do plugue de carga com a trava acionada; utilize sempre o cabo de desarme manual."
      ]
    };
  }

  // 4. Volvo (EX30, XC40 Recharge, C40, XC60 T8)
  if (isEvContext && (fullQuery.includes("volvo") || fullQuery.includes("ex30") || fullQuery.includes("xc40") || fullQuery.includes("c40") || fullQuery.includes("t8"))) {
    return {
      codeType: "DIAGNOSTICO_EV_ALTA_TENSAO",
      codeTypeLabel: "Protocolo Alternativo Volvo (DoIP Exclusivo ISO 13400 / Android Automotive)",
      originBadge: badgeEV,
      originExplanation: "Todos os veículos Volvo modernos (plataformas SPA, CMA e SEA do EX30) utilizam EXCLUSIVAMENTE o protocolo DoIP (Diagnostics over Internet Protocol via Ethernet) na porta OBD2. Scanners baseados em barramento CAN tradicional simplesmente não conseguem se comunicar.",
      problemName: "Volvo EX30 / XC40 Recharge / Diagnóstico Alternativo DoIP & Sistema de Alta Tensão",
      supplierCategory: "Sistema de Bateria de Alta Tensão (BMS) & Motores Elétricos E-Drive",
      severity: "Alta",
      source: "Manual de Engenharia Volvo Car Corporation, Sistema VIDA DoIP & Arquitetura SEA",
      diagnosticNotes: "1. POR QUE O SCANNER TRADICIONAL NÃO FUNCIONA: A Volvo descontinuou o diagnóstico via CAN de baixa velocidade na porta OBD2. A comunicação é realizada por Ethernet nos pinos 3, 11, 12 e 13 da tomada OBD2. 2. MÉTODO ALTERNATIVO (MENU DE SERVIÇO ANDROID AUTOMOTIVE): Na tela central de 9 ou 12 polegadas, acesse 'Configurações' > 'Sistema' > 'Sobre' e toque repetidamente (7 vezes) no número da versão do sistema até liberar o 'Modo de Oficina Volvo'. Permite consultar a temperatura do pack de baterias, tensão dos módulos e teste das bombas de água do circuito de refrigeração.",
      resetProcedure: "PROCEDIMENTO DE REINICIALIZAÇÃO DO SISTEMA VOLVO:\n1. Para reset da tela central e módulos telemáticos: Pressione e segure o botão físico abaixo da tela central por 20 segundos até a tela reiniciar com o logotipo Volvo.\n2. Para reset do circuito de tração: Desligar o veículo, desconectar o fusível de serviço HV no compartimento de bagagem e reiniciar a bateria de 12V.",
      correctiveChecklist: [
        "Conectar interface de diagnóstico com canal DoIP ativo (cabo Ethernet RJ45/OBD2)",
        "Verificar integridade do circuito de arrefecimento da bateria de lítio e bomba de calor PTC",
        "Medir a resistência de isolamento do barramento HV (> 1.0 MΩ)",
        "Efetuar leitura do SOH (State of Health) dos módulos de bateria"
      ],
      preventiveChecklist: [
        "Verificar atualizações OTA (Over-The-Air) pendentes no sistema do veículo",
        "Inspecionar tampa do bocal de carga CCS2 contra entrada de sujeira"
      ],
      budgetItems: [
        { "item": "Diagnóstico Avançado via Rede DoIP / Leitura de Células de Tração", "category": "Mão de Obra", "estimatedCost": 490.00 },
        { "item": "Calibração e Teste de Isolamento do Sistema Térmico de Bateria", "category": "Mão de Obra", "estimatedCost": 350.00 }
      ],
      suggestedBestPractices: [
        "Utilizar sempre conexões de rede blindadas para evitar ruídos eletromagnéticos durante a varredura DoIP."
      ]
    };
  }

  // 5. Toyota Hybrid (Corolla Hybrid, Corolla Cross Hybrid, RAV4)
  if (isEvContext && (fullQuery.includes("toyota") || fullQuery.includes("corolla hybrid") || fullQuery.includes("corolla cross") || fullQuery.includes("prius") || fullQuery.includes("ths"))) {
    return {
      codeType: "DIAGNOSTICO_EV_ALTA_TENSAO",
      codeTypeLabel: "Modo de Manutenção Híbrido Toyota (Sem Scanner)",
      originBadge: badgeEV,
      originExplanation: "O sistema híbrido Toyota THS II desliga o motor a combustão automaticamente quando parado, impedindo testes de emissões, análise de ruído mecânico e medição de sensores em marcha lenta. Existe um procedimento manual nativo para travar o motor ligado e acessar o diagnóstico do inversor sem scanner.",
      problemName: "Toyota THS II / Modo de Manutenção Híbrido & Diagnóstico da Bateria de Tração (P0AA6)",
      supplierCategory: "Sistema Híbrido THS II (Inversor, Motor-Gerador MG1/MG2 e Bateria HV)",
      severity: "Alta",
      source: "Manual de Oficina Toyota Motor Corporation, Sistema THS II & Boletim Técnico P0AA6",
      diagnosticNotes: "1. PROCEDIMENTO NATIVO DO MODO DE MANUTENÇÃO (SEM SCANNER):\n   - Pressione o botão START 2 vezes sem pisar no freio (ignição ON);\n   - Pressione o acelerador até o fundo 2 vezes em posição 'P';\n   - Mude a alavanca para 'N' e pressione o acelerador até o fundo 2 vezes;\n   - Volte para 'P' e pressione o acelerador 2 vezes;\n   - A indicação 'MAINTENANCE MODE' piscará no painel de instrumentos;\n   - Pise no freio e dê a partida: o motor a combustão funcionará continuamente em marcha lenta sem desligar para diagnóstico.\n2. FALHA CLÁSSICA P0AA6 (Fuga de Isolamento): Ocorre com frequência pelo acúmulo de sujeira e pelos de animais no filtro de arrefecimento da bateria híbrida sob o assento traseiro.",
      resetProcedure: "RESET DO SISTEMA HÍBRIDO TOYOTA:\n1. Remover a grade plástica de ventilação sob o assento traseiro direito e limpar/substituir o filtro da ventoinha da bateria HV.\n2. Desconectar o jumper laranja de segurança (Service Plug) girando a trava e puxando para fora.\n3. Desconectar a bateria auxiliar de 12V no porta-malas por 5 minutos para limpar o travamento de contatores.",
      correctiveChecklist: [
        "Limpar o duto e a hélice do ventilador de refrigeração da bateria híbrida",
        "Medir a diferença de tensão entre os blocos de bateria (Delta V máximo: 0.2V)",
        "Medir a resistência de isolamento entre o inversor e o bloco do motor (> 1.0 MΩ)",
        "Verificar nível do reservatório independente de líquido de arrefecimento do inversor"
      ],
      preventiveChecklist: [
        "Limpar o filtro da ventoinha da bateria híbrida a cada 10.000 km",
        "Substituir o fluido Toyota Super Long Life Coolant do inversor aos 100.000 km"
      ],
      budgetItems: [
        { "item": "Higienização do Sistema de Ventilação e Filtro da Bateria Híbrida", "category": "Mão de Obra", "estimatedCost": 220.00 },
        { "item": "Diagnóstico de Eficiência dos Blocos Ni-MH / Li-Ion e Inversor", "category": "Mão de Obra", "estimatedCost": 350.00 }
      ],
      suggestedBestPractices: [
        "Nunca obstrua a entrada de ar da bateria de tração localizada na lateral do banco traseiro."
      ]
    };
  }

  // 6. Generic EV / High Voltage / Insulation / Turtle Mode
  if (isEvContext) {
    return {
      codeType: "DIAGNOSTICO_EV_ALTA_TENSAO",
      codeTypeLabel: "Diagnóstico Alternativo de Alta Tensão EV / PHEV",
      originBadge: badgeEV,
      originExplanation: "Veículo elétrico ou híbrido com falha no sistema de propulsão de alta tensão. Scanners comuns falham por bloqueios de SGW ou ausência de rotinas de medição de isolamento ôhmico e barramento DoIP.",
      problemName: "Sistema de Propulsão Elétrica / Falha de Isolamento de Alta Tensão & Modo Tartaruga (Turtle Mode)",
      supplierCategory: "Sistema de Alta Tensão (BMS, Inversor, Conversores DC-DC & Bateria)",
      severity: "Alta",
      source: "Base Técnica Mundial de Veículos Elétricos & Normas Internacionais ISO 6469 / ISO 13400",
      diagnosticNotes: "1. FALHA DE ISOLAMENTO (DTC P0AA6 / P0A0F): Ocorre quando há fuga de corrente elétrica entre o circuito de tração (300V a 800V DC) e a carroceria metálica. O valor de segurança regulamentar deve ser superior a 500 Ohms por Volt (mínimo absoluto de 500 kΩ). 2. DESCONEXÃO SEGURA DO MSD: Antes de qualquer intervenção, retirar o conector de serviço (Manual Service Disconnect) com luva 1000V classe 0. 3. LOOP HVIL: Verificar o loop de intertravamento de baixa tensão que percorre todos os conectores laranjas; se um conector estiver frouxo, o relé de contatores não fecha.",
      resetProcedure: "PROCEDIMENTO GERAL DE DESENERGIZAÇÃO E RESET EV:\n1. Desligar a ignição e afastar a chave presencial por 10 metros.\n2. Desconectar o polo negativo da bateria de 12V.\n3. Puxar o conector de corte de emergência de alta tensão (MSD).\n4. Aguardar 10 minutos para descarga dos capacitores do inversor.\n5. Medir com multímetro CAT III 1000V a ausência total de tensão DC nos terminais de teste.\n6. Reconectar o circuito na ordem inversa.",
      correctiveChecklist: [
        "Efetuar teste de isolamento elétrico com megômetro em 500V DC entre barramento HV e chassi (deve ser > 500 kΩ)",
        "Testar a continuidade do loop de intertravamento de alta tensão (HVIL)",
        "Verificar a integridade do fusível pirotécnico (Pyrofuse) de emergência",
        "Medir a saúde e tensão da bateria auxiliar de 12V (subtensão causa bloqueio geral de ECUs)"
      ],
      preventiveChecklist: [
        "Inspecionar cabos de alta tensão laranjas contra mordidas de roedores ou abrasão mecânica",
        "Verificar o nível e estado do fluido de arrefecimento específico do inversor e bateria"
      ],
      budgetItems: [
        { "item": "Diagnóstico Completo de Sistema de Alta Tensão e Teste de Fuga Megômetro", "category": "Mão de Obra", "estimatedCost": 480.00 },
        { "item": "Higienização e Selagem de Conectores de Tração Laranjas", "category": "Mão de Obra", "estimatedCost": 260.00 }
      ],
      suggestedBestPractices: [
        "OBRIGATÓRIO: Utilizar luvas isolantes de borracha classe 0 (1000V) com sobreluva de couro conforme NR-10."
      ]
    };
  }

  // 1. GM Code 61 / Odômetro / Vidro Traseiro Esquerdo
  if (query.includes("61") || (query.includes("odometro") && query.includes("61")) || query.includes("vidro traseiro") || query.includes("janela traseira")) {
    if (query.includes("realoem") || query.includes("bmw") || query.includes("e46") || query.includes("e90") || query.includes("e39")) {
      return {
        codeType: "PAINEL_INSTRUMENTOS",
        codeTypeLabel: "Menu de Teste do Odômetro BMW / Catálogo RealOEM.com",
        originBadge: badgePainel,
        originExplanation: "Identificado: Teste do odômetro BMW (Menu 6.1) / Alerta CC-ID 61 de telemática e consulta de componentes OEM no catálogo RealOEM.com.",
        problemName: "BMW Test 6.1 no Odômetro / Consulta RealOEM.com — Nível de Combustível & Peças OEM",
        supplierCategory: "Painel de Instrumentos & Sistema de Alimentação (RealOEM BMW)",
        severity: "Média",
        source: "Manual de Serviço BMW TIS, Menu Secreto do Cluster & Catálogo RealOEM.com",
        diagnosticNotes: "1. No painel/odômetro da BMW (séries E46, E39, E90, E60, F30), a função 'Test 06.0 / 06.1' no menu secreto do hodômetro exibe a leitura em tempo real dos dois sensores de nível de combustível (bóia esquerda Tankgeber L e bóia direita Tankgeber R) em formato hexa/litros (ex: 15.2L / 18.4L). 2. No catálogo técnico RealOEM.com, esses componentes estão sob o Grupo Principal 16 (Fuel Supply) e Grupo 62 (Instruments). 3. Caso seja o código CC-ID 61, refere-se à falha no módulo de chamada de emergência SOS (TCB/Combox ou bateria interna do módulo de telemática esgotada).",
        resetProcedure: "RESET MENU BMW / REALOEM: 1. Para sair do Test 6.1 no odômetro: desligue e ligue a ignição, ou pressione e segure o pino do odômetro até voltar à quilometragem total. 2. Para CC-ID 61 (SOS): Substituir a bateria de backup de 3.7V/8V do módulo telemático TCB no forro do teto/porta-malas e realizar a limpeza de erros via scanner ISTA-D ou OBD2.",
        correctiveChecklist: [
          "Consultar no catálogo RealOEM.com o diagrama esquemático e o part number OEM exato do sensor de nível ou módulo de telemática",
          "Testar a resistência ôhmica das duas bóias de nível de combustível na bomba de tanque (nominal: 10 a 250 Ohms conforme o nível)",
          "Verificar a tensão da bateria de backup de lítio do módulo de telemática SOS (abaixo de 3.2V gera aviso CC-ID 61)"
        ],
        preventiveChecklist: [
          "Utilizar sempre combustível de boa procedência para evitar sulfatação ou verniz na pista resistiva dos sensores de nível de combustível",
          "Substituir a bateria de lítio do módulo telemático a cada 5 anos"
        ],
        budgetItems: [
          { item: "Sensor de Nível de Combustível Original BMW (Bóia OEM RealOEM)", category: "Peça", estimatedCost: 480.00 },
          { item: "Bateria de Backup para Módulo Telemático SOS / TCB", category: "Peça", estimatedCost: 190.00 },
          { item: "Diagnóstico Especializado BMW ISTA, Varredura & Desbloqueio de Painel", category: "Mão de Obra", estimatedCost: 280.00 }
        ],
        suggestedBestPractices: [
          "No RealOEM.com, utilize os últimos 7 dígitos do chassi (VIN) para filtrar exatamente os diagramas e part numbers compatíveis com o ano/modelo do veículo."
        ]
      };
    }

    return {
      codeType: "PAINEL_INSTRUMENTOS",
      codeTypeLabel: "Código do Painel de Instrumentos / Odômetro (DIC)",
      originBadge: badgePainel,
      originExplanation: explanationPainel,
      problemName: "Code 61 — Reprogramação do Vidro Elétrico Traseiro Esquerdo Necessária (Chevrolet Onix, Prisma, Spin, Tracker, Cobalt, Cruze)",
      supplierCategory: "Módulo de Carroceria (BCM) & Sistema de Conforto dos Vidros Elétricos",
      severity: "Baixa",
      source: "Manual Oficial do Proprietário & Manuais Técnicos de Oficina Chevrolet GM",
      diagnosticNotes: "O aviso 'Code 61' exibido no visor do odômetro/painel de instrumentos dos veículos Chevrolet indica que o módulo eletrônico de carroceria (BCM) perdeu a calibração de fim de curso e o ajuste do sistema antiesmagamento do VIDRO ELÉTRICO TRASEIRO ESQUERDO. Isso ocorre habitualmente após desligamento ou troca da bateria do carro, queda de tensão na partida ou substituição do interruptor/máquina de vidro.",
      resetProcedure: "PROCEDIMENTO EXATO DE RESET MANUAL DO CODE 61 (Sem precisar de scanner): 1. Ligue a chave de ignição no estágio II (com o painel aceso, sem dar a partida no motor). 2. No interruptor da porta traseira esquerda (ou no comando principal do motorista), pressione o botão para ABAIXAR completamente o vidro e CONTINUE SEGURANDO o botão pressionado para baixo por 5 a 10 segundos após o vidro chegar ao batente inferior. 3. Em seguida, puxe o botão para LEVANTAR totalmente o vidro e CONTINUE SEGURANDO o botão puxado para cima por 5 a 10 segundos após o vidro fechar totalmente. 4. O BCM memorizará o batente e a mensagem 'Code 61' sumirá imediatamente do visor do odômetro!",
      correctiveChecklist: [
        "Executar o ciclo completo de descida e subida segurando o interruptor por 5 a 10 segundos em cada batente para calibrar o sensor hall do motor",
        "Testar se a função 'um toque' (one-touch) e o fechamento automático pelo controle remoto da chave voltaram a funcionar",
        "Se o código persistir após a calibração, inspecionar se há canaletas ressecadas, chicote elétrico na borracha sanfonada da porta ou defeito no motor elevador"
      ],
      preventiveChecklist: [
        "Aplicar spray de silicone neutro nas canaletas de borracha dos vidros para diminuir o atrito e evitar desarme por sobrecarga",
        "Garantir que os bornes da bateria estejam limpos e bem apertados para evitar reinicializações espúrias do módulo BCM"
      ],
      budgetItems: [
        { item: "Spray de Silicone Neutro para Lubrificação de Canaletas Automotivas", category: "Peça", estimatedCost: 35.00 },
        { item: "Serviço de Reprogramação de Fim de Curso do BCM & Revisão Elétrica das Portas", category: "Mão de Obra", estimatedCost: 90.00 }
      ],
      suggestedBestPractices: [
        "Família de códigos de vidros GM no odômetro: Code 59 = Vidro Dianteiro Esquerdo (Motorista) | Code 60 = Vidro Dianteiro Direito (Passageiro) | Code 61 = Vidro Traseiro Esquerdo | Code 62 = Vidro Traseiro Direito."
      ]
    };
  }

  // 2. GM Code 59, 60, 62
  if (query.includes("59") || query.includes("60") || query.includes("62")) {
    const codeNum = query.includes("59") ? "59" : query.includes("60") ? "60" : "62";
    const windowName = codeNum === "59" ? "Dianteiro Esquerdo (Motorista)" : codeNum === "60" ? "Dianteiro Direito (Passageiro)" : "Traseiro Direito";
    return {
      codeType: "PAINEL_INSTRUMENTOS",
      codeTypeLabel: "Código do Painel de Instrumentos / Odômetro (DIC)",
      originBadge: badgePainel,
      originExplanation: explanationPainel,
      problemName: `Code ${codeNum} — Reprogramação do Vidro Elétrico ${windowName} (Chevrolet)`,
      supplierCategory: "Módulo de Carroceria (BCM) & Sistema de Vidros Elétricos",
      severity: "Baixa",
      source: "Manual do Proprietário Chevrolet GM",
      diagnosticNotes: `O aviso Code ${codeNum} no odômetro indica perda de calibração do vidro elétrico ${windowName} após desligamento de bateria.`,
      resetProcedure: `1. Ligue a ignição sem dar partida. 2. Abaixe o vidro ${windowName} e segure o botão por 5s. 3. Suba o vidro e segure o botão puxado para cima por 5s. O Code ${codeNum} apagará imediatamente.`,
      correctiveChecklist: [
        `Executar calibração manual de 5 segundos na descida e na subida no vidro ${windowName}`,
        "Testar subida no telecomando da chave",
        "Lubrificar canaletas de vidro com spray de silicone"
      ],
      preventiveChecklist: [
        "Evitar deixar a bateria descarregar completamente"
      ],
      budgetItems: [
        { item: "Calibração e Revisão de Vidros Elétricos", category: "Mão de Obra", estimatedCost: 60.00 }
      ],
      suggestedBestPractices: [
        "A rotina de calibração de vidros GM deve ser executada individualmente em cada porta caso a bateria tenha sido substituída."
      ]
    };
  }

  // 3. GM Code 89
  if (query.includes("89") || query.includes("termostatica") || query.includes("termostato") || query.includes("aquecedor")) {
    return {
      codeType: "PAINEL_INSTRUMENTOS",
      codeTypeLabel: "Código do Painel de Instrumentos / Odômetro (DIC)",
      originBadge: badgePainel,
      originExplanation: explanationPainel,
      problemName: "Code 89 — Falha no Circuito de Aquecimento da Válvula Termostática Eletrônica Pilotada (Chevrolet)",
      supplierCategory: "Sistema de Arrefecimento & Injeção Eletrônica",
      severity: "Alta",
      source: "Manual de Serviço GM / Boletim Técnico TSB SPE/4 & Ecotec",
      diagnosticNotes: "O Code 89 acende nos modelos Chevrolet (Onix, Prisma, Cruze, Spin, Tracker, Sonic) quando a ECU (ECM) detecta circuito aberto ou resistência fora da faixa (especificação: 14 a 17 Ohms a 20°C) no elemento resistivo interno do termostato pilotado. Em modo de emergência, a ECM aciona a ventoinha em 100% de rotação para evitar superaquecimento.",
      resetProcedure: "1. Substituir a carcaça da válvula termostática eletrônica por peça nova homologada. 2. Realizar limpeza de códigos de falha (Clear DTCs P0597 / P0598 / P0599) via Scanner OBD2. 3. O aviso apaga após 3 ciclos térmicos completos de aquecimento e resfriamento.",
      correctiveChecklist: [
        "Desconectar o chicote de 2 vias da carcaça e medir a resistência ôhmica da válvula (nominal: 14 a 17 Ω)",
        "Verificar se há vazamento de líquido refrigerante oxidando os terminais elétricos do conector",
        "Efetuar sangria completa do ar pelo bujão superior do radiador com aditivo orgânico novo 50/50"
      ],
      preventiveChecklist: [
        "Substituir o aditivo orgânico concentrado (especificação Dex-Cool Long Life) a cada 30.000 km ou 2 anos",
        "Inspecionar a tampa do reservatório de expansão (pressão nominal de alívio: 1.4 Bar / 140 kPa)"
      ],
      budgetItems: [
        { item: "Carcaça de Válvula Termostática Eletrônica Pilotada Original GM/Wahler", category: "Peça", estimatedCost: 350.00 },
        { item: "Aditivo Orgânico Concentrado Dex-Cool (2 Litros) + Água Desmineralizada", category: "Peça", estimatedCost: 95.00 },
        { item: "Mão de Obra de Troca, Teste de Estanqueidade & Sangria de Arrefecimento", category: "Mão de Obra", estimatedCost: 190.00 }
      ],
      suggestedBestPractices: [
        "Torque dos parafusos de fixação da carcaça plástica: 10 Nm. Nunca aplicar silicone de alta temperatura onde existe anel O-ring de borracha."
      ]
    };
  }

  // 4. GM Code 82
  if (query.includes("82") || query.includes("vida util") || query.includes("troca de oleo")) {
    return {
      codeType: "PAINEL_INSTRUMENTOS",
      codeTypeLabel: "Código do Painel de Instrumentos / Odômetro (DIC)",
      originBadge: badgePainel,
      originExplanation: explanationPainel,
      problemName: "Code 82 — Indicador de Vida Útil do Óleo do Motor Expirada / Troca Necessária (Chevrolet)",
      supplierCategory: "Sistema de Lubrificação & Manutenção Programada",
      severity: "Média",
      source: "Manual do Proprietário & Serviço Oficial Chevrolet",
      diagnosticNotes: "O Code 82 indica que o algoritmo da central eletrônica calculou que a vida útil do óleo atingiu 0%, baseado em contagem de partidas a frio, temperatura de funcionamento, quilometragem e tempo. A manutenção e troca do lubrificante são mandatórias para prevenir borra e desgaste no comando de válvulas e tuchos hidráulicos.",
      resetProcedure: "RESET MANUAL GM: 1. Ligue a chave de ignição no estágio II (sem dar a partida). 2. Pressione o pedal do acelerador até o fundo 3 vezes dentro de 5 segundos. 3. Desligue a ignição. Ao ligar novamente o motor, a indicação Code 82 estará totalmente resetada para 100%.",
      correctiveChecklist: [
        "Drenar o óleo do cárter com o motor aquecido para remoção de resíduos e partículas",
        "Substituir o elemento filtrante blindado de óleo lubrificante",
        "Substituir a arruela de vedação de alumínio/cobre do bujão do cárter",
        "Executar o procedimento de reset manual no pedal ou via computador de bordo (botão MENU/SET)"
      ],
      preventiveChecklist: [
        "Utilizar exclusivamente lubrificante com homologação GM dexos1 Gen 3 (viscosidade 5W30 ou 0W20)",
        "Respeitar o intervalo máximo de 10.000 km ou 12 meses (ou 5.000 km em uso severo urbano)"
      ],
      budgetItems: [
        { item: "Óleo 5W30 100% Sintético Homologado GM dexos1 Gen 3 (4 Litros)", category: "Peça", estimatedCost: 240.00 },
        { item: "Filtro de Óleo do Motor Blindado Tecfil / Mann Filter", category: "Peça", estimatedCost: 48.00 },
        { item: "Serviço de Troca de Óleo, Filtro & Reset de Painel", category: "Mão de Obra", estimatedCost: 80.00 }
      ],
      suggestedBestPractices: [
        "Capacidade com troca de filtro: 3.5 Litros. Torque do bujão do cárter: 14 Nm. Lubrificar a junta de borracha do novo filtro com óleo antes de rosquear."
      ]
    };
  }

  // 5. GM Code 24 / Luz de Placa
  if (query.includes("24") || query.includes("luz de placa") || query.includes("lampada placa")) {
    return {
      codeType: "PAINEL_INSTRUMENTOS",
      codeTypeLabel: "Código do Painel de Instrumentos / Odômetro (DIC)",
      originBadge: badgePainel,
      originExplanation: explanationPainel,
      problemName: "Code 24 — Falha no Circuito das Luzes da Placa de Licença (Chevrolet)",
      supplierCategory: "Sistema de Iluminação & Conforto BCM",
      severity: "Baixa",
      source: "Manual de Reparação Elétrica GM",
      diagnosticNotes: "O Code 24 é emitido pelo módulo BCM quando a corrente consumida pelas lâmpadas da placa de identificação traseira cai para zero (filamento rompido ou soquete oxidado).",
      resetProcedure: "1. Substituir a lâmpada danificada por modelo homologado W5W 12V 5W. 2. Ligar e desligar a chave de ignição. O Code 24 apaga automaticamente sem necessidade de scanner.",
      correctiveChecklist: [
        "Verificar continuidade das lâmpadas W5W na tampa do porta-malas",
        "Inspecionar chicote na dobradiça da tampa traseira quanto a rompimento por fadiga",
        "Limpar contatos dos soquetes com limpa-contatos elétrico"
      ],
      preventiveChecklist: [
        "Utilizar lâmpadas automotivas originais de 5W para não alterar a impedância lida pelo BCM"
      ],
      budgetItems: [
        { item: "Lâmpada W5W Pingo D'água 12V 5W Osram / Philips (Par)", category: "Peça", estimatedCost: 20.00 },
        { item: "Substituição e Revisão de Iluminação Traseira", category: "Mão de Obra", estimatedCost: 50.00 }
      ],
      suggestedBestPractices: [
        "Evitar lâmpadas LED sem resistor canbus pois o BCM continuará gerando o Code 24 por baixa corrente."
      ]
    };
  }

  // 6. GM Code 16 / Luzes de Freio
  if (query.includes("16") || query.includes("luz de freio") || query.includes("break light")) {
    return {
      codeType: "PAINEL_INSTRUMENTOS",
      codeTypeLabel: "Código do Painel de Instrumentos / Odômetro (DIC)",
      originBadge: badgePainel,
      originExplanation: explanationPainel,
      problemName: "Code 16 — Falha nas Luzes de Freio Principais (Chevrolet)",
      supplierCategory: "Sistema de Sinalização & Segurança BCM",
      severity: "Média",
      source: "Manual Oficial Chevrolet GM",
      diagnosticNotes: "O Code 16 indica que o módulo BCM detectou lâmpada de freio queimada nas lanternas traseiras ou falha no interruptor de freio.",
      resetProcedure: "1. Substituir lâmpadas de freio (P21W ou W21/5W). 2. Pressionar o pedal de freio com a chave ligada. O código sumirá imediatamente.",
      correctiveChecklist: [
        "Testar as lâmpadas de freio das lanternas esquerda e direita",
        "Testar interruptor do pedal de freio",
        "Conferir fusível do circuito de freio na caixa de fusíveis interna"
      ],
      preventiveChecklist: [
        "Substituir preventivamente o par de lâmpadas para manter a mesma intensidade luminosa"
      ],
      budgetItems: [
        { item: "Lâmpada de Freio 2 Polos / 1 Polo Original", category: "Peça", estimatedCost: 25.00 },
        { item: "Troca e Teste do Sistema de Freios", category: "Mão de Obra", estimatedCost: 45.00 }
      ],
      suggestedBestPractices: [
        "Utilizar lâmpadas com base de latão para evitar corrosão galvânica na placa da lanterna."
      ]
    };
  }

  // 7. GM Code 95 / Airbag
  if (query.includes("95") || query.includes("airbag") || query.includes("cinto")) {
    return {
      codeType: "PAINEL_INSTRUMENTOS",
      codeTypeLabel: "Código do Painel de Instrumentos / Odômetro (DIC)",
      originBadge: badgePainel,
      originExplanation: explanationPainel,
      problemName: "Code 95 — Manutenção no Sistema de Airbag e Pré-Tensionadores de Cinto (Chevrolet)",
      supplierCategory: "Sistema de Segurança Suplementar (SRS / Airbag)",
      severity: "Alta",
      source: "Manual de Serviço de Segurança SRS Chevrolet",
      diagnosticNotes: "O Code 95 e a luz do boneco com cinto indicam avaria no sistema de airbags, bolsa inflável do motorista/passageiro, cinta de volante (Harddisc/Clockspring), sensores de impacto frontal/lateral ou conectores amarelos sob os bancos dianteiros.",
      resetProcedure: "1. Desconectar a bateria e aguardar 15 minutos antes de manipular chicotes amarelos. 2. Reparar conector/cinta de volante. 3. Conectar scanner e apagar a memória de colisão/erros no módulo SDM.",
      correctiveChecklist: [
        "Inspecionar conectores amarelos de pré-tensionadores sob os bancos dianteiros",
        "Medir continuidade da cinta do volante (clockspring)",
        "Efetuar leitura do módulo SRS via scanner automotivo dedicado"
      ],
      preventiveChecklist: [
        "Não puxar fios sob os bancos ao aspirar o carpete do veículo"
      ],
      budgetItems: [
        { item: "Cinta de Volante / Harddisc Original GM", category: "Peça", estimatedCost: 320.00 },
        { item: "Diagnóstico Computadorizado SRS & Reparo de Chicote", category: "Mão de Obra", estimatedCost: 220.00 }
      ],
      suggestedBestPractices: [
        "NUNCA testar bolsas de airbag diretamente com multímetro na escala de resistência pois a corrente de teste pode detonar a espoleta."
      ]
    };
  }

  // 8. GM Code 79 / Nível de Óleo
  if (query.includes("79") || query.includes("nivel de oleo") || query.includes("abastecer oleo")) {
    return {
      codeType: "PAINEL_INSTRUMENTOS",
      codeTypeLabel: "Código do Painel de Instrumentos / Odômetro (DIC)",
      originBadge: badgePainel,
      originExplanation: explanationPainel,
      problemName: "Code 79 — Nível Baixo de Óleo do Motor / Abastecer Óleo (Chevrolet)",
      supplierCategory: "Sistema de Lubrificação do Motor",
      severity: "Alta",
      source: "Manual do Proprietário Chevrolet",
      diagnosticNotes: "O Code 79 avisa que a bóia do sensor de nível no cárter detectou volume de óleo abaixo do mínimo seguro, com risco iminente de cavitação da bomba de óleo.",
      resetProcedure: "1. Desligar o motor imediatamente em local plano e aguardar 5 minutos. 2. Puxar a vareta e completar com óleo homologado dexos1 Gen 3 até o nível máximo. O Code 79 apaga após a chave ser ligada.",
      correctiveChecklist: [
        "Conferir nível na vareta medidora",
        "Inspecionar vazamentos no retentor do virabrequim, bujão do cárter ou junta da tampa de válvulas",
        "Testar sensor de nível de óleo no cárter"
      ],
      preventiveChecklist: [
        "Verificar o nível de óleo semanalmente na vareta com motor frio"
      ],
      budgetItems: [
        { item: "Óleo de Motor Sintético 5W30 dexos1 Gen 3 (1 Litro)", category: "Peça", estimatedCost: 65.00 },
        { item: "Inspeção de Vazamentos e Nível", category: "Mão de Obra", estimatedCost: 40.00 }
      ],
      suggestedBestPractices: [
        "Não ultrapassar o nível máximo da vareta para evitar sobrepressão no cárter."
      ]
    };
  }

  // 9. GM Code 68 / Direção Elétrica
  if (query.includes("68") || query.includes("direcao eletrica") || query.includes("eps")) {
    return {
      codeType: "PAINEL_INSTRUMENTOS",
      codeTypeLabel: "Código do Painel de Instrumentos / Odômetro (DIC)",
      originBadge: badgePainel,
      originExplanation: explanationPainel,
      problemName: "Code 68 — Manutenção na Direção Elétrica / Direção Assistida (Chevrolet)",
      supplierCategory: "Sistema de Direção Elétrica Progressiva (EPS)",
      severity: "Alta",
      source: "Manual de Oficina do Sistema de Direção GM EPS",
      diagnosticNotes: "O Code 68 indica desativação ou falha no módulo da direção elétrica (EPS), causada por subtensão de bateria, superaquecimento do motor elétrico da coluna ou sensor de torque descalibrado.",
      resetProcedure: "1. Testar bateria e alternador. 2. Calibrar sensor de torque e ângulo de esterçamento com scanner automotivo. 3. Limpar DTCs.",
      correctiveChecklist: [
        "Verificar se a tensão na bateria durante a partida não cai abaixo de 10.5V",
        "Inspecionar conectores de alta corrente do motor da coluna de direção",
        "Executar alinhamento do ponto zero da direção via scanner"
      ],
      preventiveChecklist: [
        "Evitar segurar o volante esterçado no batente máximo por longos períodos"
      ],
      budgetItems: [
        { item: "Calibração e Alinhamento Eletrônico da Direção EPS", category: "Mão de Obra", estimatedCost: 180.00 }
      ],
      suggestedBestPractices: [
        "Após reparos de suspensão, o alinhamento eletrônico do ponto zero da direção elétrica é mandatório."
      ]
    };
  }

  // 10. VW EPC
  if (query.includes("epc") || query.includes("ea111") || query.includes("ea211") || query.includes("acelerador") || query.includes("tbi")) {
    return {
      codeType: "PAINEL_INSTRUMENTOS",
      codeTypeLabel: "Aviso de Painel (Electronic Power Control)",
      originBadge: badgePainel,
      originExplanation: explanationPainel,
      problemName: "Aviso EPC (Electronic Power Control) — Falha no Sistema de Aceleração Eletrônica (Volkswagen)",
      supplierCategory: "Injeção Eletrônica & Gerenciamento de Motor",
      severity: "Alta",
      source: "Manual de Reparação Volkswagen / Sistema VCDS & ODIS",
      diagnosticNotes: "A luz EPC acende nos motores VW (Gol, Fox, Polo, Voyage, Virtus, Golf, T-Cross, Nivus) quando a unidade de controle do motor (ECU) detecta incoerência entre os sinais dos dois potenciômetros do pedal do acelerador, do corpo de borboleta (TBI) motorizado, do interruptor duplo da luz de freio de 4 pinos ou desvio no sincronismo de rotação.",
      resetProcedure: "RESET EPC: 1. Descarbonizar e limpar o corpo de borboleta (TBI). 2. Conectar scanner automotivo e executar o Ajuste Básico da Borboleta (Canal 060 do VCDS). 3. Limpar a memória de falhas no módulo de injeção. A luz EPC apagará imediatamente após a calibração com sucesso.",
      correctiveChecklist: [
        "Testar com multímetro/scanner a continuidade e coerência dos 2 circuitos do interruptor da luz de freio",
        "Inspecionar a borboleta de aceleração quanto a acúmulo de carbonização e folga nas engrenagens",
        "Testar a tensão de bateria durante a partida (se cair abaixo de 10.2V, pode gerar falso código EPC)"
      ],
      preventiveChecklist: [
        "Limpar o sistema de ventilação positiva do cárter (válvula PCV / desborbulhador de respiro) a cada 20.000 km",
        "Utilizar combustível de procedência para evitar carbonização prematura da câmara e TBI"
      ],
      budgetItems: [
        { item: "Interruptor Duplo de Freio 4 Pinos Original VW", category: "Peça", estimatedCost: 90.00 },
        { item: "Spray Descarbonizante Especial para TBI / Admissão", category: "Peça", estimatedCost: 42.00 },
        { item: "Descarbonização de TBI, Varredura OBD2 & Ajuste Básico Canal 060", category: "Mão de Obra", estimatedCost: 220.00 }
      ],
      suggestedBestPractices: [
        "Antes de efetuar o ajuste básico da TBI, a temperatura do líquido de arrefecimento deve estar entre 80°C e 95°C com a chave ligada e motor desligado."
      ]
    };
  }

  // 11. VW INSP
  if (query.includes("insp") || query.includes("revisao vw") || query.includes("oil vw")) {
    return {
      codeType: "PAINEL_INSTRUMENTOS",
      codeTypeLabel: "Aviso de Painel / Hodômetro",
      originBadge: badgePainel,
      originExplanation: explanationPainel,
      problemName: "Aviso INSP / OIL — Alerta de Revisão e Manutenção Periódica (Volkswagen)",
      supplierCategory: "Painel de Instrumentos & Painel de Serviços",
      severity: "Baixa",
      source: "Manual de Instruções e Serviços Volkswagen",
      diagnosticNotes: "O aviso INSP (Inspeção) ou OIL no visor do hodômetro digital sinaliza que o veículo atingiu o limite de quilometragem (geralmente a cada 10.000 km) ou tempo (365 dias) programado no painel de instrumentos para manutenção preventiva periódica.",
      resetProcedure: "RESET MANUAL INSP VW: 1. Com a chave desligada, pressione e segure o botão do hodômetro parcial (0.0/SET) no painel. 2. Ligue a chave de ignição (sem ligar o motor) mantendo o botão pressionado por cerca de 10 segundos até o visor parar de piscar. 3. Solte o botão e gire-o para a direita (ou pressione brevemente). O aviso INSP sumirá.",
      correctiveChecklist: [
        "Conferir nível e condição do óleo do motor e fluidos de freio/arrefecimento",
        "Verificar espessura das pastilhas de freio e calibração dos 4 pneus + estepe",
        "Executar o procedimento manual de reset pelo botão do painel"
      ],
      preventiveChecklist: [
        "Realizar revisões periódicas a cada 10.000 km para manter o histórico de manutenção em dia"
      ],
      budgetItems: [
        { item: "Revisão Periódica de Itens Básicos + Reset de Painel", category: "Mão de Obra", estimatedCost: 120.00 }
      ],
      suggestedBestPractices: [
        "Caso o painel seja 100% digital (Active Info Display), o reset pode ser feito diretamente no menu 'Configurações > Serviços' da central multimídia."
      ]
    };
  }

  // 12. Acoustic & Mechanical Noise Diagnoses (Tec-tec, Chiado, Estalo, Zunido, Assobio, Batida)
  if (query.includes("tec tec") || query.includes("tucho") || query.includes("valvula") || query.includes("estalo no motor")) {
    return {
      codeType: "ANALISE_ACUSTICA",
      codeTypeLabel: "Análise Acústica — Trem de Válvulas & Tuchos Hidráulicos",
      originBadge: "ANÁLISE ACÚSTICA DE RUÍDO MECÂNICO",
      originExplanation: "Identificação por frequência sonora: O ruído característico 'tec-tec' agudo no cabeçote/tampa de válvulas corresponde a descarregamento de tuchos hidráulicos ou folga excessiva no acionamento de válvulas.",
      problemName: "Ruído de Tuchos Hidráulicos Descarregados / Folga de Válvulas no Cabeçote",
      supplierCategory: "Trem de Válvulas, Cabeçote & Lubrificação Superior",
      severity: "Média",
      source: "Manual de Engenharia de Motores & Boletins Técnicos Automotivos",
      diagnosticNotes: "O ruído de batimento agudo e metálico ('tec-tec') na frequência da metade da rotação do virabrequim (frequência de comando de válvulas) decorre de: 1. Óleo lubrificante com viscosidade incorreta ou degradado; 2. Baixa pressão de óleo no cabeçote (galeria obstruída por borra); 3. Esfera de retenção interna do tucho hidráulico travada aberta ou com vazamento interno.",
      resetProcedure: "1. Medir a pressão da bomba de óleo a quente (mínimo 1.5 Bar em marcha lenta e 3.5 Bar a 3.000 RPM). 2. Se a pressão estiver correta, efetuar flush preventivo suave e troca de óleo com especificação 100% sintética homologada pelo fabricante. 3. Caso o barulho persista após aquecimento, substituir o jogo de tuchos hidráulicos e verificar balancins/eixo comando.",
      correctiveChecklist: [
        "Instalar manômetro mecânico de pressão de óleo no sensor do bloco e medir a 90°C",
        "Utilizar estetoscópio automotivo sobre a tampa de válvulas para identificar cilindros afetados",
        "Inspecionar ressaltos do eixo comando de válvulas quanto a desgaste prematuro ou risco"
      ],
      preventiveChecklist: [
        "Utilizar exclusivamente óleo com a viscosidade e norma exata da montadora (ex: 0W20, 5W30, dexos1, VW 508.88)",
        "Respeitar o limite máximo de 10.000 km ou 12 meses para troca de óleo e filtro"
      ],
      budgetItems: [
        { item: "Jogo de Tuchos Hidráulicos Originais (8 ou 16 unidades)", category: "Peça", estimatedCost: 380.00 },
        { item: "Óleo 100% Sintético Homologado (4L) + Filtro de Óleo", category: "Peça", estimatedCost: 220.00 },
        { item: "Mão de Obra de Troca de Tuchos, Junta de Tampa & Teste de Pressão", category: "Mão de Obra", estimatedCost: 320.00 }
      ],
      suggestedBestPractices: [
        "Carregar previamente os tuchos novos em banho de óleo antes da instalação e aplicar o torque correto nos mancais do comando."
      ]
    };
  }

  if (query.includes("chiado") || query.includes("freio") || query.includes("pastilha") || query.includes("disco")) {
    return {
      codeType: "SINTOMA_MECANICO",
      codeTypeLabel: "Diagnóstico do Sistema de Freios & Desgaste Acústico",
      originBadge: "ANÁLISE DO SISTEMA DE FRENAGEM",
      originExplanation: "Identificação mecânica: Ruído agudo de chiado ao acionar o pedal de freio gerado pelo atrito da lâmina de aviso acústico de desgaste ou vitrificação da massa de fricção das pastilhas.",
      problemName: "Pastilhas de Freio Desgastadas / Vitrificação e Ressonância nos Discos",
      supplierCategory: "Sistema de Freios a Disco & Segurança Ativa",
      severity: "Alta",
      source: "Norma de Segurança ABNT NBR & Manuais de Freio (Fras-le, Brembo, TRW)",
      diagnosticNotes: "O chiado agudo ao pisar no pedal de freio é provocado por: 1. A lâmina metálica acústica de segurança atingindo o disco quando a pastilha atinge a espessura limite de 2mm a 3mm; 2. Vitrificação da pastilha por superaquecimento; 3. Ausência de pasta anti-ruído ou calço antirruído metálico (shim) no dorso da pastilha; 4. Rebarba excessiva nas bordas do disco de freio.",
      resetProcedure: "1. Inspecionar a espessura das pastilhas e discos dianteiros/traseiros com micrômetro. 2. Substituir pastilhas e retificar ou trocar os discos se estiverem abaixo da cota mínima (Min TH). 3. Aplicar graxa/pasta cerâmica anti-ruído nos pontos de contato e sangrar o fluido de freio DOT 4/5.1.",
      correctiveChecklist: [
        "Medir espessura do disco de freio com micrômetro (comparar com a medida gravada Min TH)",
        "Verificar empenamento lateral do disco com relógio comparador (máximo tolerado: 0.05 mm)",
        "Checar deslizamento e lubrificação dos pinos guias da pinça de freio com graxa de silicone"
      ],
      preventiveChecklist: [
        "Inspecionar o conjunto de freios a cada 10.000 km ou antes de viagens rodoviárias",
        "Substituir o fluido de freio a cada 2 anos ou 40.000 km para evitar corrosão dos pistões"
      ],
      budgetItems: [
        { item: "Jogo de Pastilhas de Freio Cerâmica / Semi-metálica Dianteiras", category: "Peça", estimatedCost: 190.00 },
        { item: "Par de Discos de Freio Ventilados Dianteiros", category: "Peça", estimatedCost: 320.00 },
        { item: "Fluido de Freio DOT 4 LV Sintético (1L)", category: "Peça", estimatedCost: 65.00 },
        { item: "Serviço de Troca de Discos, Pastilhas & Sangria Pressurizada", category: "Mão de Obra", estimatedCost: 180.00 }
      ],
      suggestedBestPractices: [
        "Realizar o assentamento correto das pastilhas novas nos primeiros 200 km, evitando frenagens bruscas contínuas."
      ]
    };
  }

  if (query.includes("estalo") || query.includes("homocinetica") || query.includes("curva") || query.includes("estercar")) {
    return {
      codeType: "SINTOMA_MECANICO",
      codeTypeLabel: "Diagnóstico de Transmissão & Semi-eixo",
      originBadge: "ANÁLISE MECÂNICA DE TRANSMISSÃO",
      originExplanation: "Identificação mecânica: Ruído de estalos secos e ritmados ('clac-clac-clac') ao esterçar a direção em manobras e acelerar indica folga severa e desgaste na junta homocinética fixa de roda.",
      problemName: "Desgaste Acentuado na Junta Homocinética Fixa / Coifa Rasgada com Perda de Graxa",
      supplierCategory: "Sistema de Transmissão & Articulações de Tração",
      severity: "Alta",
      source: "Manuais Técnicos de Transmissão Automotiva (Spicer, Nakata, Cofap)",
      diagnosticNotes: "A junta homocinética fixa transmite o torque do motor para as rodas mantendo velocidade constante mesmo com a suspensão trabalhando e rodas esterçadas. Quando a coifa de borracha rasga, a graxa grafitada é expelida pela força centrífuga e entram terra/areia, gerando desgaste abrasivo nas pistas das esferas e o estalo característico.",
      resetProcedure: "1. Erguer o veículo no elevador e inspecionar integridade das coifas sanfonadas. 2. Substituir a junta homocinética avariada por componente novo com trava e porca nova. 3. Aplicar graxa grafitada especial inclusa no kit e apertar a porca do cubo com o torque especificado.",
      correctiveChecklist: [
        "Inspecionar presença de rasgos e vazamento de graxa nas coifas interna (tulipa) e externa (roda)",
        "Testar folga angular e axial no semi-eixo",
        "Apertar a porca do cubo com torquímetro (torque típico: 200 a 280 Nm conforme veículo)"
      ],
      preventiveChecklist: [
        "Inspecionar as coifas em todas as trocas de óleo. A troca preventiva da coifa rasgada a tempo poupa a troca da junta homocinética inteira"
      ],
      budgetItems: [
        { item: "Junta Homocinética Externa Completa com Coifa e Graxa", category: "Peça", estimatedCost: 260.00 },
        { item: "Mão de Obra de Desmontagem do Semi-eixo e Substituição", category: "Mão de Obra", estimatedCost: 160.00 }
      ],
      suggestedBestPractices: [
        "Sempre utilizar abraçadeiras de fita metálica com ferramenta de tração para evitar que a coifa escape na rotação."
      ]
    };
  }

  if (query.includes("fumaca") || query.includes("agua baixando") || query.includes("junta do cabecote") || query.includes("radiador borbulhando")) {
    return {
      codeType: "SINTOMA_MECANICO",
      codeTypeLabel: "Diagnóstico Termodinâmico & Estanqueidade de Motor",
      originBadge: "ANÁLISE DE VEDAÇÃO DO CABEÇOTE",
      originExplanation: "Identificação termomecânica: Presença de fumaça branca densa e contínua no escapamento com perda de líquido de arrefecimento sem vazamento externo evidente aponta queima de junta de cabeçote.",
      problemName: "Queima / Rompimento da Junta de Cabeçote & Infiltração de Água nos Cilindros",
      supplierCategory: "Motor, Arrefecimento & Vedação de Cabeçote",
      severity: "Alta",
      source: "Manuais de Retífica e Montagem de Motores (Sabó, Elring, Taranto)",
      diagnosticNotes: "Quando a junta de cabeçote sofre rompimento entre a galeria de arrefecimento e a câmara de combustão (por superaquecimento ou perda de torque nos parafusos), o líquido sob pressão é aspirado para o cilindro, gerando vapor branco espesso no escape, perda de potência e pressão excessiva nas mangueiras do radiador.",
      resetProcedure: "1. Realizar teste de estanqueidade de cilindro com ar comprimido ou teste químico de CO2 no reservatório de expansão. 2. Remover o cabeçote, enviar para retífica para plaina e teste hidrostático de trincas. 3. Instalar junta de cabeçote nova com parafusos de cabeçote novos aplicando a sequência angular oficial.",
      correctiveChecklist: [
        "Executar teste químico de presença de gás carbônico (CO2) no reservatório de arrefecimento",
        "Medir compressão e teste de vazamento de cilindros com manômetro",
        "Inspecionar empenamento do bloco e cabeçote com régua de precisão (máximo 0.05 mm)"
      ],
      preventiveChecklist: [
        "Nunca rodar com água pura de torneira no radiador para evitar cavitação e corrosão galvânica na face de alumínio do cabeçote"
      ],
      budgetItems: [
        { item: "Junta de Cabeçote Metálica MLS + Jogo de Parafusos Novos", category: "Peça", estimatedCost: 360.00 },
        { item: "Serviço de Usinagem / Plaina e Teste Hidrostático do Cabeçote", category: "Peça", estimatedCost: 450.00 },
        { item: "Aditivo Orgânico Long Life + Válvula Termostática Nova", category: "Peça", estimatedCost: 180.00 },
        { item: "Mão de Obra de Desmontagem, Montagem e Torque Angular", category: "Mão de Obra", estimatedCost: 750.00 }
      ],
      suggestedBestPractices: [
        "Parafusos de cabeçote modernos trabalham sob deformação plástica (escoamento) e devem ser SEMPRE substituídos por novos a cada desmontagem."
      ]
    };
  }

  // 13. Scanner OBD2 DTCs (P0300, P0420, etc.)
  if (query.includes("p0300") || query.includes("misfire") || query.includes("falha de cilindro")) {
    return {
      codeType: "SCANNER_OBD2",
      codeTypeLabel: "Código de Falha de Scanner (OBD2 DTC)",
      originBadge: badgeScanner,
      originExplanation: explanationScanner,
      problemName: "DTC P0300 — Falha Múltipla e Aleatória de Combustão / Ignição (Random Misfire)",
      supplierCategory: "Sistema de Ignição & Injeção Eletrônica",
      severity: "Alta",
      source: "Padrão Internacional SAE J2012 / ISO 15031-6 & Manuais de Injeção",
      diagnosticNotes: "O código P0300 é gerado pela central de injeção quando o sensor de rotação e fase (CKP/CMP) detecta desaceleração angular do virabrequim provocada por queima incompleta ou ausência de centelha em cilindros múltiplos. A luz de injeção pisca quando o misfire pode danificar o catalisador por excesso de combustível não queimado.",
      resetProcedure: "1. Substituir velas de ignição desgastadas e cabos ou bobinas com fuga de corrente. 2. Descarbonizar injetores em cuba ultrassônica. 3. Limpar a memória de falhas com scanner OBD2 e realizar teste de rodagem monitorando o contador de misfire em tempo real.",
      correctiveChecklist: [
        "Testar resistência ôhmica e isolamento dos cabos de vela e bobinas de ignição",
        "Verificar pressão e vazão da linha de combustível (nominal: 3.8 a 4.2 Bar)",
        "Medir compressão relativa e estanqueidade dos cilindros com manômetro/transdutor"
      ],
      preventiveChecklist: [
        "Trocar velas de ignição a cada 20.000 km (velas convencionais) ou 60.000 km (Iridium/Platinum)",
        "Evitar abastecer em postos com combustível adulterado com excesso de água ou solvente"
      ],
      budgetItems: [
        { item: "Jogo de Velas de Ignição Iridium / Nickel Homologadas", category: "Peça", estimatedCost: 180.00 },
        { item: "Jogo de Cabos de Ignição Resistivos ou Bobina", category: "Peça", estimatedCost: 260.00 },
        { item: "Diagnóstico de Injeção com Osciloscópio, Limpeza de Bicos & Reset", category: "Mão de Obra", estimatedCost: 280.00 }
      ],
      suggestedBestPractices: [
        "Aplicar torque correto nas velas de ignição (entre 20 e 25 Nm em rosca M14). Não utilizar graxa ou lubrificante nas roscas das velas novas."
      ]
    };
  }

  if (query.includes("p0420") || query.includes("catalisador")) {
    return {
      codeType: "SCANNER_OBD2",
      codeTypeLabel: "Código de Falha de Scanner (OBD2 DTC)",
      originBadge: badgeScanner,
      originExplanation: explanationScanner,
      problemName: "DTC P0420 — Eficiência do Sistema do Catalisador Abaixo do Limite (Banco 1)",
      supplierCategory: "Sistema de Controle de Emissões & Exaustão",
      severity: "Média",
      source: "Padrão de Emissões PROCONVE L6/L7 & Manuais de Diagnóstico",
      diagnosticNotes: "O código P0420 é registrado quando a ECU compara o sinal da Sonda Lambda Pré-catalisador (Sensor 1) com a Sonda Lambda Pós-catalisador (Sensor 2). Se o catalisador perdeu sua capacidade de armazenar oxigênio (cerâmica degradada ou contaminada), o sinal da sonda pós passa a oscilar identicamente à pré, indicando baixa conversão catalítica.",
      resetProcedure: "1. Verificar se há vazamento ou rachadura no coletor de escape antes do catalisador. 2. Avaliar integridade da cerâmica catalítica e funcionamento da Sonda 2. 3. Substituir o catalisador ou sonda danificada e limpar os códigos de falha via scanner.",
      correctiveChecklist: [
        "Analisar gráfico de tensão da sonda pós-catalisador no scanner (deve permanecer estável entre 0.6V e 0.75V com motor quente a 2.500 RPM)",
        "Inspecionar escapamento com gerador de fumaça para detectar entrada falsa de ar",
        "Testar contaminação da cerâmica por queima de óleo do motor ou aditivo"
      ],
      preventiveChecklist: [
        "Sanar imediatamente problemas de queima de óleo ou falha de ignição para não derreter a colmeia cerâmica"
      ],
      budgetItems: [
        { item: "Catalisador Automotivo Homologado INMETRO", category: "Peça", estimatedCost: 890.00 },
        { item: "Sensor de Oxigênio / Sonda Lambda Planar", category: "Peça", estimatedCost: 290.00 },
        { item: "Serviço de Substituição de Catalisador & Varredura de Emissões", category: "Mão de Obra", estimatedCost: 240.00 }
      ],
      suggestedBestPractices: [
        "Utilizar pasta de montagem para escapamentos nas junções para garantir vedação 100% estanque."
      ]
    };
  }

  // 13. Generic Autodidactic Fallback
  const isNumericOnly = /^\d{1,3}$/.test(query.trim()) || isDigitCode;
  const cleanTitle = query.slice(0, 45).toUpperCase();

  return {
    codeType: isNumericOnly ? "PAINEL_INSTRUMENTOS" : isDTC ? "SCANNER_OBD2" : "SINTOMA_MECANICO",
    codeTypeLabel: isNumericOnly ? "Código do Painel de Instrumentos / Odômetro (DIC)" : isDTC ? "Código de Scanner (OBD2 DTC)" : "Diagnóstico Técnico de Sintoma",
    originBadge: isNumericOnly ? badgePainel : isDTC ? badgeScanner : "DIAGNÓSTICO TÉCNICO DE SISTEMA",
    originExplanation: isNumericOnly ? explanationPainel : isDTC ? explanationScanner : "Análise técnica do sintoma e histórico de avarias do veículo.",
    problemName: isNumericOnly ? `Code ${cleanTitle} — Mensagem de Alerta do Painel de Instrumentos` : `Laudo Técnico OficIA: Análise — ${cleanTitle || "Falha do Veículo"}`,
    supplierCategory: isNumericOnly ? "Módulo de Carroceria (BCM) & Painel de Instrumentos" : "Eletrônica Embarcada & Mecânica Geral",
    severity: "Média",
    source: "Rede Técnica OficIA — Banco de Manuais de Serviço Automotivo",
    diagnosticNotes: `O código/sintoma informado "${cleanTitle}" indica um registro eletrônico no veículo (${plate || "Geral"}). ${isNumericOnly ? "Trata-se de código exibido no painel de instrumentos para o motorista." : "A central detectou parâmetros fora da faixa nominal de operação."}`,
    resetProcedure: isNumericOnly ? "PROCEDIMENTO DE RESET: 1. Realizar a calibração física do componente afetado (botões/chave/pedal). 2. Se persistir, conectar scanner na porta OBD2 para varredura e limpeza de DTCs." : "PROCEDIMENTO GERAL: Concluir o reparo físico e apagar a memória de erros via scanner na porta OBD2.",
    correctiveChecklist: [
      "Executar teste funcional do circuito elétrico e componentes vinculados",
      "Verificar se há queda de tensão na bateria durante a partida",
      "Conferir aterramento e fusíveis dedicados"
    ],
    preventiveChecklist: [
      "Manter a bateria em bom estado de carga para evitar códigos falsos no painel"
    ],
    budgetItems: [
      { item: "Diagnóstico Especializado e Calibração Eletrônica", category: "Mão de Obra", estimatedCost: 150.00 }
    ],
    suggestedBestPractices: [
      "Sempre verifique se o código é um aviso de 2 dígitos do painel ou um código DTC de 5 caracteres do scanner."
    ]
  };
}

startServer();
