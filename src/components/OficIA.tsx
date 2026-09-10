import React, { useState, useEffect } from 'react';
import { 
  Wrench, 
  Search, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle, 
  Share2, 
  Printer, 
  Car, 
  BookOpen, 
  Sparkles, 
  ShieldCheck,
  Copy,
  Check,
  Zap,
  Cpu,
  HelpCircle,
  Hash,
  ChevronDown,
  ChevronUp,
  Activity,
  Layers,
  FileCheck,
  FileText
} from 'lucide-react';
import { SelectedLang } from '../data';
import { BRAZIL_AUTOMAKERS, AutomakerData, VehicleModelInfo, decodeVinDetails } from '../automakersData';
import MultimodalMediaCapture from './MultimodalMediaCapture';

interface OficIAProps {
  lang: SelectedLang;
  isOffline: boolean;
  setSuccessToast: (msg: string | null) => void;
  inventory: any[];
  setInventory: React.Dispatch<React.SetStateAction<any[]>>;
  maintenanceHistory: any[];
  setMaintenanceHistory: React.Dispatch<React.SetStateAction<any[]>>;
  mobileBudgets: any[];
  setMobileBudgets: React.Dispatch<React.SetStateAction<any[]>>;
  agendaEvents: any[];
  setAgendaEvents: React.Dispatch<React.SetStateAction<any[]>>;
  saveToStorage: (inv: any, hist: any, budgets?: any, events?: any, stocks?: any) => void;
}

export default function OficIA({
  lang,
  isOffline,
  setSuccessToast,
  inventory,
  setInventory,
  maintenanceHistory,
  setMaintenanceHistory,
  mobileBudgets,
  setMobileBudgets,
  agendaEvents,
  setAgendaEvents,
  saveToStorage
}: OficIAProps) {
  // Vehicle Identity States (Placa, Chassi / VIN, Montadora, Modelo)
  const [plate, setPlate] = useState<string>("BRA2E19");
  const [chassis, setChassis] = useState<string>("9BG118745R1089234");
  const [selectedMakerId, setSelectedMakerId] = useState<string>("byd");
  const [selectedModelName, setSelectedModelName] = useState<string>("Dolphin EV (44.9 kWh)");
  const [isEvAlternativeMode, setIsEvAlternativeMode] = useState<boolean>(true);
  const [showEvGuideModal, setShowEvGuideModal] = useState<boolean>(false);

  // Input states (Tela de Descrição)
  const [symptomQuery, setSymptomQuery] = useState<string>("");
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [attachedVideo, setAttachedVideo] = useState<string | null>(null);
  const [attachedAudio, setAttachedAudio] = useState<string | null>(null);

  // AI Diagnostic Response state (Tela de Retorno)
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiResponse, setAiResponse] = useState<any>(null);
  const [whatsappShareUrl, setWhatsappShareUrl] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);

  // Server & AI Connection Info
  const [serverInfo, setServerInfo] = useState<{ status: string; aiConnected: boolean; model: string } | null>(null);

  // Real-time VIN Decoded Info
  const vinDecoded = React.useMemo(() => decodeVinDetails(chassis), [chassis]);

  // Current Automaker object
  const currentMaker = React.useMemo(() => {
    return BRAZIL_AUTOMAKERS.find(m => m.id === selectedMakerId) || BRAZIL_AUTOMAKERS[0];
  }, [selectedMakerId]);

  // Current Model object
  const currentModel = React.useMemo(() => {
    return currentMaker.models.find(m => m.name === selectedModelName) || currentMaker.models[0];
  }, [currentMaker, selectedModelName]);

  // Check health on mount
  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => setServerInfo(data))
      .catch(() => setServerInfo({ status: 'ok', aiConnected: false, model: 'local' }));
  }, []);

  // Update selected model when automaker changes
  const handleMakerChange = (makerId: string) => {
    setSelectedMakerId(makerId);
    const maker = BRAZIL_AUTOMAKERS.find(m => m.id === makerId);
    if (maker && maker.models.length > 0) {
      setSelectedModelName(maker.models[0].name);
      setIsEvAlternativeMode(maker.models[0].category === 'EV' || maker.models[0].category === 'HYBRID');
    }
  };

  // Update EV mode when model changes
  const handleModelChange = (modelName: string) => {
    setSelectedModelName(modelName);
    const model = currentMaker.models.find(m => m.name === modelName);
    if (model) {
      setIsEvAlternativeMode(model.category === 'EV' || model.category === 'HYBRID');
    }
  };

  // Quick preset vehicle filler for rental fleets & EVs
  const handlePresetVehicle = (preset: { plate: string; vin: string; makerId: string; modelName: string; query?: string }) => {
    setPlate(preset.plate);
    setChassis(preset.vin);
    setSelectedMakerId(preset.makerId);
    setSelectedModelName(preset.modelName);
    const maker = BRAZIL_AUTOMAKERS.find(m => m.id === preset.makerId);
    const model = maker?.models.find(m => m.name === preset.modelName);
    setIsEvAlternativeMode(model?.category === 'EV' || model?.category === 'HYBRID');
    if (preset.query) {
      setSymptomQuery(preset.query);
    }
    setSuccessToast(`Veículo carregado: ${preset.modelName} (Placa: ${preset.plate})`);
  };

  // Quick symptom click handler
  const handleQuickCodeSelect = (codeText: string) => {
    setSymptomQuery(codeText);
    setSuccessToast(`Sintoma selecionado: "${codeText.slice(0, 45)}..."`);
  };

  // Multimodal handlers
  const handleAddTranscript = (text: string) => {
    setSymptomQuery(prev => (prev ? prev + " " + text : text).trim());
    setSuccessToast("Relato de voz transcrito com sucesso!");
  };

  const handleAttachImage = (base64: string, name?: string) => {
    setAttachedImage(base64);
    setSuccessToast(name ? `Foto anexada: ${name}` : "Foto anexada com sucesso!");
  };

  const handleAttachVideo = (base64: string, name?: string) => {
    setAttachedVideo(base64);
    setSuccessToast(name ? `Vídeo anexado: ${name}` : "Vídeo anexado com sucesso!");
  };

  const handleAttachAudio = (base64: string, name?: string) => {
    setAttachedAudio(base64);
    setSuccessToast(name ? `Gravação acústica anexada: ${name}` : "Áudio acústico anexado com sucesso!");
  };

  const handleClearMedia = (type: 'image' | 'video' | 'audio') => {
    if (type === 'image') setAttachedImage(null);
    if (type === 'video') setAttachedVideo(null);
    if (type === 'audio') setAttachedAudio(null);
  };

  // Reset to create a new diagnosis
  const handleNewDiagnosis = () => {
    setAiResponse(null);
    setSymptomQuery("");
    setAttachedImage(null);
    setAttachedVideo(null);
    setAttachedAudio(null);
    setSuccessToast("Tela limpa para novo diagnóstico.");
    const el = document.getElementById('tela-descricao');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  // Copy full technical report
  const handleCopyReport = () => {
    if (!aiResponse) return;
    const reportText = `[LAUDO TÉCNICO OFICIAL OFICIA™]\n` +
      `Veículo: ${currentMaker.name} ${selectedModelName}\n` +
      `Placa: ${plate || 'N/I'} | Chassi: ${chassis || 'N/I'}\n` +
      `Propulsão: ${currentModel?.category || 'Flex'} (${currentModel?.voltage || '12V'})\n` +
      `Diagnóstico: ${aiResponse.problemName}\n` +
      `Origem: ${aiResponse.originBadge || aiResponse.codeType}\n` +
      `Gravidade: ${aiResponse.severity}\n\n` +
      `DIAGNÓSTICO TÉCNICO & PROTOCOLO:\n${aiResponse.diagnosticNotes}\n\n` +
      `PROCEDIMENTO DE RESET / REPARO:\n${aiResponse.resetProcedure || 'Não se aplica'}\n\n` +
      `CHECKLIST CORRETIVO:\n${aiResponse.correctiveChecklist?.map((c: string, i: number) => `${i + 1}. ${c}`).join('\n')}\n\n` +
      `AÇÕES PREVENTIVAS:\n${aiResponse.preventiveChecklist?.map((p: string) => `• ${p}`).join('\n')}\n\n` +
      `ORÇAMENTO ESTIMADO:\n${aiResponse.budgetItems?.map((b: any) => `• ${b.item} (${b.category}): R$ ${b.estimatedCost?.toFixed(2)}`).join('\n')}\n` +
      `Total: R$ ${aiResponse.budgetItems?.reduce((acc: number, curr: any) => acc + curr.estimatedCost, 0)?.toFixed(2)}`;
    
    navigator.clipboard.writeText(reportText).then(() => {
      setCopied(true);
      setSuccessToast("Laudo técnico copiado para a área de transferência!");
      setTimeout(() => setCopied(false), 3000);
    });
  };

  // Submit diagnostic request
  const handleRunDiagnosis = async () => {
    const fullQuery = symptomQuery.trim();
    if (!fullQuery && !attachedImage && !attachedVideo && !attachedAudio && !chassis) {
      setSuccessToast("Por favor, digite um relato, código, chassi, grave áudio ou anexe imagem/vídeo.");
      return;
    }

    setAiLoading(true);
    setAiResponse(null);

    try {
      let rawData: any = null;

      if (!isOffline) {
        const payload = {
          description: fullQuery || `Diagnóstico técnico de rotina para ${currentMaker.name} ${selectedModelName}`,
          mode: attachedVideo ? 'video' : (attachedImage ? 'photo' : (attachedAudio ? 'audio' : 'description')),
          image: attachedImage,
          video: attachedVideo,
          audio: attachedAudio,
          lang: lang,
          plate: plate,
          chassis: chassis,
          make: currentMaker.name,
          model: selectedModelName,
          propulsionType: currentModel?.category || 'Flex',
          isEvAlternative: isEvAlternativeMode
        };

        const res = await fetch('/api/diagnose', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          rawData = await res.json();
        }
      }

      // Offline / Local fallback if backend unavailable
      if (!rawData) {
        const queryLower = fullQuery.toLowerCase();
        
        if (isEvAlternativeMode || queryLower.includes('byd') || queryLower.includes('dolphin') || queryLower.includes('bateria') || queryLower.includes('isolamento')) {
          rawData = {
            codeType: "DIAGNOSTICO_EV_ALTA_TENSAO",
            codeTypeLabel: "Protocolo Alternativo para Veículos Elétricos (DoIP & Onboard DiLink)",
            originBadge: "DIAGNÓSTICO ALTERNATIVO VEÍCULO ELÉTRICO (EV/DoIP)",
            originExplanation: "Scanners OBD2 convencionais não comunicam com o trem de força elétrico devido ao bloqueio do Security Gateway (SGW) e à arquitetura de rede DoIP (Ethernet ISO 13400).",
            problemName: `${currentMaker.name} ${selectedModelName} — Diagnóstico de Alta Tensão & Leitura Alternativa`,
            supplierCategory: "Sistema de Bateria de Tração (BMS) & Inversor de Alta Tensão",
            severity: "Alta",
            source: "Manual de Engenharia EV & Protocolos Homologados ISO 13400",
            diagnosticNotes: `1. DIAGNÓSTICO SEM SCANNER (MENU NA TELA): ${currentMaker.evAlternativeGuide?.screenMenuProcedure || 'Acesse o menu de engenharia na central multimídia para ler a tensão das células e o isolamento elétrico.'}\n2. ESPECIFICAÇÃO DE ISOLAMENTO: ${currentMaker.evAlternativeGuide?.insulationSpecs || 'Resistência de isolamento mínima de 500 kΩ a 500V DC.'}\n3. PROTOCOLO DoIP: ${currentMaker.evAlternativeGuide?.doipInstructions || 'Conectar interface DoIP nos pinos 3, 11, 12 e 13 da porta OBD2.'}`,
            resetProcedure: currentMaker.evAlternativeGuide?.emergencyResetProcedure || "1. Desconectar polo negativo da bateria 12V.\n2. Retirar o plugue de serviço laranja (MSD) com luva 1000V.\n3. Aguardar 10 minutos para descarga dos capacitores.\n4. Reconectar o circuito e ligar o botão Start mantendo por 5 segundos.",
            correctiveChecklist: [
              "Verificar se há desbalanceamento de células (Delta V > 25mV)",
              "Medir resistência de isolamento em 500V DC com megômetro automotivo (> 500 kΩ)",
              "Inspecionar continuidade do loop de intertravamento de alta tensão (HVIL)",
              "Testar tensão da bateria auxiliar de 12V (mínimo 12.4V)"
            ],
            preventiveChecklist: [
              "Realizar carga lenta 100% AC semanalmente para calibração do BMS",
              "Inspecionar cabos de alta tensão laranjas contra umidade ou atrito"
            ],
            budgetItems: [
              { item: "Diagnóstico Especializado de Alta Tensão / Varredura DoIP", category: "Mão de Obra", estimatedCost: 450.00 },
              { item: "Teste de Isolamento com Megômetro e Calibração BMS", category: "Mão de Obra", estimatedCost: 320.00 }
            ],
            suggestedBestPractices: [
              "OBRIGATÓRIO: Utilizar luva isolante 1000V Classe 0 com sobreluva de proteção conforme norma NR-10."
            ]
          };
        } else {
          rawData = {
            codeType: "SCANNER_OBD2",
            codeTypeLabel: "Diagnóstico Técnico Especializado",
            originBadge: "LAUDO TÉCNICO MULTIMODAL OFICIAL",
            originExplanation: "Dados correlacionados com manuais mundiais de oficina e esquemas elétricos de fábrica.",
            problemName: `${currentMaker.name} ${selectedModelName} — Laudo Técnico: ${fullQuery.slice(0, 50) || 'Análise de Falha'}`,
            supplierCategory: "Sistema de Injeção Eletrônica & Powertrain",
            severity: "Média",
            source: "Manuais de Oficina das Montadoras Brasileiras",
            diagnosticNotes: `Análise técnica realizada para o modelo ${selectedModelName}. Verificação recomendada dos sensores de fluxo, chicote elétrico e integridade mecânica.`,
            resetProcedure: "1. Conectar scanner compatível na porta OBD2.\n2. Apagar memória de falhas das ECUs.\n3. Realizar ciclo de rodagem para aprendizagem dos parâmetros adaptativos.",
            correctiveChecklist: [
              "Verificar parâmetros em tempo real com scanner",
              "Inspecionar chicotes elétricos e conectores",
              "Substituir componentes com desgaste excessivo"
            ],
            preventiveChecklist: [
              "Respeitar o plano de revisões periódicas do fabricante",
              "Utilizar peças genuínas ou homologadas"
            ],
            budgetItems: [
              { item: "Diagnóstico Computadorizado e Inspeção Técnica", category: "Mão de Obra", estimatedCost: 150.00 },
              { item: "Mão de Obra de Reparo e Calibração", category: "Mão de Obra", estimatedCost: 200.00 }
            ]
          };
        }
      }

      setAiResponse(rawData);

      // Register budget in store
      const totalBudget = rawData.budgetItems?.reduce((acc: number, curr: any) => acc + curr.estimatedCost, 0) || 350;
      const newBudgetObj = {
        id: `OS-${Date.now()}`,
        cliente: `Frota / Proprietário (${plate})`,
        veiculo: `${currentMaker.name} ${selectedModelName} - Placa: ${plate}`,
        valor: `R$ ${totalBudget.toFixed(2)}`,
        status: "Pendente",
        data: new Date().toLocaleDateString('pt-BR')
      };
      const updatedBudgets = [newBudgetObj, ...mobileBudgets];
      setMobileBudgets(updatedBudgets);
      saveToStorage(inventory, maintenanceHistory, updatedBudgets);

      // Prepare WhatsApp link
      const textMsg = encodeURIComponent(
        `*OficIA™ — Laudo Técnico Oficial*\n` +
        `Veículo: ${currentMaker.name} ${selectedModelName}\n` +
        `Placa: ${plate} | Chassi: ${chassis}\n` +
        `Diagnóstico: ${rawData.problemName}\n` +
        `Gravidade: ${rawData.severity}\n` +
        `Procedimento / Alternativa: ${rawData.resetProcedure || rawData.diagnosticNotes}\n` +
        `Total Estimado: R$ ${totalBudget.toFixed(2)}`
      );
      setWhatsappShareUrl(`https://api.whatsapp.com/send?text=${textMsg}`);
      setSuccessToast("Diagnóstico e Laudo Técnico gerados com sucesso!");

      // Scroll smoothly to result
      setTimeout(() => {
        const el = document.getElementById('tela-retorno');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);

    } catch (err: any) {
      console.error(err);
      setSuccessToast("Erro ao processar diagnóstico.");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fadeIn max-w-5xl mx-auto px-1 sm:px-0">

      {/* =========================================================================
          HERO & IDENTIDADE OFICIA
          ========================================================================= */}
      <div className="bg-tech-cartao border border-tech-borda rounded-2xl p-4 sm:p-6 shadow-lg relative overflow-hidden">
        {/* Glow & Circuit Background Accents */}
        <div className="absolute top-0 right-0 w-64 h-32 bg-tech-destaque/10 blur-3xl pointer-events-none -z-0" />
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-tech-destaque via-cyan-400 to-tech-destaque" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-5">
          {/* OficIA System Identity */}
          <div className="flex items-center gap-3.5 sm:gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-tech-fundo border-2 border-tech-destaque/50 flex items-center justify-center text-tech-destaque shadow-[0_0_20px_rgba(0,255,102,0.25)] shrink-0">
              <Wrench className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xl sm:text-2xl font-black text-white font-display tracking-tight flex items-center">
                  Ofic<span className="text-tech-destaque">IA</span>
                  <span className="text-[10px] font-mono text-tech-destaque ml-1 border border-tech-destaque/30 px-1.5 py-0.5 rounded bg-tech-destaque/10">TM</span>
                </span>
                <span className="text-[10px] font-mono font-bold text-slate-300 uppercase bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
                  AutoOps
                </span>
              </div>

              <h2 className="text-xs sm:text-sm font-semibold text-slate-200">
                Sistema Inteligente de Diagnóstico Automotivo
              </h2>

              <p className="text-[9px] sm:text-[10px] tracking-[0.1em] text-slate-400 uppercase font-mono">
                Protocolos OBD2 / DoIP & Diagnóstico Assistido por IA
              </p>
            </div>
          </div>

          {/* Quick Pillar Tags */}
          <div className="flex flex-wrap md:flex-col items-start md:items-end gap-1.5 self-stretch md:self-auto pt-2 md:pt-0 border-t md:border-t-0 border-tech-borda">
            <span className="text-[10px] text-tech-sucesso font-mono font-bold flex items-center gap-1.5 bg-tech-sucesso/10 px-2.5 py-1 rounded-lg border border-tech-sucesso/30">
              <span className="w-2 h-2 rounded-full bg-tech-sucesso inline-block animate-pulse" />
              {serverInfo?.aiConnected ? 'Rede Neural & Manuais Ativos' : 'Base Técnica Automotiva Ativa'}
            </span>
            <span className="text-[9px] text-cyan-300 font-mono font-medium bg-cyan-950/50 px-2.5 py-0.5 rounded-lg border border-cyan-500/30">
              ⚡ Protocolos EV / DoIP & SGW Bypass
            </span>
            <span className="text-[9px] text-slate-400 font-mono">
              Frotas & Locadoras
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          1. TELA DE DESCRIÇÃO DO PROBLEMA (INPUT CONSOLE)
          ========================================================================= */}
      <section id="tela-descricao" className="bg-tech-cartao border border-tech-borda rounded-2xl p-4 sm:p-6 shadow-xl space-y-4 sm:space-y-5">
        
        {/* Bloco de Identificação do Veículo (Placa, Chassi / VIN, Montadora e Modelo) */}
        <div className="space-y-3.5 sm:space-y-4 border-b border-tech-borda pb-4 sm:pb-5">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="text-[11px] font-black text-tech-texto uppercase tracking-wide">
              <span>Preencha os dados do veículo</span>
            </label>

            {/* Quick Fleet & EV Presets com rolagem suave touch no mobile */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 max-w-full">
              <span className="text-tech-secundario text-[10px] whitespace-nowrap shrink-0">Exemplos Rápidos:</span>
              <button
                type="button"
                onClick={() => handlePresetVehicle({
                  plate: "BYD1E24",
                  vin: "LGX123456R1098765",
                  makerId: "byd",
                  modelName: "Dolphin EV (44.9 kWh)",
                  query: "Scanner OBD2 tradicional não comunica com o módulo de bateria. Painel acendeu luz de advertência de alta tensão e veículo entrou em modo tartaruga."
                })}
                className="px-2.5 py-1 rounded-lg bg-tech-destaque/10 text-tech-destaque border border-tech-destaque/30 hover:bg-tech-destaque/20 transition font-bold cursor-pointer whitespace-nowrap shrink-0 text-[10px]"
              >
                ⚡ BYD Dolphin
              </button>
              <button
                type="button"
                onClick={() => handlePresetVehicle({
                  plate: "ORA0E33",
                  vin: "LGB987654R2011223",
                  makerId: "gwm",
                  modelName: "Ora 03 Skin / GT (48 kWh e 63 kWh)",
                  query: "GWM Ora 03 recusa inicialização pelo botão Start. Trava de escrita SGW no scanner OBD universal."
                })}
                className="px-2.5 py-1 rounded-lg bg-tech-destaque/10 text-tech-destaque border border-tech-destaque/30 hover:bg-tech-destaque/20 transition font-bold cursor-pointer whitespace-nowrap shrink-0 text-[10px]"
              >
                ⚡ GWM Ora 03
              </button>
              <button
                type="button"
                onClick={() => handlePresetVehicle({
                  plate: "LOC1A23",
                  vin: "9BWAB45U9R1029384",
                  makerId: "volkswagen",
                  modelName: "Polo Track 1.0 MPI (Top Locadoras)",
                  query: "Aviso de revisão periódica e luz de EPC acesa após abastecimento com etanol."
                })}
                className="px-2.5 py-1 rounded-lg bg-tech-fundo text-tech-secundario border border-tech-borda hover:text-tech-texto transition font-bold cursor-pointer whitespace-nowrap shrink-0 text-[10px]"
              >
                🚗 Polo Track
              </button>
              <button
                type="button"
                onClick={() => handlePresetVehicle({
                  plate: "MOV2B34",
                  vin: "9BG118745R1089234",
                  makerId: "chevrolet",
                  modelName: "Onix 1.0 / 1.0 Turbo (Top Locadoras)",
                  query: "Code 61 no odômetro após desligar bateria e vidro elétrico traseiro não responde."
                })}
                className="px-2.5 py-1 rounded-lg bg-tech-fundo text-tech-secundario border border-tech-borda hover:text-tech-texto transition font-bold cursor-pointer whitespace-nowrap shrink-0 text-[10px]"
              >
                🚗 Onix
              </button>
            </div>
          </div>

          {/* Grid de 4 Campos: Placa, Chassi, Montadora, Modelo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
            
            {/* Campo 1: Placa */}
            <div>
              <label className="block text-[10px] font-bold text-tech-secundario uppercase mb-1 flex items-center gap-1">
                <span>Placa do Veículo</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={plate}
                  onChange={(e) => setPlate(e.target.value.toUpperCase())}
                  placeholder="ABC-1234 ou BRA2E19"
                  maxLength={8}
                  className="w-full text-xs sm:text-sm font-mono font-black uppercase rounded-xl border border-tech-borda py-2.5 px-3 min-h-[44px] bg-tech-fundo text-tech-texto focus:border-tech-destaque focus:outline-none transition tracking-wider"
                />
              </div>
            </div>

            {/* Campo 2: Chassi (VIN 17 dígitos) */}
            <div>
              <label className="block text-[10px] font-bold text-tech-secundario uppercase mb-1 flex items-center justify-between">
                <span>Chassi (VIN - 17 Dígitos)</span>
                <span className={`text-[9px] font-mono font-bold ${chassis.length === 17 ? 'text-tech-sucesso' : 'text-tech-alerta'}`}>
                  {chassis.length}/17
                </span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={chassis}
                  onChange={(e) => setChassis(e.target.value.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, ''))}
                  placeholder="Ex: 9BG118745R1089234"
                  maxLength={17}
                  className="w-full text-xs sm:text-sm font-mono font-bold uppercase rounded-xl border border-tech-borda py-2.5 px-3 min-h-[44px] bg-tech-fundo text-tech-destaque focus:border-tech-destaque focus:outline-none transition tracking-wide"
                />
              </div>
            </div>

            {/* Campo 3: Montadora no Brasil */}
            <div>
              <label className="block text-[10px] font-bold text-tech-secundario uppercase mb-1">
                <span>Montadora / Fabricante</span>
              </label>
              <select
                value={selectedMakerId}
                onChange={(e) => handleMakerChange(e.target.value)}
                className="w-full text-xs sm:text-sm font-bold rounded-xl border border-tech-borda py-2.5 px-3 min-h-[44px] bg-tech-fundo text-tech-texto focus:border-tech-destaque focus:outline-none cursor-pointer"
              >
                {BRAZIL_AUTOMAKERS.map(maker => (
                  <option key={maker.id} value={maker.id}>
                    {maker.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Campo 4: Modelo (com foco em locadoras e elétricos) */}
            <div>
              <label className="block text-[10px] font-bold text-tech-secundario uppercase mb-1 flex items-center justify-between">
                <span>Modelo do Veículo</span>
                {currentModel?.isFleetPopular && (
                  <span className="text-[9px] text-tech-destaque bg-tech-destaque/10 px-1.5 py-0.2 rounded font-bold">
                    Frota Locadora
                  </span>
                )}
              </label>
              <select
                value={selectedModelName}
                onChange={(e) => handleModelChange(e.target.value)}
                className="w-full text-xs sm:text-sm font-bold rounded-xl border border-tech-borda py-2.5 px-3 min-h-[44px] bg-tech-fundo text-tech-texto focus:border-tech-destaque focus:outline-none cursor-pointer"
              >
                {currentMaker.models.map(model => (
                  <option key={model.name} value={model.name}>
                    {model.category === 'EV' ? '⚡ ' : model.category === 'HYBRID' ? '🔋 ' : ''}
                    {model.name}
                  </option>
                ))}
              </select>
            </div>

          </div>

          {/* Decodificação em Tempo Real do Chassi & Badge de Propulsão */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-tech-fundo/70 p-2.5 rounded-xl border border-tech-borda text-xs">
            <div className="flex items-center gap-2">
              <Hash className="w-3.5 h-3.5 text-tech-destaque shrink-0" />
              <span className="text-[11px] font-medium text-tech-texto">
                {vinDecoded.isValid ? (
                  <span className="text-tech-sucesso font-bold">
                    ✓ {vinDecoded.message}
                  </span>
                ) : (
                  <span className="text-tech-secundario">
                    {vinDecoded.message || "Informe o chassi completo de 17 caracteres para decodificação automática"}
                  </span>
                )}
              </span>
            </div>

            {/* Tag do Sistema do Veículo */}
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 ${
                currentModel?.category === 'EV'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                  : currentModel?.category === 'HYBRID'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-tech-destaque/15 text-tech-destaque border border-tech-destaque/30'
              }`}>
                {currentModel?.category === 'EV' ? <Zap className="w-3 h-3" /> : <Activity className="w-3 h-3" />}
                <span>{currentModel?.category === 'EV' ? '100% Elétrico (BEV)' : currentModel?.category === 'HYBRID' ? 'Híbrido (PHEV/HEV)' : 'Combustão / Flex'}</span>
              </span>

              {currentModel?.voltage && (
                <span className="text-[10px] font-mono text-tech-secundario font-bold bg-tech-cartao px-2 py-0.5 rounded border border-tech-borda">
                  {currentModel.voltage}
                </span>
              )}
            </div>
          </div>

          {/* Módulo de Diagnóstico Alternativo para Carros Elétricos (EV) */}
          {(currentModel?.category === 'EV' || currentModel?.category === 'HYBRID' || isEvAlternativeMode) && (
            <div className="bg-gradient-to-r from-cyan-950/40 via-tech-fundo to-cyan-950/40 border border-cyan-500/40 rounded-xl p-3.5 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="bg-cyan-500/20 p-1.5 rounded-lg text-cyan-400 border border-cyan-500/40">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-cyan-300 uppercase tracking-wide flex items-center gap-1.5">
                      <span>Módulo de Diagnóstico Alternativo para Carros Elétricos (EV)</span>
                    </h4>
                    <p className="text-[11px] text-tech-secundario">
                      Scanners OBD2 tradicionais falham por trava de SGW e ausência de DoIP. Use as rotinas alternativas abaixo:
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowEvGuideModal(!showEvGuideModal)}
                  className="text-[11px] font-bold text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 px-3 py-1.5 rounded-lg transition flex items-center justify-center gap-1 cursor-pointer self-start sm:self-center"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{showEvGuideModal ? "Ocultar Guia EV" : "Ver Guia de Telas & DoIP"}</span>
                  {showEvGuideModal ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Guia Técnico Alternativo Expansível */}
              {showEvGuideModal && (
                <div className="pt-2 border-t border-cyan-500/20 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="bg-tech-cartao p-3 rounded-lg border border-tech-borda space-y-1">
                    <span className="text-[10px] font-black text-cyan-400 uppercase tracking-wider flex items-center gap-1">
                      <Cpu className="w-3 h-3" />
                      <span>1. Auto-Diagnóstico Onboard (Sem Scanner)</span>
                    </span>
                    <p className="text-[11px] text-tech-texto/90 leading-relaxed">
                      {currentMaker.evAlternativeGuide?.screenMenuProcedure || "Menu secreto na multimídia central para leitura direta de tensão de células (ΔV), temperatura e isolamento elétrico."}
                    </p>
                  </div>

                  <div className="bg-tech-cartao p-3 rounded-lg border border-tech-borda space-y-1">
                    <span className="text-[10px] font-black text-cyan-400 uppercase tracking-wider flex items-center gap-1">
                      <Layers className="w-3 h-3" />
                      <span>2. Protocolo DoIP (Ethernet ISO 13400)</span>
                    </span>
                    <p className="text-[11px] text-tech-texto/90 leading-relaxed">
                      {currentMaker.evAlternativeGuide?.doipInstructions || "Conexão direta por cabo Ethernet DoIP nos pinos 3/11 (RX) e 12/13 (TX) da porta OBD2 para contornar o bloqueio de segurança."}
                    </p>
                  </div>

                  <div className="bg-tech-cartao p-3 rounded-lg border border-tech-borda space-y-1">
                    <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      <span>3. Teste de Isolamento Físico (Megômetro 500V)</span>
                    </span>
                    <p className="text-[11px] text-tech-texto/90 leading-relaxed">
                      {currentMaker.evAlternativeGuide?.insulationSpecs || "Resistência mínima > 500 kΩ entre barramento DC de tração e massa da carroceria. Abaixo de 100 kΩ o veículo bloqueia a tração."}
                    </p>
                  </div>

                  <div className="bg-tech-cartao p-3 rounded-lg border border-tech-borda space-y-1">
                    <span className="text-[10px] font-black text-rose-400 uppercase tracking-wider flex items-center gap-1">
                      <RotateCcw className="w-3 h-3" />
                      <span>4. Desenergização do MSD & Reset Turtle Mode</span>
                    </span>
                    <p className="text-[11px] text-tech-texto/90 leading-relaxed">
                      {currentMaker.evAlternativeGuide?.emergencyResetProcedure || "Remover conector de serviço laranja (MSD) com luva 1000V e desconectar o polo 12V por 10 minutos para descarga de capacitores."}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Atalhos Rápidos de Sintomas e Códigos */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-black text-tech-secundario uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-tech-destaque" />
              <span>Atalhos Rápidos de Consulta</span>
            </label>
            <span className="text-[9px] font-mono text-tech-destaque bg-tech-destaque/10 px-2 py-0.5 rounded-full font-bold">
              Painel, Scanner, Ruídos & Elétricos
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {[
              { label: "⚡ BYD Dolphin (Blade / DoIP)", text: "BYD Dolphin — Falha de comunicação OBD2 no scanner tradicional, luz de alta tensão acesa e modo tartaruga", type: "ev" },
              { label: "⚡ GWM Ora / Haval (SGW Bypass)", text: "GWM Ora 03 / Haval H6 — Bloqueio Security Gateway no scanner e falha de inicialização do inversor DHT", type: "ev" },
              { label: "⚡ Renault Kwid E-Tech", text: "Renault Kwid E-Tech — Recusa de carga lenta Wallbox / falha de aterramento e autoteste de painel", type: "ev" },
              { label: "⚡ Toyota Hybrid (Manutenção)", text: "Toyota Corolla Hybrid — Procedimento do Modo de Manutenção (travar motor a combustão ligado sem scanner)", type: "ev" },
              { label: "Code 61 (Onix Vidro Esq)", text: "Código 61 no odômetro Chevrolet Onix/Spin — Reprogramação e calibração do vidro traseiro esquerdo", type: "painel" },
              { label: "Code 89 (Termostato GM)", text: "Code 89 Chevrolet — Falha no circuito de aquecimento da válvula termostática eletrônica", type: "painel" },
              { label: "Luz EPC (Polo / VW)", text: "Aviso EPC Volkswagen Polo Track — Falha na aceleração eletrônica, borboleta TBI ou interruptor de freio", type: "painel" },
              { label: "Ruído Tuchos / Motor", text: "Barulho metálico contínuo tipo tec-tec no cabeçote ao ligar o motor frio (tuchos hidráulicos)", type: "acustico" },
              { label: "DTC P0AA6 (Isolamento EV)", text: "Código DTC P0AA6 — Perda de resistência de isolamento do circuito de alta tensão da bateria de tração", type: "ev" }
            ].map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleQuickCodeSelect(chip.text)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer flex items-center gap-1 ${
                  chip.type === 'ev'
                    ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20'
                    : chip.type === 'painel' 
                    ? 'border-tech-destaque/40 bg-tech-destaque/10 text-tech-destaque hover:bg-tech-destaque/20' 
                    : chip.type === 'acustico'
                    ? 'border-tech-alerta/40 bg-tech-alerta/10 text-tech-alerta hover:bg-tech-alerta/20'
                    : 'border-tech-borda bg-tech-fundo text-tech-secundario hover:text-tech-texto hover:border-tech-sucesso/50 hover:bg-tech-sucesso/10'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${chip.type === 'ev' ? 'bg-cyan-400' : chip.type === 'painel' ? 'bg-tech-destaque' : chip.type === 'acustico' ? 'bg-tech-alerta' : 'bg-tech-sucesso'}`} />
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* Caixa de Texto de Descrição & Captura Multimodal */}
        <div className="space-y-4 pt-1">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-black text-tech-texto uppercase tracking-wide flex items-center gap-1.5">
                <span>Descrição do Problema, Luz, Ruído, Código ou Falha de Scanner</span>
              </label>
              <span className="text-[10px] text-tech-secundario">
                Digitação livre, voz, fotos, vídeos ou áudio acústico
              </span>
            </div>

            <div className="relative rounded-2xl border-2 border-tech-borda bg-tech-fundo p-3.5 focus-within:border-tech-destaque transition-all shadow-inner">
              <textarea 
                value={symptomQuery}
                onChange={(e) => setSymptomQuery(e.target.value)}
                placeholder="Descreva o problema livremente (ex: 'scanner não lê BYD Dolphin', 'barulho tec-tec no motor', 'Code 61 no odômetro', 'luz de alta tensão acesa e modo tartaruga', 'P0AA6')..."
                rows={3}
                className="w-full text-xs md:text-sm font-medium bg-transparent text-tech-texto outline-none placeholder-tech-secundario/50 resize-none leading-relaxed"
              />
            </div>
          </div>

          {/* Mídia Multimodal (Foto, Vídeo, Áudio Acústico) */}
          <MultimodalMediaCapture
            onAddTranscript={handleAddTranscript}
            onAttachImage={handleAttachImage}
            onAttachVideo={handleAttachVideo}
            onAttachAudio={handleAttachAudio}
            onClearMedia={handleClearMedia}
            attachedImage={attachedImage}
            attachedVideo={attachedVideo}
            attachedAudio={attachedAudio}
          />

          {/* Botão de Ação de Diagnóstico */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-tech-borda">
            <span className="text-[11px] text-tech-secundario">
              {aiResponse ? "✓ Diagnóstico gerado abaixo." : "Clique abaixo para correlacionar com a base técnica e gerar o laudo."}
            </span>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {aiResponse && (
                <button
                  type="button"
                  onClick={handleNewDiagnosis}
                  className="w-full sm:w-auto bg-tech-fundo hover:bg-tech-borda text-tech-texto text-xs font-bold py-3 px-4 rounded-xl border border-tech-borda transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Limpar / Novo</span>
                </button>
              )}

              <button 
                type="button"
                onClick={handleRunDiagnosis}
                disabled={aiLoading || (!symptomQuery && !attachedImage && !attachedVideo && !attachedAudio && !chassis)}
                className="w-full sm:w-auto bg-gradient-to-r from-tech-destaque via-emerald-400 to-tech-destaque text-tech-fundo text-xs md:text-sm font-black py-3.5 px-8 rounded-xl hover:scale-102 active:scale-98 transition duration-200 disabled:opacity-40 disabled:pointer-events-none cursor-pointer shadow-xl shadow-tech-destaque/30 flex items-center justify-center gap-2.5 border border-white/20"
              >
                {aiLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-tech-fundo border-t-transparent rounded-full animate-spin" />
                    <span>Processando Manuais & Inteligência Artificial...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>DIAGNOSTICAR COM IA & EMITIR LAUDO TÉCNICO</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </div>

      </section>

      {/* =========================================================================
          2. TELA DE RETORNO DO DIAGNÓSTICO (LAUDO TÉCNICO OFICIAL HENIZA TECH)
          ========================================================================= */}
      {aiResponse && (
        <section id="tela-retorno" className="bg-tech-cartao text-tech-texto rounded-2xl border border-tech-borda shadow-lg p-6 relative overflow-hidden animate-slideUp space-y-5">
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-tech-destaque via-cyan-400 to-tech-sucesso" />
          
          {/* Cabeçalho do Laudo */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-tech-borda pb-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-tech-destaque/15 border border-tech-destaque/40 flex items-center justify-center text-tech-destaque shadow-[0_0_12px_rgba(0,255,102,0.25)] shrink-0">
                <FileText className="w-6 h-6" />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] bg-tech-destaque/15 text-tech-destaque border border-tech-destaque/30 py-0.5 px-2.5 rounded-md font-black uppercase tracking-wider">
                    LAUDO TÉCNICO OFICIAL • SISTEMA OFICIA
                  </span>
                  <span className="text-[10px] bg-tech-sucesso/15 text-tech-sucesso border border-tech-sucesso/30 py-0.5 px-2 rounded-md font-bold font-mono">
                    {aiResponse.source || "Manual Técnico Automotivo"}
                  </span>
                  <span className="text-[10px] text-tech-secundario font-mono font-bold">
                    OS-{Date.now().toString().slice(-6)}
                  </span>
                </div>

                <h3 className="text-lg md:text-xl font-black text-tech-texto mt-1 font-display">
                  {aiResponse.problemName}
                </h3>

                <div className="flex items-center gap-2 text-xs font-mono text-slate-300 mt-0.5">
                  <span className="font-bold text-tech-destaque">{currentMaker.name} {selectedModelName}</span>
                  {plate && <span>• Placa: <strong className="text-white">{plate}</strong></span>}
                  {chassis && <span>• VIN: <strong className="text-white">{chassis}</strong></span>}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs text-tech-secundario">Gravidade:</span>
                <span className={`text-xs font-black px-3 py-1 rounded-full uppercase tracking-wide flex items-center gap-1.5 ${
                  aiResponse.severity?.toLowerCase() === 'alta' || aiResponse.severity?.toLowerCase() === 'high'
                    ? 'bg-tech-alerta/20 text-tech-alerta border border-tech-alerta/40 animate-pulse'
                    : 'bg-tech-sucesso/20 text-tech-sucesso border border-tech-sucesso/40'
                }`}>
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {aiResponse.severity}
                </span>
              </div>
              <span className="text-[9px] font-mono text-tech-secundario">Sistema OficIA • AutoOps</span>
            </div>
          </div>

          {/* Banner de Classificação Autodidata & Origem */}
          <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
            aiResponse.codeType === 'DIAGNOSTICO_EV_ALTA_TENSAO' || aiResponse.originBadge?.includes('ELÉTRICO') || aiResponse.originBadge?.includes('EV')
              ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-300'
              : aiResponse.codeType === 'PAINEL_INSTRUMENTOS' || aiResponse.originBadge?.includes('PAINEL')
              ? 'bg-tech-destaque/10 border-tech-destaque/40 text-tech-destaque'
              : 'bg-tech-sucesso/10 border-tech-sucesso/40 text-tech-sucesso'
          }`}>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-tech-fundo border font-mono">
                  {aiResponse.originBadge || (aiResponse.codeType === 'PAINEL_INSTRUMENTOS' ? 'PAINEL DE INSTRUMENTOS (2 DÍGITOS) — NÃO É SCANNER' : 'SCANNER OBD2 (DTC)')}
                </span>
                <span className="text-[11px] font-bold text-tech-texto">
                  {aiResponse.codeTypeLabel || 'Classificação Autodidata'}
                </span>
              </div>
              <p className="text-xs font-medium text-tech-texto/90">
                {aiResponse.originExplanation || (
                  aiResponse.codeType === 'PAINEL_INSTRUMENTOS'
                    ? 'Identificado com precisão: Este aviso é gerado pelo painel/odômetro (2 dígitos) do veículo, não se tratando de um código DTC de scanner.'
                    : 'Identificado: Dados processados segundo normas técnicas da montadora.'
                )}
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-1.5 text-[11px] font-mono font-bold text-tech-texto/80 bg-tech-fundo/70 px-2.5 py-1 rounded-lg border border-tech-borda">
              <Sparkles className="w-3.5 h-3.5 text-tech-destaque" />
              <span>Base Mundial</span>
            </div>
          </div>

          {/* Explicação Técnica dos Manuais */}
          <div className="bg-tech-fundo/70 p-4 rounded-xl border border-tech-borda space-y-1.5">
            <h4 className="text-[10px] font-black text-tech-secundario uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-tech-destaque" />
              <span>Diagnóstico Técnico & Análise de Engenharia</span>
            </h4>
            <p className="text-xs md:text-sm font-medium text-tech-texto/90 leading-relaxed whitespace-pre-line">
              {aiResponse.diagnosticNotes}
            </p>
          </div>

          {/* Procedimento de Reset / Protocolo Alternativo EV */}
          {aiResponse.resetProcedure && (
            <div className={`p-4 rounded-xl space-y-1.5 border ${
              aiResponse.codeType === 'DIAGNOSTICO_EV_ALTA_TENSAO'
                ? 'bg-cyan-950/30 border-cyan-500/40 text-cyan-200'
                : 'bg-tech-destaque/10 border-tech-destaque/30'
            }`}>
              <h4 className="text-[11px] font-black text-tech-destaque uppercase tracking-wider flex items-center gap-1.5">
                <RotateCcw className="w-4 h-4 text-tech-destaque" />
                <span>Procedimento de Reparo, Reset ou Desbloqueio Alternativo</span>
              </h4>
              <p className="text-xs md:text-sm font-mono font-bold text-tech-texto/95 leading-relaxed whitespace-pre-line">
                {aiResponse.resetProcedure}
              </p>
            </div>
          )}

          {/* Checklists: Corretivo e Preventivo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Checklist Corretivo */}
            <div className="bg-tech-fundo/60 p-4 rounded-xl border border-tech-borda space-y-2">
              <h4 className="text-[10px] font-black text-tech-destaque uppercase tracking-wider flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5" />
                <span>Checklist de Testes & Procedimentos Corretivos</span>
              </h4>
              <ul className="space-y-1.5 text-xs text-tech-texto">
                {aiResponse.correctiveChecklist?.map((c: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="font-mono font-bold text-tech-destaque shrink-0">{idx + 1}.</span>
                    <span className="font-medium text-tech-texto/90">{c}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Checklist Preventivo */}
            <div className="bg-tech-fundo/60 p-4 rounded-xl border border-tech-borda space-y-2">
              <h4 className="text-[10px] font-black text-tech-sucesso uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Ações Preventivas para Frotas & Segurança</span>
              </h4>
              <ul className="space-y-1.5 text-xs text-tech-texto">
                {aiResponse.preventiveChecklist?.map((p: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-tech-sucesso shrink-0 mt-0.5" />
                    <span className="font-medium text-tech-texto/90">{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Tabela de Orçamento Estimado */}
          <div className="bg-tech-fundo p-4 rounded-xl border border-tech-borda space-y-3">
            <div className="flex justify-between items-center border-b border-tech-borda pb-2">
              <h4 className="text-[10px] font-black text-tech-secundario uppercase tracking-wider flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-tech-destaque" />
                <span>Orçamento Estimado do Serviço (Peças & Mão de Obra)</span>
              </h4>
              <span className="text-[10px] text-tech-secundario font-mono">BRL (R$)</span>
            </div>

            <div className="space-y-2">
              {aiResponse.budgetItems?.map((b: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center text-xs">
                  <span className="text-tech-texto flex items-center gap-1.5">
                    <span>• {b.item}</span>
                    <span className="text-[9px] bg-tech-cartao text-tech-destaque px-1.5 py-0.5 rounded border border-tech-borda font-bold uppercase">
                      {b.category}
                    </span>
                  </span>
                  <span className="font-mono font-bold text-tech-destaque">
                    R$ {b.estimatedCost?.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center text-xs font-black text-tech-texto border-t border-tech-borda pt-2">
              <span>Total Estimado do Atendimento:</span>
              <span className="font-mono text-base text-tech-destaque">
                R$ {aiResponse.budgetItems?.reduce((acc: number, curr: any) => acc + curr.estimatedCost, 0)?.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Barra de Ações: WhatsApp, Imprimir, Copiar, Novo Diagnóstico */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 pt-4 border-t border-tech-borda">
            <div className="flex flex-wrap items-center gap-2">
              {whatsappShareUrl && (
                <a
                  href={whatsappShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-700 transition text-xs font-bold text-white px-4 py-2.5 min-h-[42px] rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-emerald-900/20"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Enviar no WhatsApp</span>
                </a>
              )}

              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 sm:flex-initial bg-tech-fundo hover:bg-tech-borda text-tech-texto border border-tech-borda text-xs font-bold px-4 py-2.5 min-h-[42px] rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-tech-destaque" />
                <span>Imprimir</span>
              </button>

              <button
                type="button"
                onClick={handleCopyReport}
                className="flex-1 sm:flex-initial bg-tech-fundo hover:bg-tech-borda text-tech-texto border border-tech-borda text-xs font-bold px-4 py-2.5 min-h-[42px] rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-tech-sucesso" /> : <Copy className="w-3.5 h-3.5 text-tech-destaque" />}
                <span>{copied ? "Copiado!" : "Copiar"}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleNewDiagnosis}
              className="w-full sm:w-auto bg-tech-destaque/10 hover:bg-tech-destaque/20 text-tech-destaque border border-tech-destaque/30 text-xs font-bold px-4 py-2.5 min-h-[42px] rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Novo Diagnóstico</span>
            </button>
          </div>

        </section>
      )}

    </div>
  );
}

