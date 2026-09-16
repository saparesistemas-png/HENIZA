/**
 * Backoff exponencial com full jitter (AWS-style).
 * delay = random(0, min(cap, base * 2^attempt))
 *
 * Também interpreta Retry-After (segundos ou HTTP-date).
 */

export type BackoffOptions = {
  /** Delay base em ms (default 1000) */
  baseMs?: number;
  /** Teto máximo em ms (default 2h) */
  capMs?: number;
  /** Multiplicador (default 2) */
  factor?: number;
  /** Incluir jitter 0..delay (default true) */
  jitter?: boolean;
};

export const DEFAULT_BACKOFF: Required<BackoffOptions> = {
  baseMs: 1_000,
  capMs: 2 * 60 * 60 * 1000, // 2 horas
  factor: 2,
  jitter: true,
};

/**
 * Calcula o próximo delay em ms para a tentativa `attempt` (1 = primeira falha).
 */
export function exponentialBackoffMs(
  attempt: number,
  opts: BackoffOptions = {}
): number {
  const { baseMs, capMs, factor, jitter } = { ...DEFAULT_BACKOFF, ...opts };
  const n = Math.max(0, Math.floor(attempt));
  // base * factor^n, com proteção contra overflow
  const exp = Math.min(n, 30);
  const raw = Math.min(capMs, baseMs * Math.pow(factor, exp));
  if (!jitter) return Math.floor(raw);
  // full jitter: uniforme em [0, raw]
  return Math.floor(Math.random() * (raw + 1));
}

/**
 * Próximo timestamp absoluto (Date.now() + delay).
 */
export function nextRetryAt(
  attempt: number,
  opts?: BackoffOptions,
  now = Date.now()
): number {
  return now + exponentialBackoffMs(attempt, opts);
}

/**
 * Parse de header Retry-After.
 * @returns ms a esperar a partir de agora, ou null se inválido
 */
export function parseRetryAfter(
  header: string | null | undefined,
  now = Date.now()
): number | null {
  if (!header) return null;
  const trimmed = header.trim();
  // segundos inteiros
  if (/^\d+$/.test(trimmed)) {
    const sec = parseInt(trimmed, 10);
    if (!Number.isFinite(sec) || sec < 0) return null;
    return Math.min(DEFAULT_BACKOFF.capMs, sec * 1000);
  }
  // HTTP-date
  const when = Date.parse(trimmed);
  if (Number.isNaN(when)) return null;
  const delta = when - now;
  if (delta <= 0) return 0;
  return Math.min(DEFAULT_BACKOFF.capMs, delta);
}

/**
 * Combina backoff local com Retry-After do servidor (usa o maior).
 */
export function resolveRetryDelayMs(
  attempt: number,
  retryAfterHeader?: string | null,
  opts?: BackoffOptions
): number {
  const local = exponentialBackoffMs(attempt, opts);
  const fromServer = parseRetryAfter(retryAfterHeader);
  if (fromServer == null) return local;
  return Math.max(local, fromServer);
}

/** Tabela legível para debug / UI */
export function backoffSchedulePreview(
  maxAttempts = 8,
  opts?: BackoffOptions
): Array<{ attempt: number; minMs: number; maxMs: number; label: string }> {
  const { baseMs, capMs, factor } = { ...DEFAULT_BACKOFF, ...opts };
  const rows = [];
  for (let a = 1; a <= maxAttempts; a++) {
    const maxMs = Math.min(capMs, baseMs * Math.pow(factor, a));
    rows.push({
      attempt: a,
      minMs: 0,
      maxMs: Math.floor(maxMs),
      label: formatDuration(maxMs),
    });
  }
  return rows;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60_000) return `${Math.round(ms / 1000)}s`;
  if (ms < 3600_000) return `${Math.round(ms / 60_000)}min`;
  return `${(ms / 3600_000).toFixed(1)}h`;
}
