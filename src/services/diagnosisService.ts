import { offlineStore } from '../store/offlineStore';

export interface DiagnosisRequest {
  description: string;
  mode: string;
  image?: string | null;
  video?: string | null;
  audio?: string | null;
  lang: string;
  plate: string;
  chassis: string;
  make: string;
  model: string;
  propulsionType: string;
  isEvAlternative: boolean;
}

export interface DiagnosisData {
  codeType: string;
  codeTypeLabel: string;
  originBadge: string;
  originExplanation: string;
  problemName: string;
  supplierCategory: string;
  severity: string;
  source: string;
  diagnosticNotes: string;
  resetProcedure: string;
  correctiveChecklist: string[];
  preventiveChecklist: string[];
  budgetItems: Array<{
    item: string;
    category: string;
    estimatedCost: number;
  }>;
  suggestedBestPractices: string[];
  [key: string]: unknown;
}

export interface DiagnosisResult {
  ok: boolean;
  data: DiagnosisData | null;
  offline: boolean;
  error?: string;
  source?: 'gemini' | 'fallback' | 'local-offline';
}

function normalizeData(raw: any): DiagnosisData {
  return {
    codeType: raw.codeType || 'SCANNER_OBD2',
    codeTypeLabel: raw.codeTypeLabel || 'Diagnóstico Técnico',
    originBadge: raw.originBadge || 'LAUDO TÉCNICO',
    originExplanation: raw.originExplanation || '',
    problemName: raw.problemName || 'Diagnóstico não classificado',
    supplierCategory: raw.supplierCategory || 'Geral',
    severity: raw.severity || 'Média',
    source: raw.source || 'OficIA',
    diagnosticNotes: raw.diagnosticNotes || '',
    resetProcedure: raw.resetProcedure || '',
    correctiveChecklist: Array.isArray(raw.correctiveChecklist) ? raw.correctiveChecklist : [],
    preventiveChecklist: Array.isArray(raw.preventiveChecklist) ? raw.preventiveChecklist : [],
    budgetItems: Array.isArray(raw.budgetItems) ? raw.budgetItems : [],
    suggestedBestPractices: Array.isArray(raw.suggestedBestPractices)
      ? raw.suggestedBestPractices
      : [],
  };
}

function buildLocalFallback(request: DiagnosisRequest): DiagnosisData {
  const isEv =
    request.isEvAlternative ||
    /byd|dolphin|bateria|isolamento|gwm|ora|el[eé]tric/i.test(
      `${request.description} ${request.make} ${request.model}`
    );

  if (isEv) {
    return {
      codeType: 'DIAGNOSTICO_EV_ALTA_TENSAO',
      codeTypeLabel: 'Protocolo Alternativo EV (modo offline)',
      originBadge: 'DIAGNÓSTICO ALTERNATIVO VEÍCULO ELÉTRICO (EV/DoIP)',
      originExplanation:
        'Modo offline ativo. Laudo preliminar; será reprocessado ao recuperar conexão.',
      problemName: `${request.make} ${request.model} — Diagnóstico EV (offline)`,
      supplierCategory: 'Sistema de Bateria de Tração (BMS) & Alta Tensão',
      severity: 'Alta',
      source: 'Base local OficIA (offline)',
      diagnosticNotes:
        '1. Verificar menu de engenharia.\n2. Medir isolamento (> 500 kΩ @ 500V DC).\n3. HVIL e 12V auxiliar.',
      resetProcedure:
        '1. Desconectar negativo 12V.\n2. Remover MSD com EPI 1000V.\n3. Aguardar 10 min.\n4. Reconectar.',
      correctiveChecklist: [
        'Medir isolamento HV',
        'Verificar desbalanceamento de células',
        'Testar HVIL',
        'Validar bateria 12V',
      ],
      preventiveChecklist: ['Carga AC semanal', 'Inspecionar cabos HV'],
      budgetItems: [
        { item: 'Diagnóstico EV / DoIP', category: 'Mão de Obra', estimatedCost: 450 },
      ],
      suggestedBestPractices: ['Luva isolante 1000V Classe 0 (NR-10).'],
    };
  }

  return {
    codeType: 'SCANNER_OBD2',
    codeTypeLabel: 'Diagnóstico técnico (modo offline)',
    originBadge: 'LAUDO TÉCNICO MULTIMODAL — OFFLINE',
    originExplanation: 'Sem conexão. Será reenviado automaticamente ao voltar online.',
    problemName: `${request.make} ${request.model} — ${request.description.slice(0, 60) || 'Análise'}`,
    supplierCategory: 'Powertrain / Elétrica',
    severity: 'Média',
    source: 'Base local OficIA (offline)',
    diagnosticNotes: 'Análise preliminar offline.',
    resetProcedure: 'Aguardar sincronização online.',
    correctiveChecklist: ['Ler códigos OBD2', 'Inspecionar conectores', 'Validar bateria'],
    preventiveChecklist: ['Manutenção preventiva conforme manual'],
    budgetItems: [
      { item: 'Diagnóstico eletrônico', category: 'Mão de Obra', estimatedCost: 180 },
    ],
    suggestedBestPractices: ['Registrar placa, chassi e sintomas com foto/áudio.'],
  };
}

async function callOnlineApi(request: DiagnosisRequest): Promise<DiagnosisResult> {
  try {
    const res = await fetch('/api/diagnose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    const json = await res.json();

    if (json && typeof json.ok === 'boolean') {
      if (json.ok === true && json.data) {
        return {
          ok: true,
          data: normalizeData(json.data),
          offline: false,
          source: json.meta?.source ?? 'gemini',
        };
      }
      return {
        ok: false,
        data: null,
        offline: false,
        error: json.error || 'Falha no diagnóstico.',
      };
    }

    if (json && json.problemName) {
      return {
        ok: true,
        data: normalizeData(json),
        offline: false,
        source: 'fallback',
      };
    }

    return { ok: false, data: null, offline: false, error: 'Resposta inválida do servidor.' };
  } catch (err) {
    console.warn('[diagnosisService] Online failed:', err);
    return { ok: false, data: null, offline: false, error: 'Falha de rede.' };
  }
}

async function runOfflinePath(request: DiagnosisRequest): Promise<DiagnosisResult> {
  const localData = buildLocalFallback(request);
  try {
    await offlineStore.enqueue({
      type: 'diagnosis',
      payload: { ...request, localPreview: localData },
    });
  } catch (err) {
    console.warn('[diagnosisService] enqueue failed:', err);
  }
  return {
    ok: true,
    data: localData,
    offline: true,
    source: 'local-offline',
  };
}

export async function runDiagnosis(
  request: DiagnosisRequest,
  isOffline: boolean
): Promise<DiagnosisResult> {
  if (!isOffline && navigator.onLine) {
    const online = await callOnlineApi(request);
    if (online.ok && online.data) return online;
  }
  return runOfflinePath(request);
}
