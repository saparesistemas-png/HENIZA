/**
 * Validação de imagens de evidência (fluxo OS).
 * Critérios: formato, tamanho, resolução, aspecto, brilho e nitidez aproximada.
 */

export type ImageValidationLimits = {
  minWidth: number;
  minHeight: number;
  maxWidth: number;
  maxHeight: number;
  maxBytes: number;
  minBytes: number;
  minAspect?: number;
  maxAspect?: number;
  /** 0–255 média de luminância mínima */
  minBrightness: number;
  maxBrightness: number;
  /** Variância Laplacian aproximada (nitidez) */
  minSharpness: number;
};

export type ImageMetrics = {
  width: number;
  height: number;
  aspect: number;
  byteLength: number;
  mime: string;
  brightness: number;
  sharpness: number;
};

export type ImageValidationResult = {
  ok: boolean;
  errors: string[];
  warnings: string[];
  metrics?: ImageMetrics;
};

/** Limites padrão oficina / locadora (foto de evidência). */
export const DEFAULT_IMAGE_LIMITS: ImageValidationLimits = {
  minWidth: 640,
  minHeight: 480,
  maxWidth: 6000,
  maxHeight: 6000,
  maxBytes: 4_500_000,
  minBytes: 8_000,
  minAspect: 0.4,
  maxAspect: 2.8,
  minBrightness: 28,
  maxBrightness: 245,
  minSharpness: 18,
};

/** Slots de placa / odômetro: mais exigentes em nitidez e resolução. */
export const STRICT_PLATE_LIMITS: ImageValidationLimits = {
  ...DEFAULT_IMAGE_LIMITS,
  minWidth: 800,
  minHeight: 480,
  minSharpness: 28,
  minBrightness: 35,
};

export function limitsForSlot(slotId: string): ImageValidationLimits {
  if (/placa|odometro|odômetro|scanner|painel/i.test(slotId)) {
    return STRICT_PLATE_LIMITS;
  }
  return DEFAULT_IMAGE_LIMITS;
}

function dataUrlByteLength(dataUrl: string): number {
  const i = dataUrl.indexOf(',');
  if (i < 0) return dataUrl.length;
  const b64 = dataUrl.slice(i + 1);
  // aproximação: 3/4 do base64
  return Math.floor((b64.length * 3) / 4);
}

function parseMime(dataUrl: string): string {
  const m = dataUrl.match(/^data:([^;,]+)/);
  return m ? m[1].toLowerCase() : '';
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Falha ao decodificar a imagem.'));
    img.src = dataUrl;
  });
}

/** Amostra pixels para brilho médio e nitidez (variância de diferenças). */
function analyzePixels(img: HTMLImageElement): { brightness: number; sharpness: number } {
  const maxSide = 160;
  const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
  const w = Math.max(16, Math.round(img.width * scale));
  const h = Math.max(16, Math.round(img.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return { brightness: 128, sharpness: 0 };
  ctx.drawImage(img, 0, 0, w, h);
  let data: ImageData;
  try {
    data = ctx.getImageData(0, 0, w, h);
  } catch {
    return { brightness: 128, sharpness: 50 };
  }
  const px = data.data;
  let sum = 0;
  let count = 0;
  const gray = new Float32Array(w * h);
  for (let i = 0, p = 0; i < px.length; i += 4, p++) {
    const g = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
    gray[p] = g;
    sum += g;
    count++;
  }
  const brightness = count ? sum / count : 0;

  // Laplacian-ish: diferença com vizinhos
  let sharpSum = 0;
  let sharpN = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const lap =
        Math.abs(
          4 * gray[i] -
            gray[i - 1] -
            gray[i + 1] -
            gray[i - w] -
            gray[i + w]
        );
      sharpSum += lap;
      sharpN++;
    }
  }
  const sharpness = sharpN ? sharpSum / sharpN : 0;
  return { brightness, sharpness };
}

export async function validateImageDataUrl(
  dataUrl: string,
  limits: ImageValidationLimits = DEFAULT_IMAGE_LIMITS
): Promise<ImageValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!dataUrl || typeof dataUrl !== 'string') {
    return { ok: false, errors: ['Imagem ausente.'], warnings: [] };
  }
  if (!dataUrl.startsWith('data:image/')) {
    return {
      ok: false,
      errors: ['Formato inválido: use foto JPEG ou PNG (data:image).'],
      warnings: [],
    };
  }

  const mime = parseMime(dataUrl);
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
  if (mime && !allowed.some((a) => mime.startsWith(a.split('/')[0]) && mime.includes(a.split('/')[1]?.replace('jpg', 'jpeg') || '') || allowed.includes(mime))) {
    // relax: accept any image/*
    if (!mime.startsWith('image/')) {
      errors.push(`MIME não suportado: ${mime}`);
    }
  }
  if (mime === 'image/gif') {
    errors.push('GIF não é aceito como evidência. Use JPEG ou PNG.');
  }

  const byteLength = dataUrlByteLength(dataUrl);
  if (byteLength < limits.minBytes) {
    errors.push(`Arquivo muito pequeno (${Math.round(byteLength / 1024)} KB). Tire outra foto.`);
  }
  if (byteLength > limits.maxBytes) {
    errors.push(
      `Arquivo muito grande (${Math.round(byteLength / 1024)} KB). Comprima ou reduza a resolução.`
    );
  }

  let img: HTMLImageElement;
  try {
    img = await loadImage(dataUrl);
  } catch {
    return { ok: false, errors: ['Não foi possível ler a imagem.'], warnings: [] };
  }

  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;
  if (width < limits.minWidth || height < limits.minHeight) {
    errors.push(
      `Resolução baixa (${width}×${height}). Mínimo ${limits.minWidth}×${limits.minHeight}px.`
    );
  }
  if (width > limits.maxWidth || height > limits.maxHeight) {
    warnings.push(`Resolução muito alta (${width}×${height}); será redimensionada no envio.`);
  }

  const aspect = height ? width / height : 1;
  if (limits.minAspect != null && aspect < limits.minAspect) {
    errors.push(`Enquadramento inválido (muito vertical). Aspecto ${aspect.toFixed(2)}.`);
  }
  if (limits.maxAspect != null && aspect > limits.maxAspect) {
    errors.push(`Enquadramento inválido (muito horizontal). Aspecto ${aspect.toFixed(2)}.`);
  }

  const { brightness, sharpness } = analyzePixels(img);
  if (brightness < limits.minBrightness) {
    errors.push(
      `Foto escura demais (brilho ${brightness.toFixed(0)}). Melhore a iluminação ou use flash.`
    );
  }
  if (brightness > limits.maxBrightness) {
    errors.push(
      `Foto estourada (brilho ${brightness.toFixed(0)}). Evite sol direto / flash no painel.`
    );
  }
  if (sharpness < limits.minSharpness) {
    errors.push(
      `Imagem borrosa ou sem foco (nitidez ${sharpness.toFixed(0)}). Refaça com câmera firme.`
    );
  }

  const metrics: ImageMetrics = {
    width,
    height,
    aspect,
    byteLength,
    mime,
    brightness,
    sharpness,
  };

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    metrics,
  };
}

/** Valida File antes de converter. */
export function validateImageFile(file: File): ImageValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!file.type.startsWith('image/')) {
    errors.push('Arquivo não é imagem.');
  }
  if (file.type === 'image/gif') {
    errors.push('GIF não permitido.');
  }
  if (file.size < 5_000) {
    errors.push('Arquivo muito pequeno.');
  }
  if (file.size > 12_000_000) {
    errors.push('Arquivo > 12 MB. Reduza antes de enviar.');
  }
  return { ok: errors.length === 0, errors, warnings };
}
