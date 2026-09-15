/**
 * Fluxo de OS: Entrada → Diagnóstico → Serviço → Conclusão → Saída
 * Cada etapa exige evidências fotográficas no padrão definido.
 * Sem checklist completo, não avança.
 */

export type FlowStage =
  | 'entrada'
  | 'diagnostico'
  | 'servico'
  | 'conclusao'
  | 'saida'
  | 'finalizado';

export type PhotoSlotId = string;

export type PhotoSlotDef = {
  id: PhotoSlotId;
  label: string;
  /** Instrução do padrão visual obrigatório */
  pattern: string;
  required: boolean;
  /** Dicas de enquadramento */
  framing: string;
};

export type PhotoEvidence = {
  slotId: PhotoSlotId;
  dataUrl: string;
  capturedAt: string;
  note?: string;
};

export type StageRecord = {
  stage: FlowStage;
  startedAt?: string;
  completedAt?: string;
  photos: PhotoEvidence[];
  notes: string;
  meta?: Record<string, unknown>;
};

export type ServiceFlowCase = {
  id: string;
  plate: string;
  chassis: string;
  make: string;
  model: string;
  odometerKm?: number;
  rentalWorkOrderId?: string;
  currentStage: FlowStage;
  stages: Partial<Record<FlowStage, StageRecord>>;
  diagnosisSnapshot?: Record<string, unknown> | null;
  budgetTotal?: number;
  createdAt: string;
  updatedAt: string;
};

export const STAGE_ORDER: FlowStage[] = [
  'entrada',
  'diagnostico',
  'servico',
  'conclusao',
  'saida',
  'finalizado',
];

export const STAGE_LABELS: Record<FlowStage, string> = {
  entrada: '1 · Entrada',
  diagnostico: '2 · Diagnóstico',
  servico: '3 · Serviço',
  conclusao: '4 · Conclusão',
  saida: '5 · Saída',
  finalizado: 'Finalizado',
};

/** Padrões obrigatórios de foto por etapa (não avançar sem cumprir). */
export const PHOTO_SLOTS: Record<Exclude<FlowStage, 'finalizado'>, PhotoSlotDef[]> = {
  entrada: [
    {
      id: 'ent_placa_frontal',
      label: 'Placa frontal',
      pattern: 'Placa legível, veículo centralizado, luz natural ou flash sem estouro',
      required: true,
      framing: 'Horizontal, placa ocupando ≥30% da largura da imagem',
    },
    {
      id: 'ent_odometro',
      label: 'Odômetro / painel',
      pattern: 'Km nítido no painel, sem reflexo que esconda o número',
      required: true,
      framing: 'Close do cluster; km legível',
    },
    {
      id: 'ent_dianteira',
      label: 'Vista dianteira',
      pattern: 'Veículo inteiro de frente, pneus no chão',
      required: true,
      framing: 'Distância ~3–5 m',
    },
    {
      id: 'ent_traseira',
      label: 'Vista traseira',
      pattern: 'Veículo inteiro de trás, placa traseira visível se houver',
      required: true,
      framing: 'Distância ~3–5 m',
    },
    {
      id: 'ent_lateral_dir',
      label: 'Lateral direita',
      pattern: 'Perfil completo lado direito',
      required: true,
      framing: 'Ângulo 90°',
    },
    {
      id: 'ent_lateral_esq',
      label: 'Lateral esquerda',
      pattern: 'Perfil completo lado esquerdo',
      required: true,
      framing: 'Ângulo 90°',
    },
    {
      id: 'ent_avaria',
      label: 'Avaria / detalhe (se houver)',
      pattern: 'Close da avaria com referência de escala (mão ou ferramenta)',
      required: false,
      framing: 'Foco na área danificada',
    },
  ],
  diagnostico: [
    {
      id: 'diag_scanner',
      label: 'Tela do scanner / códigos',
      pattern: 'Display do scanner com códigos DTC legíveis ou print do OficIA',
      required: true,
      framing: 'Sem corte no código; data/hora se possível',
    },
    {
      id: 'diag_compartimento',
      label: 'Compartimento do motor / área',
      pattern: 'Área sob análise aberta e iluminada',
      required: true,
      framing: 'Visão geral do vão',
    },
    {
      id: 'diag_componente',
      label: 'Componente suspeito',
      pattern: 'Peça/sensor/conector citado no laudo em close',
      required: true,
      framing: 'Close com contexto do chicote',
    },
  ],
  servico: [
    {
      id: 'srv_antes',
      label: 'Antes da intervenção',
      pattern: 'Área de trabalho antes da troca/reparo',
      required: true,
      framing: 'Mesmo ângulo que será usado no “depois”',
    },
    {
      id: 'srv_peca',
      label: 'Peça / material',
      pattern: 'Peça nova ou material com identificação (etiqueta se houver)',
      required: true,
      framing: 'Close legível',
    },
    {
      id: 'srv_depois',
      label: 'Após intervenção',
      pattern: 'Mesmo enquadramento do “antes”, peça instalada',
      required: true,
      framing: 'Ângulo comparável ao srv_antes',
    },
  ],
  conclusao: [
    {
      id: 'conc_scanner_ok',
      label: 'Scanner pós-reparo',
      pattern: 'Tela sem códigos pendentes ou com status “pass” / monitor ready',
      required: true,
      framing: 'Códigos/status legíveis',
    },
    {
      id: 'conc_teste',
      label: 'Evidência de teste',
      pattern: 'Teste em bancada, rodagem ou função (ex.: ventoinha, marcha)',
      required: true,
      framing: 'Mostrar resultado do teste',
    },
  ],
  saida: [
    {
      id: 'sai_placa',
      label: 'Placa na saída',
      pattern: 'Placa legível na liberação',
      required: true,
      framing: 'Igual padrão de entrada',
    },
    {
      id: 'sai_vista_geral',
      label: 'Vista geral saída',
      pattern: 'Veículo completo pronto para retirada',
      required: true,
      framing: '3/4 dianteira ou lateral',
    },
    {
      id: 'sai_painel_km',
      label: 'Odômetro na saída',
      pattern: 'Km no momento da liberação',
      required: true,
      framing: 'Km legível',
    },
  ],
};

export function nextStage(current: FlowStage): FlowStage | null {
  const i = STAGE_ORDER.indexOf(current);
  if (i < 0 || i >= STAGE_ORDER.length - 1) return null;
  return STAGE_ORDER[i + 1];
}

export function getRequiredSlots(stage: FlowStage): PhotoSlotDef[] {
  if (stage === 'finalizado') return [];
  return (PHOTO_SLOTS[stage] || []).filter((s) => s.required);
}

export function getAllSlots(stage: FlowStage): PhotoSlotDef[] {
  if (stage === 'finalizado') return [];
  return PHOTO_SLOTS[stage] || [];
}

export type StageValidation = {
  ok: boolean;
  missing: PhotoSlotDef[];
  message: string;
};

/** Valida se a etapa pode ser concluída (fotos obrigatórias presentes). */
export function validateStagePhotos(
  stage: FlowStage,
  photos: PhotoEvidence[]
): StageValidation {
  if (stage === 'finalizado') {
    return { ok: true, missing: [], message: 'Fluxo finalizado.' };
  }
  const required = getRequiredSlots(stage);
  const have = new Set(photos.map((p) => p.slotId));
  const missing = required.filter((s) => !have.has(s.id) || !photos.find((p) => p.slotId === s.id)?.dataUrl);
  if (missing.length) {
    return {
      ok: false,
      missing,
      message: `Padrão fotográfico incompleto: faltam ${missing.length} foto(s) obrigatória(s) — ${missing
        .map((m) => m.label)
        .join(', ')}. O sistema não avança.`,
    };
  }
  // validar dataUrl mínima
  for (const p of photos) {
    if (p.dataUrl && !p.dataUrl.startsWith('data:image')) {
      return {
        ok: false,
        missing: [],
        message: `Arquivo inválido no slot ${p.slotId}: use imagem (foto).`,
      };
    }
  }
  return { ok: true, missing: [], message: 'Evidências no padrão. Pode avançar.' };
}

export function createCase(input: {
  plate?: string;
  chassis?: string;
  make?: string;
  model?: string;
  odometerKm?: number;
  rentalWorkOrderId?: string;
}): ServiceFlowCase {
  const now = new Date().toISOString();
  return {
    id: `OS-${Date.now()}`,
    plate: (input.plate || '').toUpperCase(),
    chassis: (input.chassis || '').toUpperCase(),
    make: input.make || '',
    model: input.model || '',
    odometerKm: input.odometerKm,
    rentalWorkOrderId: input.rentalWorkOrderId,
    currentStage: 'entrada',
    stages: {
      entrada: { stage: 'entrada', startedAt: now, photos: [], notes: '' },
    },
    diagnosisSnapshot: null,
    createdAt: now,
    updatedAt: now,
  };
}

export function upsertPhoto(
  c: ServiceFlowCase,
  stage: FlowStage,
  slotId: string,
  dataUrl: string,
  note?: string
): ServiceFlowCase {
  const rec =
    c.stages[stage] ||
    ({ stage, photos: [], notes: '', startedAt: new Date().toISOString() } as StageRecord);
  const photos = rec.photos.filter((p) => p.slotId !== slotId);
  photos.push({
    slotId,
    dataUrl,
    capturedAt: new Date().toISOString(),
    note,
  });
  return {
    ...c,
    stages: { ...c.stages, [stage]: { ...rec, photos } },
    updatedAt: new Date().toISOString(),
  };
}

export function setStageNotes(c: ServiceFlowCase, stage: FlowStage, notes: string): ServiceFlowCase {
  const rec =
    c.stages[stage] ||
    ({ stage, photos: [], notes: '', startedAt: new Date().toISOString() } as StageRecord);
  return {
    ...c,
    stages: { ...c.stages, [stage]: { ...rec, notes } },
    updatedAt: new Date().toISOString(),
  };
}

/** Tenta avançar; retorna erro se padrão fotográfico não cumprido. */
export function tryAdvance(
  c: ServiceFlowCase,
  extra?: { diagnosisSnapshot?: Record<string, unknown>; budgetTotal?: number }
): { ok: true; case: ServiceFlowCase } | { ok: false; message: string; missing: PhotoSlotDef[] } {
  const stage = c.currentStage;
  if (stage === 'finalizado') {
    return { ok: false, message: 'OS já finalizada.', missing: [] };
  }

  const rec = c.stages[stage] || { stage, photos: [], notes: '' };
  const validation = validateStagePhotos(stage, rec.photos || []);
  if (!validation.ok) {
    return { ok: false, message: validation.message, missing: validation.missing };
  }

  // Regras extras entre etapas
  if (stage === 'diagnostico' && !c.diagnosisSnapshot && !extra?.diagnosisSnapshot) {
    return {
      ok: false,
      message:
        'Vincule um laudo OficIA (rode o diagnóstico com IA) antes de avançar para o serviço.',
      missing: [],
    };
  }

  const nxt = nextStage(stage);
  if (!nxt) {
    return { ok: false, message: 'Não há próxima etapa.', missing: [] };
  }

  const now = new Date().toISOString();
  const completed: StageRecord = {
    ...rec,
    completedAt: now,
    photos: rec.photos || [],
    notes: rec.notes || '',
  };

  let nextRec = c.stages[nxt];
  if (!nextRec && nxt !== 'finalizado') {
    nextRec = { stage: nxt, startedAt: now, photos: [], notes: '' };
  }

  const updated: ServiceFlowCase = {
    ...c,
    currentStage: nxt,
    stages: {
      ...c.stages,
      [stage]: completed,
      ...(nxt !== 'finalizado' && nextRec ? { [nxt]: nextRec } : {}),
    },
    diagnosisSnapshot: extra?.diagnosisSnapshot ?? c.diagnosisSnapshot,
    budgetTotal: extra?.budgetTotal ?? c.budgetTotal,
    updatedAt: now,
  };

  return { ok: true, case: updated };
}

export function evidenceManifest(c: ServiceFlowCase) {
  const rows: Array<{
    stage: string;
    slotId: string;
    label: string;
    required: boolean;
    hasPhoto: boolean;
    capturedAt?: string;
  }> = [];
  for (const st of STAGE_ORDER) {
    if (st === 'finalizado') continue;
    const slots = getAllSlots(st);
    const photos = c.stages[st]?.photos || [];
    for (const s of slots) {
      const p = photos.find((x) => x.slotId === s.id);
      rows.push({
        stage: STAGE_LABELS[st],
        slotId: s.id,
        label: s.label,
        required: s.required,
        hasPhoto: Boolean(p?.dataUrl),
        capturedAt: p?.capturedAt,
      });
    }
  }
  return rows;
}

const STORAGE_KEY = 'heniza_service_flow_v1';

export function loadCases(): ServiceFlowCase[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCase(c: ServiceFlowCase) {
  const all = loadCases().filter((x) => x.id !== c.id);
  all.unshift(c);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all.slice(0, 30)));
}

export function exportCasePayload(c: ServiceFlowCase) {
  return {
    ...c,
    evidenceManifest: evidenceManifest(c),
    // não reexporta dataUrls enormes no JSON de integração — só flags
    stagesLight: Object.fromEntries(
      Object.entries(c.stages).map(([k, v]) => [
        k,
        {
          stage: v?.stage,
          startedAt: v?.startedAt,
          completedAt: v?.completedAt,
          notes: v?.notes,
          photoCount: v?.photos?.length || 0,
          photoSlots: (v?.photos || []).map((p) => p.slotId),
        },
      ])
    ),
  };
}
