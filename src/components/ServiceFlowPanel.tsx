import React, { useMemo, useRef, useState } from 'react';
import {
  Camera,
  CheckCircle2,
  Lock,
  ChevronRight,
  ClipboardList,
  AlertTriangle,
  Trash2,
} from 'lucide-react';
import {
  ServiceFlowCase,
  FlowStage,
  STAGE_ORDER,
  STAGE_LABELS,
  getAllSlots,
  validateStagePhotos,
  createCase,
  upsertPhoto,
  setStageNotes,
  tryAdvance,
  saveCase,
  exportCasePayload,
  evidenceManifest,
} from '../services/serviceFlow';

type Props = {
  plate?: string;
  chassis?: string;
  make?: string;
  model?: string;
  odometerKm?: number;
  diagnosisData?: Record<string, unknown> | null;
  setSuccessToast: (msg: string | null) => void;
  onCaseChange?: (c: ServiceFlowCase | null) => void;
};

function compressImage(file: File, maxW = 1280, quality = 0.72): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxW / img.width);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('canvas'));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('image'));
    };
    img.src = url;
  });
}

export default function ServiceFlowPanel({
  plate = '',
  chassis = '',
  make = '',
  model = '',
  odometerKm,
  diagnosisData,
  setSuccessToast,
  onCaseChange,
}: Props) {
  const [open, setOpen] = useState(true);
  const [flow, setFlow] = useState<ServiceFlowCase | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const stage = flow?.currentStage || 'entrada';
  const slots = useMemo(() => (stage === 'finalizado' ? [] : getAllSlots(stage)), [stage]);
  const stageRec = flow?.stages[stage as Exclude<FlowStage, 'finalizado'>];
  const validation = flow && stage !== 'finalizado'
    ? validateStagePhotos(stage, stageRec?.photos || [])
    : { ok: true, missing: [], message: '' };

  const update = (next: ServiceFlowCase) => {
    setFlow(next);
    saveCase(next);
    onCaseChange?.(next);
  };

  const startCase = () => {
    const c = createCase({
      plate,
      chassis,
      make,
      model,
      odometerKm,
    });
    update(c);
    setSuccessToast(`OS ${c.id} aberta — etapa Entrada. Fotos no padrão obrigatórias.`);
  };

  const onPickPhoto = async (slotId: string, file: File | null) => {
    if (!flow || !file) return;
    if (!file.type.startsWith('image/')) {
      setSuccessToast('Apenas imagens. Padrão: foto (JPEG/PNG).');
      return;
    }
    try {
      const dataUrl = await compressImage(file);
      const next = upsertPhoto(flow, stage as FlowStage, slotId, dataUrl);
      update(next);
      setSuccessToast('Foto registrada no padrão da etapa.');
    } catch {
      setSuccessToast('Falha ao processar a imagem.');
    }
  };

  const removePhoto = (slotId: string) => {
    if (!flow) return;
    const rec = flow.stages[stage as FlowStage];
    if (!rec) return;
    const photos = (rec.photos || []).filter((p) => p.slotId !== slotId);
    const next = {
      ...flow,
      stages: { ...flow.stages, [stage]: { ...rec, photos } },
      updatedAt: new Date().toISOString(),
    };
    update(next);
  };

  const advance = () => {
    if (!flow) return;
    const result = tryAdvance(flow, {
      diagnosisSnapshot: diagnosisData || flow.diagnosisSnapshot || undefined,
    });
    if (!result.ok) {
      setSuccessToast(result.message);
      return;
    }
    update(result.case);
    setSuccessToast(
      result.case.currentStage === 'finalizado'
        ? 'OS finalizada. Evidências amarradas em todas as etapas.'
        : `Avançou para ${STAGE_LABELS[result.case.currentStage]}. Complete as fotos obrigatórias.`
    );
  };

  const copyManifest = () => {
    if (!flow) return;
    const payload = exportCasePayload(flow);
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2)).then(() => {
      setSuccessToast('Manifesto da OS copiado (integração ERP).');
    });
  };

  return (
    <section className="bg-tech-cartao rounded-2xl border border-emerald-500/30 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-emerald-400" />
          <div>
            <p className="text-xs font-black text-white uppercase tracking-wide">
              Fluxo OS · evidências obrigatórias
            </p>
            <p className="text-[10px] text-slate-400">
              Entrada → Diagnóstico → Serviço → Conclusão → Saída
            </p>
          </div>
        </div>
        <span className="text-[10px] font-bold text-emerald-300">{open ? 'Ocultar' : 'Abrir'}</span>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-tech-borda/60 pt-3">
          {!flow ? (
            <button
              type="button"
              onClick={startCase}
              className="w-full py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-xs font-black text-emerald-200"
            >
              Abrir OS e iniciar etapa Entrada
            </button>
          ) : (
            <>
              <div className="flex flex-wrap gap-1.5">
                {STAGE_ORDER.filter((s) => s !== 'finalizado').map((s) => {
                  const done = Boolean(flow.stages[s]?.completedAt);
                  const active = flow.currentStage === s;
                  return (
                    <span
                      key={s}
                      className={`text-[9px] px-2 py-1 rounded-full border font-bold ${
                        done
                          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-200'
                          : active
                            ? 'bg-tech-destaque/20 border-tech-destaque/40 text-tech-destaque'
                            : 'bg-tech-fundo border-tech-borda text-slate-500'
                      }`}
                    >
                      {done ? '✓ ' : active ? '● ' : ''}
                      {STAGE_LABELS[s]}
                    </span>
                  );
                })}
              </div>

              <p className="text-[11px] text-slate-400">
                OS <span className="text-white font-bold">{flow.id}</span>
                {flow.plate ? ` · ${flow.plate}` : ''}
                {' · '}
                <span className="text-emerald-300">{STAGE_LABELS[flow.currentStage]}</span>
              </p>

              {flow.currentStage !== 'finalizado' && (
                <>
                  <div className="space-y-2">
                    {slots.map((slot) => {
                      const photo = (stageRec?.photos || []).find((p) => p.slotId === slot.id);
                      return (
                        <div
                          key={slot.id}
                          className={`rounded-xl border p-3 space-y-1.5 ${
                            slot.required && !photo
                              ? 'border-amber-500/40 bg-amber-500/5'
                              : photo
                                ? 'border-emerald-500/30 bg-emerald-500/5'
                                : 'border-tech-borda'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-xs font-bold text-white">
                                {slot.label}{' '}
                                {slot.required ? (
                                  <span className="text-amber-400 text-[10px]">OBRIGATÓRIA</span>
                                ) : (
                                  <span className="text-slate-500 text-[10px]">opcional</span>
                                )}
                              </p>
                              <p className="text-[10px] text-slate-400 leading-relaxed">
                                Padrão: {slot.pattern}
                              </p>
                              <p className="text-[10px] text-slate-500">Enquadramento: {slot.framing}</p>
                            </div>
                            {photo && (
                              <button
                                type="button"
                                onClick={() => removePhoto(slot.id)}
                                className="text-slate-500 hover:text-red-400"
                                title="Remover"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          {photo?.dataUrl && (
                            <img
                              src={photo.dataUrl}
                              alt={slot.label}
                              className="w-full max-h-36 object-cover rounded-lg border border-tech-borda"
                            />
                          )}
                          <input
                            ref={(el) => {
                              fileRefs.current[slot.id] = el;
                            }}
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            onChange={(e) =>
                              onPickPhoto(slot.id, e.target.files?.[0] || null)
                            }
                          />
                          <button
                            type="button"
                            onClick={() => fileRefs.current[slot.id]?.click()}
                            className="w-full py-2 rounded-lg border border-tech-borda text-[11px] font-bold text-slate-200 flex items-center justify-center gap-1.5"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            {photo ? 'Substituir foto' : 'Capturar no padrão'}
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  <label className="block text-xs text-slate-400 space-y-1">
                    <span>Notas da etapa</span>
                    <textarea
                      value={stageRec?.notes || ''}
                      onChange={(e) => {
                        if (!flow) return;
                        update(setStageNotes(flow, stage as FlowStage, e.target.value));
                      }}
                      rows={2}
                      className="w-full rounded-lg bg-tech-fundo border border-tech-borda px-3 py-2 text-sm text-white"
                      placeholder="Observações do profissional…"
                    />
                  </label>

                  {!validation.ok && (
                    <div className="flex gap-2 text-[11px] text-amber-200 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
                      <Lock className="w-4 h-4 shrink-0 mt-0.5" />
                      <p>{validation.message}</p>
                    </div>
                  )}

                  {flow.currentStage === 'diagnostico' && !diagnosisData && !flow.diagnosisSnapshot && (
                    <div className="flex gap-2 text-[11px] text-cyan-200 bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-3">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <p>
                        Rode o <strong>Diagnóstico com IA</strong> nesta tela para amarrar o laudo
                        antes de ir ao Serviço.
                      </p>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={advance}
                    disabled={!validation.ok}
                    className="w-full py-3 rounded-xl bg-emerald-500 text-tech-fundo text-xs font-black flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {validation.ok ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Lock className="w-4 h-4" />
                    )}
                    {validation.ok ? (
                      <>
                        Concluir etapa e avançar <ChevronRight className="w-4 h-4" />
                      </>
                    ) : (
                      'Bloqueado — complete as fotos obrigatórias'
                    )}
                  </button>
                </>
              )}

              {flow.currentStage === 'finalizado' && (
                <div className="space-y-2 text-[11px] text-emerald-200">
                  <p className="font-bold">OS finalizada com evidências em todas as etapas.</p>
                  <ul className="text-slate-400 space-y-0.5">
                    {evidenceManifest(flow)
                      .filter((r) => r.required)
                      .map((r) => (
                        <li key={r.slotId}>
                          {r.hasPhoto ? '✓' : '✗'} {r.stage}: {r.label}
                        </li>
                      ))}
                  </ul>
                </div>
              )}

              <button
                type="button"
                onClick={copyManifest}
                className="w-full py-2 rounded-xl border border-tech-borda text-[11px] font-bold text-slate-300"
              >
                Copiar manifesto (ERP / locadora)
              </button>
            </>
          )}
        </div>
      )}
    </section>
  );
}
