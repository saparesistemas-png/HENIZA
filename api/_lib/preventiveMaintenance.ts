/**
 * Manutenção preventiva — intervalos de referência (oficina BR).
 * Valores genéricos SAE/prática de mercado; sempre validar manual OEM.
 */

export type PreventiveItem = {
  id: string;
  name: string;
  category: 'Motor' | 'Filtros' | 'Freios' | 'Transmissão' | 'Elétrica' | 'Fluidos' | 'Correias' | 'Arrefecimento' | 'Pneus' | 'EV';
  intervalKm?: number;
  intervalMonths?: number;
  notes?: string;
  estimatedCostBrl?: number;
  /** palavras-chave que disparam o item no laudo */
  triggers?: string[];
};

export type PreventivePlan = {
  vehicleLabel: string;
  items: Array<
    PreventiveItem & {
      dueReason: string;
      priority: 'alta' | 'média' | 'rotina';
    }
  >;
  checklist: string[];
  budgetHints: Array<{ item: string; category: string; estimatedCost: number }>;
  disclaimer: string;
};

/** Plano base flex/gasolina (uso urbano Brasil). */
export const BASE_ICE_SCHEDULE: PreventiveItem[] = [
  {
    id: 'oil',
    name: 'Troca de óleo e filtro de óleo',
    category: 'Motor',
    intervalKm: 10000,
    intervalMonths: 12,
    estimatedCostBrl: 280,
    notes: 'Óleo conforme viscosidade OEM; encurtar se uso severo.',
    triggers: ['óleo', 'oleo', 'motor barulh', 'pressão óleo'],
  },
  {
    id: 'air_filter',
    name: 'Filtro de ar do motor',
    category: 'Filtros',
    intervalKm: 15000,
    intervalMonths: 12,
    estimatedCostBrl: 90,
    triggers: ['filtro de ar', 'falta de potência', 'consumo'],
  },
  {
    id: 'cabin_filter',
    name: 'Filtro de cabine (ar-condicionado)',
    category: 'Filtros',
    intervalKm: 15000,
    intervalMonths: 12,
    estimatedCostBrl: 80,
    triggers: ['ar-condicionado', 'cheiro', 'filtro cabine'],
  },
  {
    id: 'fuel_filter',
    name: 'Filtro de combustível',
    category: 'Filtros',
    intervalKm: 20000,
    intervalMonths: 24,
    estimatedCostBrl: 120,
    triggers: ['combustível', 'engasg', 'bomba'],
  },
  {
    id: 'spark_plugs',
    name: 'Velas de ignição',
    category: 'Motor',
    intervalKm: 30000,
    intervalMonths: 36,
    estimatedCostBrl: 220,
    notes: 'Iridium/platina podem ir além — seguir OEM.',
    triggers: ['vela', 'misfire', 'p0300', 'falha de combust', 'falhando'],
  },
  {
    id: 'coolant',
    name: 'Fluido de arrefecimento (troca/nível)',
    category: 'Arrefecimento',
    intervalKm: 40000,
    intervalMonths: 36,
    estimatedCostBrl: 180,
    triggers: ['arrefec', 'superaquec', 'termostato', 'ect', 'radiador', 'ventoinha'],
  },
  {
    id: 'brake_fluid',
    name: 'Fluido de freio (DOT)',
    category: 'Freios',
    intervalKm: 40000,
    intervalMonths: 24,
    estimatedCostBrl: 150,
    triggers: ['freio', 'pedal esponjoso', 'abs'],
  },
  {
    id: 'brake_pads',
    name: 'Pastilhas de freio (inspeção/troca)',
    category: 'Freios',
    intervalKm: 30000,
    intervalMonths: 24,
    estimatedCostBrl: 350,
    notes: 'Intervalo muito variável — medir espessura.',
    triggers: ['pastilha', 'freio', 'chiado freio'],
  },
  {
    id: 'timing_belt',
    name: 'Correia dentada / kit distribuição',
    category: 'Correias',
    intervalKm: 60000,
    intervalMonths: 48,
    estimatedCostBrl: 1200,
    notes: 'Crítico em motores interferentes; confirmar km no manual.',
    triggers: ['correia', 'dentada', 'distribuição', 'timing'],
  },
  {
    id: 'accessory_belt',
    name: 'Correia de acessórios / tensionador',
    category: 'Correias',
    intervalKm: 50000,
    intervalMonths: 48,
    estimatedCostBrl: 280,
    triggers: ['correia', 'chiado motor', 'alternador'],
  },
  {
    id: 'atf',
    name: 'Fluido da transmissão (ATF) — se automático',
    category: 'Transmissão',
    intervalKm: 40000,
    intervalMonths: 36,
    estimatedCostBrl: 450,
    triggers: ['câmbio', 'cambio', 'atf', 'transmiss', 'troca dura'],
  },
  {
    id: 'battery',
    name: 'Teste / troca de bateria 12V',
    category: 'Elétrica',
    intervalKm: 40000,
    intervalMonths: 36,
    estimatedCostBrl: 450,
    triggers: ['bateria', 'não pega', 'tensão', 'partida'],
  },
  {
    id: 'tires',
    name: 'Rodízio e calibragem de pneus',
    category: 'Pneus',
    intervalKm: 10000,
    intervalMonths: 6,
    estimatedCostBrl: 80,
    triggers: ['pneu', 'vibra', 'alinhamento'],
  },
  {
    id: 'alignment',
    name: 'Alinhamento e balanceamento',
    category: 'Pneus',
    intervalKm: 10000,
    intervalMonths: 12,
    estimatedCostBrl: 180,
    triggers: ['alinhamento', 'puxando', 'volante'],
  },
];

export const BASE_EV_SCHEDULE: PreventiveItem[] = [
  {
    id: 'ev_cabin',
    name: 'Filtro de cabine',
    category: 'Filtros',
    intervalKm: 15000,
    intervalMonths: 12,
    estimatedCostBrl: 90,
    triggers: ['filtro', 'ar-condicionado'],
  },
  {
    id: 'ev_12v',
    name: 'Bateria 12V auxiliar',
    category: 'EV',
    intervalKm: 40000,
    intervalMonths: 36,
    estimatedCostBrl: 450,
    triggers: ['bateria', '12v', 'não liga'],
  },
  {
    id: 'ev_coolant',
    name: 'Circuito de refrigeração da bateria/inversor',
    category: 'EV',
    intervalKm: 60000,
    intervalMonths: 48,
    estimatedCostBrl: 600,
    notes: 'Somente procedimento OEM / capacitação HV.',
    triggers: ['superaquec', 'bateria', 'redução de potência', 'hv'],
  },
  {
    id: 'ev_brakes',
    name: 'Freios (inspeção — menor desgaste com regen)',
    category: 'Freios',
    intervalKm: 40000,
    intervalMonths: 24,
    estimatedCostBrl: 200,
    triggers: ['freio'],
  },
  {
    id: 'ev_tires',
    name: 'Pneus (desgaste e calibragem)',
    category: 'Pneus',
    intervalKm: 10000,
    intervalMonths: 6,
    estimatedCostBrl: 80,
    triggers: ['pneu'],
  },
];

function extractKm(text: string): number | undefined {
  const m = (text || '').match(/(\d{2,3}(?:[.,]\d{3})*|\d{4,7})\s*(?:km|quilom)/i);
  if (!m) return undefined;
  const n = parseInt(m[1].replace(/[.,]/g, ''), 10);
  return Number.isFinite(n) ? n : undefined;
}

function extractMonthsSince(text: string): number | undefined {
  const m = (text || '').match(/(\d{1,2})\s*(?:meses|mês|mes)/i);
  if (!m) return undefined;
  return parseInt(m[1], 10);
}

/** Monta plano preventivo a partir do veículo + relato. */
export function buildPreventivePlan(input: {
  make?: string;
  model?: string;
  description?: string;
  isEv?: boolean;
  odometerKm?: number;
}): PreventivePlan {
  const desc = (input.description || '').toLowerCase();
  const km = input.odometerKm ?? extractKm(desc);
  const months = extractMonthsSince(desc);
  const schedule = input.isEv ? BASE_EV_SCHEDULE : BASE_ICE_SCHEDULE;

  const items: PreventivePlan['items'] = [];

  for (const item of schedule) {
    let priority: 'alta' | 'média' | 'rotina' = 'rotina';
    let dueReason = 'Intervalo de referência de oficina';
    let include = false;

    // Trigger por sintoma/código
    if (item.triggers?.some((t) => desc.includes(t))) {
      include = true;
      priority = 'alta';
      dueReason = 'Relacionado ao relato / código atual';
    }

    // Por odômetro
    if (km != null && item.intervalKm && km > 0) {
      const cycles = Math.floor(km / item.intervalKm);
      const progress = (km % item.intervalKm) / item.intervalKm;
      if (progress >= 0.9 || cycles >= 1 && progress < 0.05) {
        include = true;
        if (priority === 'rotina') priority = 'média';
        dueReason =
          progress >= 0.9
            ? `Próximo do intervalo de ${item.intervalKm} km (odômetro ~${km} km)`
            : `Ciclo de ${item.intervalKm} km atingido (~${km} km)`;
      }
    }

    // Por tempo
    if (months != null && item.intervalMonths && months >= item.intervalMonths * 0.9) {
      include = true;
      if (priority === 'rotina') priority = 'média';
      dueReason = `Intervalo temporal ~${item.intervalMonths} meses`;
    }

    // Sempre incluir core rotina se nada informado (top 4)
    if (!include && !desc && !km && ['oil', 'air_filter', 'cabin_filter', 'tires', 'ev_cabin', 'ev_tires'].includes(item.id)) {
      include = true;
      dueReason = 'Rotina recomendada (sem odômetro informado)';
    }

    // Com relato genérico: óleo + filtros
    if (!include && desc && ['oil', 'air_filter'].includes(item.id)) {
      include = true;
      dueReason = 'Rotina mínima sugerida com o laudo';
    }

    if (include) {
      items.push({ ...item, dueReason, priority });
    }
  }

  // Ordenar: alta > média > rotina
  const rank = { alta: 0, média: 1, rotina: 2 };
  items.sort((a, b) => rank[a.priority] - rank[b.priority]);

  const checklist = items.slice(0, 10).map((i) => {
    const when =
      i.intervalKm && i.intervalMonths
        ? `a cada ${i.intervalKm} km ou ${i.intervalMonths} meses`
        : i.intervalKm
          ? `a cada ${i.intervalKm} km`
          : i.intervalMonths
            ? `a cada ${i.intervalMonths} meses`
            : 'conforme OEM';
    return `${i.name} (${when}) — ${i.dueReason}`;
  });

  const budgetHints = items
    .filter((i) => i.estimatedCostBrl)
    .slice(0, 6)
    .map((i) => ({
      item: i.name,
      category: i.category,
      estimatedCost: i.estimatedCostBrl!,
    }));

  const vehicleLabel = [input.make, input.model].filter(Boolean).join(' ') || 'Veículo';

  return {
    vehicleLabel,
    items: items.slice(0, 12),
    checklist,
    budgetHints,
    disclaimer:
      'Intervalos de referência para oficina. Confirmar sempre o manual do fabricante e condições de uso severo.',
  };
}

export function formatPreventiveForPrompt(plan: PreventivePlan): string {
  if (!plan.items.length) return '';
  const lines = plan.items.slice(0, 8).map(
    (i) =>
      `- [${i.priority}] ${i.name} (${i.category}): ${i.dueReason}` +
      (i.intervalKm ? ` | ref. ${i.intervalKm} km` : '')
  );
  return ['MANUTENÇÃO PREVENTIVA SUGERIDA:', ...lines, plan.disclaimer].join('\n');
}
