export const MAX_IMAGE_CHARS = 8_000_000;
export const MAX_AUDIO_CHARS = 6_000_000;
export const MAX_TEXT_CHARS = 4_000;

export interface DiagnosePayload {
  description?: string;
  mode?: string;
  image?: string;
  audio?: string;
  video?: string;
  lang?: string;
  plate?: string;
  chassis?: string;
  make?: string;
  model?: string;
  propulsionType?: string;
  isEvAlternative?: boolean;
  clientId?: string;
  offlineCreatedAt?: string;
}

export function validateDiagnosePayload(
  body: unknown
): { ok: true; payload: DiagnosePayload } | { ok: false; message: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, message: 'Body inválido.' };
  }

  const b = body as Record<string, unknown>;
  const description = b.description ? String(b.description).trim() : '';
  const image = typeof b.image === 'string' ? b.image : undefined;
  const audio = typeof b.audio === 'string' ? b.audio : undefined;
  const video = typeof b.video === 'string' ? b.video : undefined;
  const chassis = b.chassis ? String(b.chassis).trim() : '';

  const hasContent = Boolean(description || image || audio || video || chassis);
  if (!hasContent) {
    return { ok: false, message: 'Informe descrição, imagem, áudio, vídeo ou chassi.' };
  }
  if (description.length > MAX_TEXT_CHARS) {
    return { ok: false, message: `Descrição excede ${MAX_TEXT_CHARS} caracteres.` };
  }
  if (image && image.length > MAX_IMAGE_CHARS) {
    return { ok: false, message: 'Imagem muito grande.' };
  }
  if (audio && audio.length > MAX_AUDIO_CHARS) {
    return { ok: false, message: 'Áudio muito grande.' };
  }
  if (image && !image.startsWith('data:image') && !image.startsWith('IMAGE_PRESET_')) {
    return { ok: false, message: 'Formato de imagem inválido.' };
  }
  if (audio && !audio.startsWith('data:audio')) {
    return { ok: false, message: 'Formato de áudio inválido.' };
  }

  return {
    ok: true,
    payload: {
      description,
      image,
      audio,
      video,
      chassis,
      plate: b.plate ? String(b.plate).trim() : '',
      make: b.make ? String(b.make).trim() : '',
      model: b.model ? String(b.model).trim() : '',
      mode: b.mode ? String(b.mode) : 'Multimodal',
      lang: b.lang ? String(b.lang) : 'pt',
      propulsionType: b.propulsionType ? String(b.propulsionType) : '',
      isEvAlternative: Boolean(b.isEvAlternative),
      clientId: b.clientId ? String(b.clientId) : undefined,
      offlineCreatedAt: b.offlineCreatedAt ? String(b.offlineCreatedAt) : undefined,
    },
  };
}
