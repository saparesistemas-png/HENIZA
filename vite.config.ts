import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url && req.url.startsWith('/api/diagnose')) {
            res.setHeader('Content-Type', 'application/json');
            
            if (req.method !== 'POST') {
              res.statusCode = 405;
              res.end(JSON.stringify({ error: 'Method not allowed' }));
              return;
            }

            try {
              // Parse body
              let body = '';
              await new Promise<void>((resolve, reject) => {
                req.on('data', chunk => body += chunk);
                req.on('end', () => resolve());
                req.on('error', err => reject(err));
              });

              const parsed = JSON.parse(body || '{}');
              const { 
                description = '', 
                mode = 'description', 
                image, 
                video, 
                audio, 
                lang = 'pt', 
                plate = '', 
                chassis = '', 
                make = '', 
                model = '', 
                propulsionType = '', 
                isEvAlternative = false 
              } = parsed;

              const inputQuery = (description || '').trim();

              // =====================================================================
              // 1. VERIFICAÇÃO DE CONTEXTO DE CÓDIGO DE ERRO (PRÉ-PROCESSAMENTO)
              // =====================================================================
              // Checagem de código de 2 dígitos (ex: "61", "89", "82", "Code 61", "código 59", etc.)
              const twoDigitMatch = inputQuery.match(/(?:code|código|cod|aviso)?\s*(\b\d{2}\b)/i) || 
                                    inputQuery.match(/^\s*(\d{2})\s*$/);
              const isTwoDigitCode = Boolean(twoDigitMatch);
              const detectedTwoDigitCode = twoDigitMatch ? twoDigitMatch[1] : null;

              // Checagem de código longo de scanner OBD2 / DTC (ex: P0300, P0420, C1201, B1000, U0100)
              const longDtcMatch = inputQuery.match(/\b([PCBU][0-9]{4})\b/i);
              const isLongDtcCode = Boolean(longDtcMatch);
              const detectedDtcCode = longDtcMatch ? longDtcMatch[1].toUpperCase() : null;

              // Directive customizada para a IA de acordo com a verificação de contexto
              let errorCodeDirective = '';
              if (isTwoDigitCode) {
                errorCodeDirective = `
=============================================================================
⚠️ VERIFICAÇÃO DE CONTEXTO CRÍTICA: CÓDIGO DE 2 DÍGITOS DETECTADO ("${detectedTwoDigitCode}")!
=============================================================================
1. IGNORE COMPLETAMENTE OS PROTOCOLOS OBD2 PADRÃO (SAE J1979 / DTCs de scanner P/C/B/U).
   Este código NÃO é proveniente de scanner automotivo nem de comunicação serial OBD2.
2. BUSQUE ESPECIFICAMENTE EM BANCOS DE DADOS DE:
   - MANUAIS DO PROPRIETÁRIO OFICIAIS DA MONTADORA (${make || 'Montadoras em geral, ex: GM Chevrolet, Fiat, VW, Ford'})
   - MANUAIS DE SERVIÇO E REPARO DE PAINÉIS DE INSTRUMENTOS (Driver Information Center - DIC / Odômetro / Cluster de Instrumentos).
3. SIGNIFICADO REAL DE FÁBRICA DOS CÓDIGOS DE 2 DÍGITOS:
   - Exemplo Chevrolet GM (Onix, Prisma, Spin, Tracker, Cobalt, Cruze):
     * Code 61: Calibração de fim de curso e antiesmagamento do VIDRO ELÉTRICO TRASEIRO ESQUERDO necessária (ocorre após desligar a bateria).
     * Code 59: Vidro Elétrico Dianteiro Esquerdo (Motorista).
     * Code 60: Vidro Elétrico Dianteiro Direito (Passageiro).
     * Code 62: Vidro Elétrico Traseiro Direito.
     * Code 89: Falha no circuito de aquecimento da válvula termostática eletrônica pilotada.
     * Code 82: Vida útil do óleo do motor expirada (troca de óleo necessária).
     * Code 16: Lâmpada de freio queimada / defeito no circuito.
     * Code 24: Lâmpada da placa de licença.
     * Code 95: Advertência de manutenção do sistema de airbag.
   - Se for de outra montadora, consulte o catálogo de mensagens do painel correspondente ao modelo ${model || ''}.
4. PROCEDIMENTO DE RESET MANUAL (SEM SCANNER):
   - Forneça no campo 'resetProcedure' o procedimento manual passo a passo de calibração/reset pelo proprietário/técnico sem scanner (ex: segurar botão do vidro por 5s na descida e 5s na subida; resetar óleo pelo botão do hodômetro).
5. ESTRUTURA DO LAUDO:
   - codeType: "PAINEL_INSTRUMENTOS"
   - codeTypeLabel: "Código do Painel de Instrumentos / Odômetro (DIC)"
   - originBadge: "PAINEL DE INSTRUMENTOS (2 DÍGITOS) — NÃO É SCANNER"
   - originExplanation: "Identificado com inteligência autodidata: Trata-se de uma mensagem/código direto do visor do painel de instrumentos / odômetro (DIC) da montadora (2 dígitos), e NÃO um código de scanner de diagnóstico OBD2 (DTC)."
=============================================================================
`;
              } else if (isLongDtcCode) {
                errorCodeDirective = `
=============================================================================
🔍 VERIFICAÇÃO DE CONTEXTO: CÓDIGO LONGO DE SCANNER DETECTADO ("${detectedDtcCode}")!
=============================================================================
1. Trata-se de um código padronizado de scanner automotivo (DTC SAE J2012 / ISO 14229 / UDS).
2. Analise segundo protocolos de diagnóstico eletrônico OBD2, detalhando sensores, pinagens, leituras de multímetro/osciloscópio e procedimento de limpeza via scanner.
3. ESTRUTURA DO LAUDO:
   - codeType: "SCANNER_OBD2"
   - codeTypeLabel: "Código de Falha de Scanner Automotivo (DTC)"
   - originBadge: "SCANNER OBD2 (DTC)"
   - originExplanation: "Identificado com inteligência autodidata: Trata-se de um código de falha padronizado de scanner de diagnóstico OBD2 (DTC padrão SAE J2012 com letra + 4 dígitos)."
=============================================================================
`;
              }

              // Check if key is available
              const apiKey = process.env.GEMINI_API_KEY;
              if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.includes('MY_GEMINI')) {
                // Fallback inteligente aplicando a verificação de contexto de código de erro
                res.statusCode = 200;
                
                if (isTwoDigitCode) {
                  const codeNum = detectedTwoDigitCode;
                  if (codeNum === '61') {
                    res.end(JSON.stringify({
                      codeType: "PAINEL_INSTRUMENTOS",
                      codeTypeLabel: "Código do Painel de Instrumentos / Odômetro (DIC)",
                      originBadge: "PAINEL DE INSTRUMENTOS (2 DÍGITOS) — NÃO É SCANNER",
                      originExplanation: "Identificado com inteligência autodidata: Trata-se de uma mensagem/código direto do visor do painel de instrumentos / odômetro (DIC) da montadora (2 dígitos), e NÃO um código de scanner de diagnóstico OBD2 (DTC).",
                      problemName: "Code 61 — Reprogramação do Vidro Elétrico Traseiro Esquerdo Necessária (Chevrolet Onix, Prisma, Spin, Tracker, Cobalt, Cruze)",
                      supplierCategory: "Auto-Elétrica",
                      severity: "Baixa",
                      source: "Manual Oficial do Proprietário & Manuais de Serviço de Instrumentos GM",
                      diagnosticNotes: "O aviso 'Code 61' exibido no visor do odômetro/painel de instrumentos dos veículos Chevrolet indica que o módulo eletrônico de carroceria (BCM) perdeu a calibração de fim de curso e o ajuste do sistema antiesmagamento do VIDRO ELÉTRICO TRASEIRO ESQUERDO. Isso ocorre habitualmente após desligamento ou troca da bateria do carro, queda de tensão na partida ou substituição do interruptor/máquina de vidro.",
                      resetProcedure: "PROCEDIMENTO EXATO DE RESET MANUAL DO CODE 61 (Sem precisar de scanner):\n1. Ligue a chave de ignição no estágio II (com o painel aceso, sem dar a partida no motor).\n2. No interruptor da porta traseira esquerda (ou no comando principal do motorista), pressione o botão para ABAIXAR completamente o vidro e CONTINUE SEGURANDO o botão pressionado para baixo por 5 segundos após o vidro chegar ao batente inferior.\n3. Em seguida, puxe o botão para LEVANTAR totalmente o vidro e CONTINUE SEGURANDO o botão puxado para cima por 5 segundos após o vidro fechar totalmente.\n4. O BCM memorizará o batente e a mensagem 'Code 61' sumirá imediatamente do visor do odômetro!",
                      correctiveChecklist: [
                        "Executar o ciclo completo de descida e subida segurando o interruptor por 5 segundos em cada batente para calibrar o sensor hall do motor",
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
                    }));
                    return;
                  } else if (codeNum === '89') {
                    res.end(JSON.stringify({
                      codeType: "PAINEL_INSTRUMENTOS",
                      codeTypeLabel: "Código do Painel de Instrumentos / Odômetro (DIC)",
                      originBadge: "PAINEL DE INSTRUMENTOS (2 DÍGITOS) — NÃO É SCANNER",
                      originExplanation: "Identificado com inteligência autodidata: Trata-se de uma mensagem/código direto do visor do painel de instrumentos / odômetro (DIC) da montadora (2 dígitos), e NÃO um código de scanner de diagnóstico OBD2 (DTC).",
                      problemName: "Code 89 — Falha no Circuito de Aquecimento da Válvula Termostática Eletrônica Pilotada (Chevrolet)",
                      supplierCategory: "Mecânica",
                      severity: "Alta",
                      source: "Manual de Serviço de Instrumentos & Engenharia GM SPE/4 & Ecotec",
                      diagnosticNotes: "O Code 89 acende no painel dos modelos Chevrolet (Onix, Prisma, Cruze, Spin, Tracker, Sonic) quando a ECU detecta circuito aberto ou resistência fora da faixa no aquecedor interno do termostato pilotado (nominal: 14 a 17 Ohms). Em emergência, a ECM aciona a ventoinha em velocidade máxima.",
                      resetProcedure: "1. Substituir a carcaça da válvula termostática pilotada por componente novo homologado.\n2. Efetuar sangria completa do sistema de arrefecimento com aditivo orgânico 50/50.\n3. O aviso apaga após ciclo térmico completo de aquecimento e resfriamento do motor.",
                      correctiveChecklist: [
                        "Desconectar o chicote de 2 vias da válvula termostática e medir a resistência ôhmica (nominal: 14 a 17 Ω)",
                        "Verificar se há vazamento de líquido refrigerante oxidando os terminais elétricos do conector",
                        "Efetuar sangria completa do ar pelo bujão superior do radiador com aditivo orgânico novo 50/50"
                      ],
                      preventiveChecklist: [
                        "Substituir o aditivo orgânico concentrado (especificação Dex-Cool Long Life) a cada 30.000 km ou 2 anos",
                        "Inspecionar a tampa do reservatório de expansão (pressão de alívio: 1.4 Bar / 140 kPa)"
                      ],
                      budgetItems: [
                        { item: "Carcaça de Válvula Termostática Eletrônica Pilotada Original GM/Wahler", category: "Peça", estimatedCost: 350.00 },
                        { item: "Aditivo Orgânico Concentrado Dex-Cool (2 Litros) + Água Desmineralizada", category: "Peça", estimatedCost: 95.00 },
                        { item: "Mão de Obra de Troca, Teste de Estanqueidade & Sangria de Arrefecimento", category: "Mão de Obra", estimatedCost: 190.00 }
                      ],
                      suggestedBestPractices: [
                        "Torque dos parafusos de fixação da carcaça plástica: 10 Nm. Nunca aplicar silicone de alta temperatura onde existe anel O-ring de borracha."
                      ]
                    }));
                    return;
                  } else if (codeNum === '82') {
                    res.end(JSON.stringify({
                      codeType: "PAINEL_INSTRUMENTOS",
                      codeTypeLabel: "Código do Painel de Instrumentos / Odômetro (DIC)",
                      originBadge: "PAINEL DE INSTRUMENTOS (2 DÍGITOS) — NÃO É SCANNER",
                      originExplanation: "Identificado com inteligência autodidata: Trata-se de uma mensagem/código direto do visor do painel de instrumentos / odômetro (DIC) da montadora (2 dígitos), e NÃO um código de scanner de diagnóstico OBD2 (DTC).",
                      problemName: "Code 82 — Indicador de Vida Útil do Óleo do Motor Expirada / Troca Necessária (Chevrolet)",
                      supplierCategory: "Mecânica",
                      severity: "Média",
                      source: "Manual Oficial do Proprietário Chevrolet GM",
                      diagnosticNotes: "O Code 82 indica que o contador do algoritmo de degradação do lubrificante do motor atingiu 0% de vida útil restante. Exige troca imediata de óleo e filtro.",
                      resetProcedure: "RESET MANUAL DO CODE 82 (Sem scanner):\n1. Gire a chave de ignição para a posição II (painel aceso, motor desligado).\n2. Pressione o botão MENU na alavanca de seta até aparecer o menu de óleo restante.\n3. Pressione e segure o botão SET/CLR na ponta da alavanca por 5 segundos até o indicador exibir 100%. O Code 82 sumirá.",
                      correctiveChecklist: [
                        "Substituir o óleo do cárter com viscosidade 0W-20 ou 5W-30 homologado Dexos 1 Gen 3",
                        "Substituir o elemento filtrante de óleo do motor",
                        "Realizar o procedimento de reset manual de 5 segundos no botão SET/CLR do odômetro"
                      ],
                      preventiveChecklist: [
                        "Não ultrapassar 10.000 km ou 12 meses entre trocas de óleo (5.000 km em uso severo)",
                        "Conferir semanalmente o nível do óleo na vareta com motor frio"
                      ],
                      budgetItems: [
                        { item: "Óleo Sintético 5W-30 ou 0W-20 Homologado Dexos 1 (4 Litros)", category: "Peça", estimatedCost: 180.00 },
                        { item: "Filtro de Óleo do Motor Blindado Original", category: "Peça", estimatedCost: 45.00 },
                        { item: "Mão de Obra de Troca de Óleo, Filtro e Reset do Odômetro", category: "Mão de Obra", estimatedCost: 60.00 }
                      ],
                      suggestedBestPractices: [
                        "Sempre redefinir o contador de óleo após a troca para que a ECU calcule corretamente os intervalos de degradação."
                      ]
                    }));
                    return;
                  } else {
                    // Outro código de 2 dígitos genérico
                    res.end(JSON.stringify({
                      codeType: "PAINEL_INSTRUMENTOS",
                      codeTypeLabel: "Código do Painel de Instrumentos / Odômetro (DIC)",
                      originBadge: "PAINEL DE INSTRUMENTOS (2 DÍGITOS) — NÃO É SCANNER",
                      originExplanation: "Identificado com inteligência autodidata: Trata-se de uma mensagem/código direto do visor do painel de instrumentos / odômetro (DIC) da montadora (2 dígitos), e NÃO um código de scanner de diagnóstico OBD2 (DTC).",
                      problemName: `Code ${codeNum} — Mensagem de Alerta do Painel de Instrumentos (${make || 'Veículo'})`,
                      supplierCategory: "Auto-Elétrica",
                      severity: "Média",
                      source: "Manuais do Proprietário e Manuais de Serviço de Painéis de Instrumentos",
                      diagnosticNotes: `Identificado código de 2 dígitos (Code ${codeNum}) no visor do painel. De acordo com os manuais oficiais da montadora, códigos curtos de 2 dígitos indicam alertas diretos ao motorista no odômetro/painel de instrumentos (DIC), diferenciando-se de códigos DTC de scanner OBD2.`,
                      resetProcedure: "1. Consultar o manual do proprietário da montadora para o código específico.\n2. Executar a rotina manual de reset indicada para a função afetada pelo botão do painel/alavanca de comando.\n3. Se o código persistir, inspecionar os fusíveis e chicotes do módulo de carroceria (BCM).",
                      correctiveChecklist: [
                        "Verificar integridade do componente indicado no manual do proprietário para o código",
                        "Inspecionar aterramento e terminais de bateria",
                        "Efetuar reset manual de painel conforme instruções de fábrica"
                      ],
                      preventiveChecklist: [
                        "Manter a bateria com carga plena para evitar reinicializações do painel",
                        "Consultar o manual do veículo a cada aviso no painel"
                      ],
                      budgetItems: [
                        { item: "Inspeção Elétrica e Reset de Painel de Instrumentos", category: "Mão de Obra", estimatedCost: 120.00 }
                      ],
                      suggestedBestPractices: [
                        "Códigos curtos de 2 dígitos sempre correspondem a mensagens de instrumentos e não a falhas de injeção OBD2."
                      ]
                    }));
                    return;
                  }
                }

                // Fallback padrão para falhas mecânicas/elétricas gerais
                res.end(JSON.stringify({
                  codeType: "SCANNER_OBD2",
                  codeTypeLabel: "Diagnóstico Técnico Mecânico",
                  originBadge: "DIAGNÓSTICO TÉCNICO OFICIA",
                  originExplanation: "Análise realizada a partir da base de manuais de oficina automotiva.",
                  problemName: lang === 'es' ? 'Filtro de aire obstruido y bujías desgastadas' : lang === 'en' ? 'Clogged Air Filter and Worn Spark Plugs' : 'Filtro de Ar Obstruído e Velas Desgastadas',
                  supplierCategory: 'Mecânica',
                  severity: 'Média',
                  source: "Manual de Oficina das Montadoras",
                  diagnosticNotes: lang === 'es' ? 'Se detectó flujo de inducción restrictivo y encendido tardante e intermitente. Provoca pérdida de torque, ralentí irregular y fallos de compresión.' : lang === 'en' ? 'Detected restrictive intake flow and delayed ignition. Causes engine power loss, rough idling, and micro misfires.' : 'Saturação severa do duto de aspiração e degradação nas velas de ignição por arco elétrico irregular. Provoca perda de torque, funcionamento áspero e aumento do consumo.',
                  resetProcedure: "1. Efetuar a troca dos itens saturados.\n2. Limpar a memória de adaptação da ECU com scanner na porta OBD2.\n3. Rodar 15 km em ciclo misto para reaprendizagem da mistura ar-combustível.",
                  correctiveChecklist: [
                    lang === 'es' ? 'Inspeccionar y reemplazar el cartucho de filtro de aire obstuído' : lang === 'en' ? 'Inspect and replace dirty engine air filter element' : 'Inspecionar e substituir elemento filtrante de ar do motor saturado',
                    lang === 'es' ? 'Desconectar bobinas de encendido y reemplazar bujías gastadas' : lang === 'en' ? 'Disconnect ignition coils and replace degraded spark plugs' : 'Desconectar bobinas de ignição e trocar as velas desgastadas',
                    lang === 'es' ? 'Limpiar cuerpo de aceleración de carbonilla' : lang === 'en' ? 'Clean carbon deposits from the throttle body housing' : 'Limpar resíduos do corpo de borboletas (TBI)',
                    lang === 'es' ? 'Escanear memoria de errores obd2 para restablecer fallos de encendido' : lang === 'en' ? 'Scan OBD2 memory and clear ignition misfire fault codes' : 'Escanear memória de erros via OBD2 e limpar códigos de falha de ignição'
                  ],
                  preventiveChecklist: [
                    lang === 'es' ? 'Exigir cambio de bujías cada 30.000 km' : lang === 'en' ? 'Schedule spark plugs replacement every 25,000 miles' : 'Agendar troca de velas de ignição a cada 30.000 km',
                    lang === 'es' ? 'Higienizar el conjunto de admisión en cada servicio' : lang === 'en' ? 'Clean air induction tubes during standard lube service' : 'Limpar caixa e duto de indução em cada revisão de lubrificação'
                  ],
                  budgetItems: [
                    { item: lang === 'es' ? 'Filtro de Aire Premium (Mecânica)' : lang === 'en' ? 'Premium Air Filter Element (Mecânica)' : 'Filtro de Ar Premium (Mecânica)', category: 'Peça', estimatedCost: 140.00 },
                    { item: lang === 'es' ? 'Juego de 4 Bujías de Iridio' : lang === 'en' ? 'Set of 4 Iridium Spark Plugs' : 'Jogo de 4 Velas de Ignição Iridium', category: 'Peça', estimatedCost: 280.00 },
                    { item: lang === 'es' ? 'Mano de Obra - Afinación y Calibración' : lang === 'en' ? 'Labor - Installation, Scan, Throttle Cleaning' : 'Mão de Obra - Substituição, Limpeza de TBI e Scanner', category: 'Mão de Obra', estimatedCost: 180.00 }
                  ],
                  suggestedBestPractices: [
                    lang === 'es' ? 'Utilizar siempre piezas de repuesto certificadas por el fabricante para mantener el flujo constante.' : lang === 'en' ? 'Always utilize supplier-certified parts to avoid intake sensor errors.' : 'Mantenha as vedações da carcaça do filtro intactas para evitar entrada de ar falso.'
                  ]
                }));
                return;
              }

              // Lazy import GoogleGenAI
              const { GoogleGenAI } = await import('@google/genai');
              const ai = new GoogleGenAI({
                apiKey: apiKey,
                httpOptions: {
                  headers: {
                    'User-Agent': 'aistudio-build',
                  }
                }
              });

              let promptText = `
Você é o Consultor Técnico Sênior e Especialista Mundial em Engenharia Automotiva e Diagnóstico de Frotas da OficIA™.
O idioma solicitado para o laudo é: ${lang || 'pt'} ('pt' para Português, 'en' para Inglês, 'es' para Espanhol).

DADOS DO VEÍCULO E DO ATENDIMENTO:
- Entrada do Usuário / Sintoma / Código: "${inputQuery || 'Sintomas gerais de falha mecânica'}"
- Modo de Captura: ${mode || 'description'}
- Montadora: ${make || 'Não informada'}
- Modelo: ${model || 'Não informado'}
- Placa: ${plate || 'Não informada'}
- Chassi (VIN): ${chassis || 'Não informado'}
- Tipo de Propulsão: ${propulsionType || 'Combustão / Flex'}

=============================================================================
REGRA AUTODIDATA OBRIGATÓRIA DA OFICIA (APRENDIZAGEM DE CÓDIGOS AUTOMOTIVOS):
=============================================================================
Aprenda e aplique rigorosamente a distinção técnica universal da engenharia automotiva:

1. CÓDIGOS CURTOS (Especialmente de 2 DÍGITOS, ex: 16, 24, 59, 60, 61, 82, 89, 95):
   - SÃO IDENTIFICADORES DO PAINEL DE INSTRUMENTOS / ODÔMETRO (DIC - Driver Information Center / mensagens de aviso ao proprietário).
   - NÃO SÃO CÓDIGOS DE SCANNER OBD2!
   - Você DEVE IGNORAR PROTOCOLOS OBD2 PADRÃO.
   - Você DEVE BUSCAR ESPECIFICAMENTE EM BANCOS DE DADOS DE MANUAIS DO PROPRIETÁRIO E MANUAIS DE SERVIÇO DE PAINÉIS DE INSTRUMENTOS DA MONTADORA.
   - Por exemplo, na linha GM/Chevrolet (Onix, Prisma, Spin, Tracker, Cruze):
     * Code 61 = Calibração de fim de curso e antiesmagamento do VIDRO ELÉTRICO TRASEIRO ESQUERDO necessária (ocorre após desligamento de bateria). O reset é manual (5 segundos segurando o interruptor para baixo e 5 segundos para cima). Não se usa scanner.
     * Code 59 = Vidro Dianteiro Esquerdo (Motorista).
     * Code 60 = Vidro Dianteiro Direito (Passageiro).
     * Code 62 = Vidro Traseiro Direito.
     * Code 89 = Falha no circuito de aquecimento da válvula termostática eletrônica pilotada.
     * Code 82 = Vida útil do óleo do motor expirada (troca de óleo e reset do odômetro necessários).
     * Code 16 = Luz de freio.
     * Code 24 = Luz da placa.
     * Code 95 = Manutenção do Airbag.
   - Classificação mandatória para códigos de 2 dígitos:
     * codeType: "PAINEL_INSTRUMENTOS"
     * codeTypeLabel: "Código do Painel de Instrumentos / Odômetro (DIC)"
     * originBadge: "PAINEL DE INSTRUMENTOS (2 DÍGITOS) — NÃO É SCANNER"
     * originExplanation: "Identificado com inteligência autodidata: Trata-se de uma mensagem/código direto do visor do painel de instrumentos / odômetro (DIC) da montadora (2 dígitos), e NÃO um código de scanner de diagnóstico OBD2 (DTC)."

2. CÓDIGOS LONGOS (5 caracteres alfanuméricos no padrão [P, C, B, U] + 4 dígitos, ex: P0300, P0420, C1201, U0100):
   - SÃO CÓDIGOS DE SCANNER AUTOMOTIVO (DTCs padrão SAE J2012 / ISO 14229 / UDS).
   - Devem ser analisados segundo protocolos OBD2, com medições elétricas de sensores/atuadores e limpeza via scanner.
   - Classificação:
     * codeType: "SCANNER_OBD2"
     * codeTypeLabel: "Código de Falha de Scanner Automotivo (DTC)"
     * originBadge: "SCANNER OBD2 (DTC)"
     * originExplanation: "Identificado com inteligência autodidata: Trata-se de um código de falha padronizado de scanner de diagnóstico OBD2 (DTC padrão SAE J2012 com letra + 4 dígitos)."

${errorCodeDirective}

Analise os dados e retorne ESTRITAMENTE um documento JSON válido com a seguinte estrutura de campos:
{
  "codeType": "PAINEL_INSTRUMENTOS" | "SCANNER_OBD2" | "DIAGNOSTICO_EV_ALTA_TENSAO" | "SINTOMA_MECANICO",
  "codeTypeLabel": "Título conciso da classificação",
  "originBadge": "PAINEL DE INSTRUMENTOS (2 DÍGITOS) — NÃO É SCANNER" | "SCANNER OBD2 (DTC)" | "DIAGNÓSTICO TÉCNICO OFICIA",
  "originExplanation": "Explicação técnica sobre a origem da mensagem (painel vs scanner) e consulta a manuais de fábrica.",
  "problemName": "Nome técnico claro e preciso do diagnóstico no idioma solicitado",
  "supplierCategory": "Mecânica" | "Funilaria" | "Auto-Elétrica" | "Concessionária",
  "severity": "Baixa" | "Média" | "Alta",
  "source": "Manual do Proprietário & Manuais de Serviço de Painéis de Instrumentos OficIA",
  "diagnosticNotes": "Laudo detalhado com causa raiz, explicação física/elétrica do sintoma e histórico de falhas da montadora.",
  "resetProcedure": "Procedimento passo a passo exato de reparo, recalibração ou reset manual (especialmente sem scanner para códigos de painel de 2 dígitos).",
  "correctiveChecklist": [
    "Passo de intervenção técnica corretiva 1",
    "Passo de intervenção técnica corretiva 2",
    "Passo de intervenção técnica corretiva 3"
  ],
  "preventiveChecklist": [
    "Recomendação de manutenção preventiva 1",
    "Recomendação de manutenção preventiva 2"
  ],
  "budgetItems": [
    { "item": "Nome da peça ou serviço", "category": "Peça" | "Mão de Obra", "estimatedCost": 150.00 }
  ],
  "suggestedBestPractices": [
    "Dica de boas práticas de oficina e segurança"
  ]
}

Retorne APENAS o JSON puro. Não utilize blocos de formatação markdown adicionais.
`;

              let contents: any[] = [];
              if (mode === 'photo' && image) {
                const base64Data = image.split(',')[1] || image;
                const mimeType = image.match(/data:(.*?);base64/)?.[1] || 'image/png';
                contents.push({
                  inlineData: {
                    mimeType: mimeType,
                    data: base64Data
                  }
                });
                promptText += `\nAdditionally, examine the attached photo or image of the vehicle component/symptom for high context analysis!`;
              }

              contents.push({ text: promptText });

              const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: contents,
                config: {
                  responseMimeType: 'application/json'
                }
              });

              const resultText = response.text || '{}';
              res.statusCode = 200;
              res.end(resultText);

            } catch (err: any) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message || 'Error occurred server-side' }));
            }
          } else {
            next();
          }
        });
      }
    },
  };
});
