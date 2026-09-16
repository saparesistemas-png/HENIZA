/**
 * Circuit breaker para APIs de sync (evita martelar servidor em queda).
 *
 * Estados:
 * - CLOSED: operação normal
 * - OPEN: rejeita chamadas até openUntil
 * - HALF_OPEN: permite até halfOpenMaxProbes tentativas de prova
 */

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export type CircuitBreakerOptions = {
  /** Falhas consecutivas para abrir (default 5) */
  failureThreshold?: number;
  /** Sucessos em HALF_OPEN para fechar (default 2) */
  successThreshold?: number;
  /** Tempo em OPEN antes de HALF_OPEN (default 30s) */
  openMs?: number;
  /** Probes permitidos em HALF_OPEN (default 2) */
  halfOpenMaxProbes?: number;
  /** Nome para logs / multi-breaker */
  name?: string;
};

export type CircuitSnapshot = {
  name: string;
  state: CircuitState;
  failures: number;
  successes: number;
  openUntil: number;
  halfOpenProbes: number;
  lastError?: string;
  lastStateChange: number;
};

type Internal = {
  state: CircuitState;
  failures: number;
  successes: number;
  openUntil: number;
  halfOpenProbes: number;
  lastError?: string;
  lastStateChange: number;
};

const DEFAULTS: Required<CircuitBreakerOptions> = {
  failureThreshold: 5,
  successThreshold: 2,
  openMs: 30_000,
  halfOpenMaxProbes: 2,
  name: 'default',
};

export class CircuitBreaker {
  private opts: Required<CircuitBreakerOptions>;
  private s: Internal;

  constructor(opts: CircuitBreakerOptions = {}) {
    this.opts = { ...DEFAULTS, ...opts };
    this.s = {
      state: 'CLOSED',
      failures: 0,
      successes: 0,
      openUntil: 0,
      halfOpenProbes: 0,
      lastStateChange: Date.now(),
    };
  }

  get name(): string {
    return this.opts.name;
  }

  snapshot(): CircuitSnapshot {
    this.maybeTransitionToHalfOpen();
    return {
      name: this.opts.name,
      state: this.s.state,
      failures: this.s.failures,
      successes: this.s.successes,
      openUntil: this.s.openUntil,
      halfOpenProbes: this.s.halfOpenProbes,
      lastError: this.s.lastError,
      lastStateChange: this.s.lastStateChange,
    };
  }

  /** true se a chamada pode seguir para a rede */
  canRequest(): boolean {
    this.maybeTransitionToHalfOpen();
    if (this.s.state === 'CLOSED') return true;
    if (this.s.state === 'OPEN') return false;
    // HALF_OPEN
    if (this.s.halfOpenProbes < this.opts.halfOpenMaxProbes) {
      this.s.halfOpenProbes += 1;
      return true;
    }
    return false;
  }

  recordSuccess(): void {
    this.maybeTransitionToHalfOpen();
    if (this.s.state === 'HALF_OPEN') {
      this.s.successes += 1;
      if (this.s.successes >= this.opts.successThreshold) {
        this.toClosed();
      }
      return;
    }
    // CLOSED: zera falhas consecutivas
    this.s.failures = 0;
    this.s.successes = 0;
    this.s.lastError = undefined;
  }

  recordFailure(error?: string): void {
    this.maybeTransitionToHalfOpen();
    this.s.lastError = error?.slice(0, 300);
    if (this.s.state === 'HALF_OPEN') {
      this.toOpen();
      return;
    }
    this.s.failures += 1;
    this.s.successes = 0;
    if (this.s.failures >= this.opts.failureThreshold) {
      this.toOpen();
    }
  }

  /** Força OPEN (ex.: 503 em massa) */
  trip(error?: string): void {
    this.s.lastError = error?.slice(0, 300);
    this.toOpen();
  }

  /** Força CLOSED (teste / admin) */
  reset(): void {
    this.toClosed();
  }

  private maybeTransitionToHalfOpen(): void {
    if (this.s.state === 'OPEN' && Date.now() >= this.s.openUntil) {
      this.s.state = 'HALF_OPEN';
      this.s.halfOpenProbes = 0;
      this.s.successes = 0;
      this.s.lastStateChange = Date.now();
    }
  }

  private toOpen(): void {
    this.s.state = 'OPEN';
    this.s.openUntil = Date.now() + this.opts.openMs;
    this.s.halfOpenProbes = 0;
    this.s.successes = 0;
    this.s.lastStateChange = Date.now();
  }

  private toClosed(): void {
    this.s.state = 'CLOSED';
    this.s.failures = 0;
    this.s.successes = 0;
    this.s.halfOpenProbes = 0;
    this.s.openUntil = 0;
    this.s.lastError = undefined;
    this.s.lastStateChange = Date.now();
  }
}

/** Breakers por endpoint / domínio */
const registry = new Map<string, CircuitBreaker>();

export function getCircuit(name: string, opts?: CircuitBreakerOptions): CircuitBreaker {
  let b = registry.get(name);
  if (!b) {
    b = new CircuitBreaker({ ...opts, name });
    registry.set(name, b);
  }
  return b;
}

export const syncCircuit = getCircuit('api-sync', {
  failureThreshold: 5,
  successThreshold: 2,
  openMs: 30_000,
  halfOpenMaxProbes: 2,
});

export const diagnoseCircuit = getCircuit('api-diagnose', {
  failureThreshold: 5,
  successThreshold: 2,
  openMs: 45_000,
  halfOpenMaxProbes: 1,
});
