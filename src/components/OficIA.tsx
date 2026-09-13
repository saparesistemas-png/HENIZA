import React, { useState, useEffect, useMemo } from 'react';
import {
  Wrench, Search, RotateCcw, Car, CheckCircle2
} from 'lucide-react';
import { SelectedLang } from '../data';
import { BRAZIL_AUTOMAKERS, decodeVinDetails } from '../automakersData';
import MultimodalMediaCapture from './MultimodalMediaCapture';
import DiagnosisResultFlow from './DiagnosisResultFlow';

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
  maintenanceHistory,
  mobileBudgets,
  setMobileBudgets,
  saveToStorage,
}: OficIAProps) {
  const [plate, setPlate] = useState('ABC1D23');
  const [chassis, setChassis] = useState('');
  const [selectedMakerId, setSelectedMakerId] = useState('volkswagen');
  const [selectedModelName, setSelectedModelName] = useState('');
  const [isEvAlternativeMode, setIsEvAlternativeMode] = useState(false);
  const [symptomQuery, setSymptomQuery] = useState('');
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [attachedVideo, setAttachedVideo] = useState<string | null>(null);
  const [attachedAudio, setAttachedAudio] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<any>(null);
  const [whatsappShareUrl, setWhatsappShareUrl] = useState('');

  const currentMaker = useMemo(
    () => BRAZIL_AUTOMAKERS.find((m) => m.id === selectedMakerId) || BRAZIL_AUTOMAKERS[0],
    [selectedMakerId]
  );

  const currentModel = useMemo(() => {
    const models = currentMaker.models || [];
    return models.find((m) => m.name === selectedModelName) || models[0];
  }, [currentMaker, selectedModelName]);

  useEffect(() => {
    if (!selectedModelName && currentMaker.models?.[0]) {
      setSelectedModelName(currentMaker.models[0].name);
      setIsEvAlternativeMode(
        currentMaker.models[0].category === 'EV' || currentMaker.models[0].category === 'HYBRID'
      );
    }
  }, [currentMaker, selectedModelName]);

  const handleMakerChange = (makerId: string) => {
    setSelectedMakerId(makerId);
    const maker = BRAZIL_AUTOMAKERS.find((m) => m.id === makerId);
    if (maker?.models?.[0]) {
      setSelectedModelName(maker.models[0].name);
      setIsEvAlternativeMode(
        maker.models[0].category === 'EV' || maker.models[0].category === 'HYBRID'
      );
    }
  };

  const handleModelChange = (modelName: string) => {
    setSelectedModelName(modelName);
    const model = currentMaker.models.find((m) => m.name === modelName);
    if (model) {
      setIsEvAlternativeMode(model.category === 'EV' || model.category === 'HYBRID');
    }
  };

  const handleNewDiagnosis = () => {
    setAiResponse(null);
    setSymptomQuery('');
    setAttachedImage(null);
    setAttachedVideo(null);
    setAttachedAudio(null);
    setSuccessToast('Tela limpa para novo diagnóstico.');
  };

  const handleRunDiagnosis = async () => {
    const fullQuery = symptomQuery.trim();
    if (!fullQuery && !attachedImage && !attachedVideo && !attachedAudio && !chassis) {
      setSuccessToast('Informe relato, código, chassi, áudio ou imagem.');
      return;
    }

    setAiLoading(true);
    setAiResponse(null);

    try {
      let rawData: any = null;

      if (!isOffline) {
        const payload = {
          description:
            fullQuery ||
            `Diagnóstico de rotina para ${currentMaker.name} ${selectedModelName}`,
          mode: attachedVideo
            ? 'video'
            : attachedImage
              ? 'photo'
              : attachedAudio
                ? 'audio'
                : 'description',
          image: attachedImage,
          video: attachedVideo,
          audio: attachedAudio,
          lang,
          plate,
          chassis,
          make: currentMaker.name,
          model: selectedModelName,
          propulsionType: currentModel?.category || 'Flex',
          isEvAlternative: isEvAlternativeMode,
        };

        const res = await fetch('/api/diagnose', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const json = await res.json();
          rawData = json?.data && typeof json.data === 'object' ? json.data : json;
        }
      }

      if (!rawData) {
        rawData = {
          problemName: `${currentMaker.name} ${selectedModelName} — ${fullQuery.slice(0, 50) || 'Análise'}`,
          severity: 'Média',
          originBadge: 'Laudo local',
          originExplanation: 'Modo offline ou API indisponível.',
          diagnosticNotes: 'Confirme os sintomas no veículo e repita o diagnóstico online quando possível.',
          resetProcedure: '1. Ler códigos.\n2. Registrar evidências.\n3. Repetir online.',
          correctiveChecklist: ['Ler scanner OBD2', 'Verificar bateria e massas', 'Inspecionar conectores'],
          preventiveChecklist: ['Manutenção em dia'],
          budgetItems: [
            { item: 'Diagnóstico eletrônico', category: 'Mão de Obra', estimatedCost: 180 },
          ],
          source: 'OficIA (offline)',
          codeType: 'SCANNER_OBD2',
          codeTypeLabel: 'Offline',
        };
      }

      if (!rawData.networkNotes) {
        rawData.networkNotes =
          rawData.originExplanation ||
          'Compare o laudo da IA com o scanner, esquema elétrico e sintoma real do veículo antes de aprovar.';
      }
      if (!rawData.networkSources) {
        rawData.networkSources = [
          rawData.source || 'Base OficIA',
          rawData.codeTypeLabel || rawData.originBadge || 'Classificação do código/sintoma',
        ].filter(Boolean);
      }

      setAiResponse(rawData);

      const estTotal =
        rawData.budgetItems?.reduce(
          (acc: number, curr: any) => acc + (curr.estimatedCost || 0),
          0
        ) || 0;
      const textMsg = encodeURIComponent(
        `*OficIA — Laudo*\nVeículo: ${currentMaker.name} ${selectedModelName}\nPlaca: ${plate}\nDiagnóstico: ${rawData.problemName}\nGravidade: ${rawData.severity}\nTotal estimado: R$ ${estTotal.toFixed(2)}`
      );
      setWhatsappShareUrl(`https://api.whatsapp.com/send?text=${textMsg}`);
      setSuccessToast('Laudo gerado. Valide com o checklist do mecânico.');

      setTimeout(() => {
        document.getElementById('tela-retorno')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err) {
      console.error(err);
      setSuccessToast('Erro ao processar diagnóstico.');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fadeIn max-w-5xl mx-auto px-1 sm:px-0">
      <div className="bg-tech-cartao border border-tech-borda rounded-xl p-4 sm:p-5 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-tech-fundo border border-tech-destaque/40 flex items-center justify-center text-tech-destaque">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">
              Ofic<span className="text-tech-destaque">IA</span>
            </h2>
            <p className="text-xs text-slate-400">Diagnóstico para validação do profissional</p>
          </div>
        </div>
      </div>

      <section id="tela-descricao" className="bg-tech-cartao border border-tech-borda rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex items-center gap-2 text-tech-destaque">
          <Car className="w-4 h-4" />
          <h3 className="text-xs font-black uppercase tracking-wide">Dados do veículo</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="text-xs text-slate-400 space-y-1">
            <span>Placa</span>
            <input
              value={plate}
              onChange={(e) => setPlate(e.target.value.toUpperCase())}
              className="w-full rounded-lg bg-tech-fundo border border-tech-borda px-3 py-2 text-sm text-white"
            />
          </label>
          <label className="text-xs text-slate-400 space-y-1">
            <span>Chassi / VIN</span>
            <input
              value={chassis}
              onChange={(e) => setChassis(e.target.value.toUpperCase())}
              className="w-full rounded-lg bg-tech-fundo border border-tech-borda px-3 py-2 text-sm text-white"
            />
          </label>
          <label className="text-xs text-slate-400 space-y-1">
            <span>Montadora</span>
            <select
              value={selectedMakerId}
              onChange={(e) => handleMakerChange(e.target.value)}
              className="w-full rounded-lg bg-tech-fundo border border-tech-borda px-3 py-2 text-sm text-white"
            >
              {BRAZIL_AUTOMAKERS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-slate-400 space-y-1">
            <span>Modelo</span>
            <select
              value={selectedModelName}
              onChange={(e) => handleModelChange(e.target.value)}
              className="w-full rounded-lg bg-tech-fundo border border-tech-borda px-3 py-2 text-sm text-white"
            >
              {(currentMaker.models || []).map((m) => (
                <option key={m.name} value={m.name}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block text-xs text-slate-400 space-y-1">
          <span>Relato / código do scanner ou painel</span>
          <textarea
            value={symptomQuery}
            onChange={(e) => setSymptomQuery(e.target.value)}
            rows={3}
            placeholder="Ex.: P0300, motor falhando em marcha lenta, vibração..."
            className="w-full rounded-lg bg-tech-fundo border border-tech-borda px-3 py-2 text-sm text-white"
          />
        </label>

        <MultimodalMediaCapture
          onAddTranscript={(t: string) =>
            setSymptomQuery((prev) => (prev ? prev + ' ' + t : t).trim())
          }
          onAttachImage={(b64: string) => setAttachedImage(b64)}
          onAttachVideo={(b64: string) => setAttachedVideo(b64)}
          onAttachAudio={(b64: string) => setAttachedAudio(b64)}
          onClearMedia={(type: 'image' | 'video' | 'audio') => {
            if (type === 'image') setAttachedImage(null);
            if (type === 'video') setAttachedVideo(null);
            if (type === 'audio') setAttachedAudio(null);
          }}
          attachedImage={attachedImage}
          attachedVideo={attachedVideo}
          attachedAudio={attachedAudio}
        />

        <button
          type="button"
          disabled={aiLoading}
          onClick={handleRunDiagnosis}
          className="w-full py-3 rounded-xl bg-tech-destaque text-tech-fundo text-sm font-black flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {aiLoading ? (
            'Gerando laudo...'
          ) : (
            <>
              <Search className="w-4 h-4" />
              Diagnosticar com IA
            </>
          )}
        </button>
      </section>

      {aiResponse && (
        <DiagnosisResultFlow
          data={aiResponse}
          vehicleLabel={`${currentMaker.name} ${selectedModelName}`}
          plate={plate}
          chassis={chassis}
          whatsappShareUrl={whatsappShareUrl}
          setSuccessToast={setSuccessToast}
          onNewDiagnosis={handleNewDiagnosis}
          onConfirmBudget={(items, total) => {
            const newBudgetObj = {
              id: `OS-${Date.now()}`,
              cliente: `Proprietário (${plate})`,
              veiculo: `${currentMaker.name} ${selectedModelName} - Placa: ${plate}`,
              valor: `R$ ${total.toFixed(2)}`,
              status: 'Aprovado',
              data: new Date().toLocaleDateString('pt-BR'),
              items,
            };
            const updatedBudgets = [newBudgetObj, ...mobileBudgets];
            setMobileBudgets(updatedBudgets);
            saveToStorage(inventory, maintenanceHistory, updatedBudgets);
          }}
          onOverrideSubmit={(mechanicNotes) => {
            setAiResponse((prev: any) => ({
              ...prev,
              mechanicOverride: mechanicNotes,
              diagnosticNotes: `${prev?.diagnosticNotes || ''}\n\n[Profissional] ${mechanicNotes}`,
            }));
          }}
        />
      )}
    </div>
  );
}
