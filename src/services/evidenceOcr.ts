/**
 * OCR de evidências — placa, odômetro, DTC (API online Gemini).
 */
import { authHeaders } from './onlineSession';

export type EvidenceOcrResult = {
  plate?: string | null;
  odometerKm?: number | null;
  dtcCodes?: string[];
  rawText?: string;
  confidence?: number;
  notes?: string;
  mode?: string;
};

/** Heurística offline rápida (sem modelo). */
export function localOcrHeuristics(slotId: string, _dataUrl: string): EvidenceOcrResult {
  return {
    plate: null,
    odometerKm: null,
    dtcCodes: [],
    confidence: 0,
    notes: `OCR online pendente (slot ${slotId})`,
    mode: 'pending',
  };
}

export async function runEvidenceOcr(
  dataUrl: string,
  slotId: string
): Promise<EvidenceOcrResult> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return localOcrHeuristics(slotId, dataUrl);
  }

  try {
    const res = await fetch('/api/ocr', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ image: dataUrl, slotId }),
    });
    const json = await res.json();
    if (json?.ok && json?.data) {
      return { ...json.data, mode: json.mode || 'gemini' };
    }
    return localOcrHeuristics(slotId, dataUrl);
  } catch {
    return localOcrHeuristics(slotId, dataUrl);
  }
}

/** Valida se OCR bate com o padrão esperado do slot. */
export function ocrMatchesSlot(
  slotId: string,
  ocr: EvidenceOcrResult
): { ok: boolean; message: string } {
  const conf = ocr.confidence ?? 0;

  if (/placa/i.test(slotId)) {
    if (ocr.plate && ocr.plate.length >= 6) {
      return { ok: true, message: `Placa lida: ${ocr.plate}` };
    }
    return {
      ok: conf < 0.35,
      message: 'Não leu placa com confiança — confira o enquadramento.',
    };
  }

  if (/odometro|odômetro|painel_km|painel/i.test(slotId)) {
    if (ocr.odometerKm != null && ocr.odometerKm > 0) {
      return { ok: true, message: `Odômetro lido: ${ocr.odometerKm} km` };
    }
    return {
      ok: false,
      message: 'Km não legível — refaça close do painel sem reflexo.',
    };
  }

  if (/scanner/i.test(slotId)) {
    if (ocr.dtcCodes && ocr.dtcCodes.length > 0) {
      return { ok: true, message: `DTCs: ${ocr.dtcCodes.join(', ')}` };
    }
    return {
      ok: conf > 0.4,
      message: 'Nenhum DTC lido — a tela do scanner está nítida?',
    };
  }

  return { ok: true, message: ocr.notes || 'OCR concluído' };
}
