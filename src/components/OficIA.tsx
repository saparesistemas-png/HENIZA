import React, { useState, useEffect, useMemo } from 'react';
import {
  Wrench, Search, Car
} from 'lucide-react';
import { SelectedLang } from '../data';
import { BRAZIL_AUTOMAKERS } from '../automakersData';
import MultimodalMediaCapture from './MultimodalMediaCapture';
import DiagnosisResultFlow from './DiagnosisResultFlow';
import ObdLivePanel from './ObdLivePanel';
import SystemUpdateModule from './SystemUpdateModule';
import ServiceFlowPanel from './ServiceFlowPanel';
import OutboxStatusBadge from './OutboxStatusBadge';
import { getObdLiveSession, PID_DEFS } from '../services/obdLive';

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
  const [odometerKm, setOdometerKm] = useState('');
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
    const hasLiveObd = Object.keys(getObdLiveSession().snapshot().samples || {}).length > 0;
    if (!fullQuery && !attachedImage && !attachedVideo && !attachedAudio && !chassis && !hasLiveObd) {
      setSuccessToast('Informe relato, código, chassi, OBD ao vivo, áudio ou imagem.');
      return;
    }

    setAiLoading(true);
    setAiResponse(null);

    try {
      let rawData: any = null;

      if (!isOffline) {
        const obdSnap = getObdLiveSession().snapshot();
        const liveObd = Object.values(obdSnap.samples || {})
          .filter(Boolean)
          .map((s: any) => ({
            id: s.id,
            name: s.name || PID_DEFS.find((p) => p.id === s.id)?.name,
            value: s.value,
            unit: s.unit,
            ok: s.ok,
          }));

        const liveHint = liveObd.length > 0 ? getObdLiveSession().buildSymptomHint() : '';
        const kmPart = odometerKm ? ` Odômetro ${odometerKm} km.` : '';
        const descriptionBase =
          (fullQuery ||
            `Diagnóstico de rotina para ${currentMaker.name} ${selectedModelName}`) + kmPart;

        const payload = {
          description: liveHint ? `${descriptionBase}\n${liveHint}` : descriptionBase,
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
          plate,
          chassis,
          make: currentMaker.name,
          model: selectedModelName,
          isEvAlternative: isEvAlternativeMode,
          liveObd: liveObd.length ? liveObd : undefined,
          odometerKm: odometerKm ? Number(odometerKm) : undefined,
        };

        const res = await fetch('/api/diagnose', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (json?.ok && json?.data) {
          rawData = json.data;
        }
      }

      if (!rawData) {
        rawData = {
          problemName: fullQuery.slice(0, 80) || 'Diagnóstico offline',
          severity: 'Média',
          diagnosticNotes:
            'Modo offline ou API indisponível. Confirme códigos no scanner e valide no veículo.',
          correctiveChecklist: [
            'Ler códigos OBD2',
            'Verificar bateria e massas',
            'Inspecionar chicotes',
          ],
          preventiveChecklist: ['Óleo e filtros no prazo', 'Revisões conforme manual'],
          budgetItems: [
            { item: 'Diagnóstico eletrônico', category: 'Mão de Obra', estimatedCost: 180 },
          ],
          source: 'OficIA (offline)',
        };
      }

      setAiResponse(rawData);

      const shareText = [
        `OficIA — ${currentMaker.name} ${selectedModelName}`,
        `Placa: ${plate}`,
        odometerKm ? `Km: ${odometerKm}` : '',
        `Diagnóstico: ${rawData.problemName || ''}`,
        rawData.diagnosticNotes || '',
      ]
        .filter(Boolean)
        .join('\n');
      setWhatsappShareUrl(`https://wa.me/?text=${encodeURIComponent(shareText)}`);
      setSuccessToast('Laudo gerado. Amarrado ao fluxo OS na etapa Diagnóstico.');
    } catch (err) {
      console.error(err);
      setSuccessToast('Erro ao gerar diagnóstico. Tente novamente.');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fadeIn max-w-5xl mx-auto px-1 sm:px-0">
      <div className="bg-tech-cartao border border-tech-borda rounded-xl p-4 sm:p-5 shadow-lg">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-tech-fundo border border-tech-destaque/40 flex items-center justify-center text-tech-destaque">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">
                Ofic<span className="text-tech-destaque">IA</span>
              </h2>
              <p className="text-xs text-slate-400">
                Fluxo OS · evidências · outbox Dexie
              </p>
            </div>
          </div>
          <OutboxStatusBadge />
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
            <span>Odômetro (km)</span>
            <input
              value={odometerKm}
              onChange={(e) => setOdometerKm(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="Ex.: 85000"
              inputMode="numeric"
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
          <label className="text-xs text-slate-400 space-y-1 sm:col-span-2">
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

        <ServiceFlowPanel
          plate={plate}
          chassis={chassis}
          make={currentMaker.name}
          model={selectedModelName}
          odometerKm={odometerKm ? Number(odometerKm) : undefined}
          diagnosisData={aiResponse}
          setSuccessToast={setSuccessToast}
        />

        <label className="block text-xs text-slate-400 space-y-1">
          <span>Relato / código do scanner ou painel</span>
          <textarea
            value={symptomQuery}
            onChange={(e) => setSymptomQuery(e.target.value)}
            rows={3}
            placeholder="Ex.: P0300, motor falhando…"
            className="w-full rounded-lg bg-tech-fundo border border-tech-borda px-3 py-2 text-sm text-white"
          />
        </label>

        <SystemUpdateModule
          setSuccessToast={setSuccessToast}
          onInjectSymptom={(text) =>
            setSymptomQuery((prev) => (prev ? prev + '\n' + text : text))
          }
        />

        <ObdLivePanel
          setSuccessToast={setSuccessToast}
          onInjectSymptom={(text) =>
            setSymptomQuery((prev) => (prev ? prev + '\n' + text : text))
          }
          onRequestDiagnosis={() => {
            void handleRunDiagnosis();
          }}
        />

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
