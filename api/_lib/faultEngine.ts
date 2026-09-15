/**
 * Motor de regras (espelho servidor) — limiar, histerese, correlação, EWMA.
 * Mantido alinhado a src/services/faultEngine.ts
 */

export type FaultSeverity = 'high' | 'medium' | 'low' | 'info';

export type FaultEvent = {
  id: string;
  severity: FaultSeverity;
  title: string;
  message: string;
  pids: string[];
  values: Record<string, number | null>;
  rule: string;
  hints: string[];
  sinceMs: number;
  active: boolean;
};

export type PidInput = {
  id: string;
  value: number | null;
  unit?: string;
  ok?: boolean;
  at?: number;
};

export type FaultEngineState = {
  counters: Record<string, number>;
  ewma: Record<string, number>;
  activeSince: Record<string, number>;
  lastEvents: FaultEvent[];
};

const EWMA_ALPHA = 0.25;
const DEFAULT_HOLD = 5;

export function createFaultEngineState(): FaultEngineState {
  return { counters: {}, ewma: {}, activeSince: {}, lastEvents: [] };
}

function num(v: number | null | undefined): number | null {
  if (v == null || Number.isNaN(Number(v))) return null;
  return Number(v);
}

function mapById(samples: PidInput[]): Record<string, number | null> {
  const out: Record<string, number | null> = {};
  for (const s of samples) {
    if (!s.id) continue;
    out[s.id] = s.ok === false ? null : num(s.value);
  }
  return out;
}

function updateEwma(state: FaultEngineState, id: string, value: number | null) {
  if (value == null) return;
  const prev = state.ewma[id];
  state.ewma[id] =
    prev == null ? value : EWMA_ALPHA * value + (1 - EWMA_ALPHA) * prev;
}

function hold(
  state: FaultEngineState,
  ruleId: string,
  condition: boolean,
  need = DEFAULT_HOLD
): boolean {
  const c = (state.counters[ruleId] || 0) + (condition ? 1 : -2);
  state.counters[ruleId] = Math.max(0, Math.min(need + 2, c));
  const active = state.counters[ruleId] >= need;
  if (active && !state.activeSince[ruleId]) state.activeSince[ruleId] = Date.now();
  if (!active) delete state.activeSince[ruleId];
  return active;
}

type RuleResult = Omit<FaultEvent, 'sinceMs' | 'active'> & { active: boolean };

function buildEvent(state: FaultEngineState, partial: RuleResult): FaultEvent {
  return {
    ...partial,
    sinceMs: state.activeSince[partial.id]
      ? Date.now() - state.activeSince[partial.id]
      : 0,
  };
}

export function evaluateFaults(
  samples: PidInput[],
  state: FaultEngineState = createFaultEngineState(),
  opts?: { holdSamples?: number }
): { events: FaultEvent[]; state: FaultEngineState } {
  const holdN = opts?.holdSamples ?? DEFAULT_HOLD;
  const v = mapById(samples);
  for (const id of Object.keys(v)) updateEwma(state, id, v[id]);

  const events: FaultEvent[] = [];
  const push = (r: RuleResult) => {
    if (r.active) events.push(buildEvent(state, r));
  };

  const cool = v.coolant;
  const iat = v.iat;
  const oil = v.oilTemp;
  const rpm = v.rpm;
  const stft = v.stft_b1;
  const ltft = v.ltft_b1;
  const volt = v.voltage;
  const maf = v.maf;
  const throttle = v.throttle;

  push({
    id: 'ECT_OVERHEAT',
    severity: 'high',
    title: 'ECT elevada',
    message: cool != null ? `Arrefecimento em ${cool} °C` : 'ECT elevada',
    pids: ['coolant'],
    values: { coolant: cool },
    rule: 'coolant >= 110 por N amostras',
    hints: [
      'Não abrir tampa quente',
      'Nível de arrefecimento',
      'Ventoinha e relé',
      'Radiador e bomba',
      'Termostato',
    ],
    active: hold(state, 'ECT_OVERHEAT', cool != null && cool >= 110, holdN),
  });

  push({
    id: 'ECT_HOT_WARN',
    severity: 'medium',
    title: 'ECT em zona de atenção',
    message: cool != null ? `ECT ${cool} °C (atenção)` : 'ECT alta',
    pids: ['coolant'],
    values: { coolant: cool },
    rule: 'coolant >= 105 e < 110',
    hints: ['Observar ventoinha', 'Confirmar ECT com termômetro'],
    active: hold(
      state,
      'ECT_HOT_WARN',
      cool != null && cool >= 105 && cool < 110,
      holdN
    ),
  });

  push({
    id: 'ECT_COLD_RUNNING',
    severity: 'medium',
    title: 'Motor não aquece (ECT baixa)',
    message:
      cool != null && rpm != null
        ? `ECT ${cool} °C com RPM ${rpm}`
        : 'ECT baixa em operação',
    pids: ['coolant', 'rpm'],
    values: { coolant: cool, rpm },
    rule: 'coolant < 70 e rpm > 500',
    hints: ['Termostato aberto', 'Sensor ECT', 'Sangria'],
    active: hold(
      state,
      'ECT_COLD_RUNNING',
      cool != null && rpm != null && cool < 70 && rpm > 500,
      holdN + 2
    ),
  });

  push({
    id: 'OIL_HOT',
    severity: 'high',
    title: 'Temperatura do óleo elevada',
    message: oil != null ? `Óleo em ${oil} °C` : 'Óleo quente',
    pids: ['oilTemp'],
    values: { oilTemp: oil },
    rule: 'oilTemp >= 130',
    hints: ['Nível de óleo', 'Radiador de óleo'],
    active: hold(state, 'OIL_HOT', oil != null && oil >= 130, holdN),
  });

  push({
    id: 'VOLT_LOW',
    severity: 'high',
    title: 'Tensão do módulo baixa',
    message: volt != null ? `${volt} V` : 'Tensão baixa',
    pids: ['voltage'],
    values: { voltage: volt },
    rule: 'voltage < 12.2',
    hints: ['Bateria', 'Alternador', 'Massas'],
    active: hold(state, 'VOLT_LOW', volt != null && volt < 12.2, holdN),
  });

  push({
    id: 'VOLT_HIGH',
    severity: 'medium',
    title: 'Tensão do módulo alta',
    message: volt != null ? `${volt} V` : 'Tensão alta',
    pids: ['voltage'],
    values: { voltage: volt },
    rule: 'voltage > 15.0',
    hints: ['Regulador do alternador'],
    active: hold(state, 'VOLT_HIGH', volt != null && volt > 15.0, holdN),
  });

  push({
    id: 'STFT_EXTREME',
    severity: 'medium',
    title: 'STFT fora de faixa',
    message: stft != null ? `STFT ${stft}%` : 'STFT extremo',
    pids: ['stft_b1'],
    values: { stft_b1: stft },
    rule: '|stft_b1| > 15',
    hints: ['Vácuo', 'Pressão combustível', 'MAF/MAP', 'Injetores'],
    active: hold(
      state,
      'STFT_EXTREME',
      stft != null && Math.abs(stft) > 15,
      holdN
    ),
  });

  push({
    id: 'LTFT_EXTREME',
    severity: 'medium',
    title: 'LTFT adaptativo extremo',
    message: ltft != null ? `LTFT ${ltft}%` : 'LTFT extremo',
    pids: ['ltft_b1'],
    values: { ltft_b1: ltft },
    rule: '|ltft_b1| > 20',
    hints: ['Desvio de mistura de longa duração'],
    active: hold(
      state,
      'LTFT_EXTREME',
      ltft != null && Math.abs(ltft) > 20,
      holdN
    ),
  });

  push({
    id: 'ECT_IAT_SPREAD',
    severity: 'low',
    title: 'Grande diferença ECT × IAT em idle',
    message:
      cool != null && iat != null
        ? `ECT ${cool} °C vs IAT ${iat} °C`
        : 'Spread térmico',
    pids: ['coolant', 'iat', 'rpm'],
    values: { coolant: cool, iat, rpm },
    rule: '|ECT - IAT| > 40 e rpm < 1000',
    hints: ['Validar ECT e IAT'],
    active: hold(
      state,
      'ECT_IAT_SPREAD',
      cool != null &&
        iat != null &&
        rpm != null &&
        Math.abs(cool - iat) > 40 &&
        rpm < 1000,
      holdN + 3
    ),
  });

  push({
    id: 'MAF_RPM_MISMATCH',
    severity: 'medium',
    title: 'MAF inconsistente com RPM',
    message:
      maf != null && rpm != null
        ? `MAF ${maf} g/s @ ${rpm} rpm`
        : 'MAF vs RPM',
    pids: ['maf', 'rpm'],
    values: { maf, rpm },
    rule: 'rpm > 1500 e maf < 2',
    hints: ['MAF sujo', 'Ar falso pós-MAF'],
    active: hold(
      state,
      'MAF_RPM_MISMATCH',
      maf != null && rpm != null && rpm > 1500 && maf < 2,
      holdN
    ),
  });

  push({
    id: 'IDLE_UNSTABLE',
    severity: 'low',
    title: 'Marcha lenta instável (proxy)',
    message:
      rpm != null && throttle != null
        ? `RPM ${rpm} com borboleta ${throttle}%`
        : 'Idle instável',
    pids: ['rpm', 'throttle'],
    values: { rpm, throttle },
    rule: 'throttle < 5 e (rpm < 550 ou rpm > 1100)',
    hints: ['Borboleta / IAC', 'Vácuo', 'Misfire'],
    active: hold(
      state,
      'IDLE_UNSTABLE',
      throttle != null &&
        rpm != null &&
        throttle < 5 &&
        (rpm < 550 || rpm > 1100),
      holdN + 2
    ),
  });

  const ewmaCool = state.ewma.coolant;
  push({
    id: 'ECT_EWMA_HIGH',
    severity: 'medium',
    title: 'Tendência de ECT alta (EWMA)',
    message:
      ewmaCool != null
        ? `EWMA ECT ≈ ${ewmaCool.toFixed(1)} °C`
        : 'Tendência térmica',
    pids: ['coolant'],
    values: { coolant: cool, ewma_coolant: ewmaCool ?? null },
    rule: 'EWMA(coolant) >= 108',
    hints: ['Arrefecimento — tendência'],
    active: hold(
      state,
      'ECT_EWMA_HIGH',
      ewmaCool != null && ewmaCool >= 108,
      Math.max(3, holdN - 1)
    ),
  });

  const rank: Record<FaultSeverity, number> = {
    high: 0,
    medium: 1,
    low: 2,
    info: 3,
  };
  events.sort((a, b) => rank[a.severity] - rank[b.severity]);
  state.lastEvents = events;
  return { events, state };
}

export function evaluateFaultsSnapshot(samples: PidInput[]): FaultEvent[] {
  return evaluateFaults(samples, createFaultEngineState(), { holdSamples: 1 }).events;
}

export function formatFaultsForPrompt(events: FaultEvent[]): string {
  if (!events.length) return '';
  return [
    'EVENTOS DO MOTOR DE REGRAS (faultEngine):',
    ...events.map(
      (e) =>
        `- [${e.severity.toUpperCase()}] ${e.id}: ${e.title} — ${e.message} (regra: ${e.rule})`
    ),
  ].join('\n');
}

export function faultHints(events: FaultEvent[]): string[] {
  const out: string[] = [];
  for (const e of events) {
    for (const h of e.hints) {
      if (!out.includes(h)) out.push(h);
    }
  }
  return out.slice(0, 12);
}
