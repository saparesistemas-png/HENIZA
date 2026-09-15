/**
 * Motor de detecção de falhas por regras — OficIA / HENIZA.
 * Entrada: amostras OBD (PIDs). Saída: FaultEvent[] auditáveis.
 *
 * Camadas:
 *  1) Limiar + histerese temporal
 *  2) EWMA (tendência)
 *  3) Correlação multi-PID
 *  4) Dicas de checklist para o mecânico / IA
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
  /** contagem de amostras consecutivas acima/abaixo do limiar por regra */
  counters: Record<string, number>;
  /** EWMA por pid */
  ewma: Record<string, number>;
  /** timestamp em que a regra ficou ativa */
  activeSince: Record<string, number>;
  lastEvents: FaultEvent[];
};

const EWMA_ALPHA = 0.25;
/** ~5 amostras a 1 Hz */
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

function buildEvent(
  state: FaultEngineState,
  partial: RuleResult
): FaultEvent {
  return {
    ...partial,
    sinceMs: state.activeSince[partial.id]
      ? Date.now() - state.activeSince[partial.id]
      : 0,
  };
}

/** Avalia amostras atuais; muta state (contadores/EWMA). */
export function evaluateFaults(
  samples: PidInput[],
  state: FaultEngineState = createFaultEngineState(),
  opts?: { holdSamples?: number }
): { events: FaultEvent[]; state: FaultEngineState } {
  const holdN = opts?.holdSamples ?? DEFAULT_HOLD;
  const v = mapById(samples);
  const nowIds = Object.keys(v);
  for (const id of nowIds) updateEwma(state, id, v[id]);

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
  const load = v.load;
  const maf = v.maf;
  const throttle = v.throttle;

  // —— Limiares térmicos ——
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
      'Verificar nível de arrefecimento',
      'Ventoinha e relé',
      'Radiador e bomba d’água',
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
    hints: ['Observar ventoinha', 'Confirmar ECT com termômetro no tubo'],
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
    title: 'Motor não aquace (ECT baixa)',
    message:
      cool != null && rpm != null
        ? `ECT ${cool} °C com RPM ${rpm}`
        : 'ECT baixa em operação',
    pids: ['coolant', 'rpm'],
    values: { coolant: cool, rpm },
    rule: 'coolant < 70 e rpm > 500',
    hints: ['Termostato aberto', 'Sensor ECT', 'Sangria do sistema'],
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
    hints: ['Nível e qualidade do óleo', 'Radiador de óleo', 'Uso severo'],
    active: hold(state, 'OIL_HOT', oil != null && oil >= 130, holdN),
  });

  // —— Elétrica ——
  push({
    id: 'VOLT_LOW',
    severity: 'high',
    title: 'Tensão do módulo baixa',
    message: volt != null ? `${volt} V` : 'Tensão baixa',
    pids: ['voltage'],
    values: { voltage: volt },
    rule: 'voltage < 12.2',
    hints: ['Bateria', 'Alternador / regulador', 'Maus contatos de massa'],
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
    hints: ['Regulador do alternador', 'Risco a módulos eletrônicos'],
    active: hold(state, 'VOLT_HIGH', volt != null && volt > 15.0, holdN),
  });

  // —— Mistura ——
  push({
    id: 'STFT_EXTREME',
    severity: 'medium',
    title: 'STFT fora de faixa',
    message: stft != null ? `STFT ${stft}%` : 'STFT extremo',
    pids: ['stft_b1'],
    values: { stft_b1: stft },
    rule: '|stft_b1| > 15',
    hints: [
      'Vazamento de ar / vácuo',
      'Pressão de combustível',
      'Sensor MAF/MAP',
      'Injetores',
    ],
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
    hints: ['Problema de longa duração na mistura', 'Não só STFT transitório'],
    active: hold(
      state,
      'LTFT_EXTREME',
      ltft != null && Math.abs(ltft) > 20,
      holdN
    ),
  });

  // —— Correlações ——
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
    hints: ['Validar sensores ECT e IAT', 'Posição do IAT / MAF'],
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
    hints: ['MAF sujo/defeituoso', 'Entrada de ar falsa pós-MAF', 'Conector MAF'],
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
    pids: ['rpm', 'throttle', 'load'],
    values: { rpm, throttle, load },
    rule: 'throttle < 5 e (rpm < 550 ou rpm > 1100)',
    hints: [
      'Corpo de borboleta / IAC',
      'Vazamento de vácuo',
      'Sujaçao',
      'Códigos de misfire',
    ],
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

  // —— EWMA: tendência de aquecimento anormal ——
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
    hints: ['Acompanhar antes de atingir superaquecimento', 'Sistema de arrefecimento'],
    active: hold(
      state,
      'ECT_EWMA_HIGH',
      ewmaCool != null && ewmaCool >= 108,
      Math.max(3, holdN - 1)
    ),
  });

  // Ordenar por severidade
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

/** Avaliação sem estado (uma foto dos PIDs) — histerese = 1 amostra. */
export function evaluateFaultsSnapshot(samples: PidInput[]): FaultEvent[] {
  return evaluateFaults(samples, createFaultEngineState(), { holdSamples: 1 }).events;
}

export function formatFaultsForPrompt(events: FaultEvent[]): string {
  if (!events.length) return '';
  const lines = events.map(
    (e) =>
      `- [${e.severity.toUpperCase()}] ${e.id}: ${e.title} — ${e.message} (regra: ${e.rule})`
  );
  return ['EVENTOS DO MOTOR DE REGRAS (faultEngine):', ...lines].join('\n');
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

export function severityLabelPt(s: FaultSeverity): string {
  switch (s) {
    case 'high':
      return 'Alta';
    case 'medium':
      return 'Média';
    case 'low':
      return 'Baixa';
    default:
      return 'Info';
  }
}
