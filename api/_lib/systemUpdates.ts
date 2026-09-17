/**
 * Módulo de atualização de sistemas
 * - Campanhas / situações em que software de central (ECU/TCU/BCM) deve ser checado
 * - Metadados de versão do OficIA / HENIZA
 */

export type SystemUpdateSeverity = 'obrigatória' | 'recomendada' | 'informativa';

export type SystemUpdateCampaign = {
  id: string;
  title: string;
  systems: string[];
  makes?: string[];
  severity: SystemUpdateSeverity;
  symptoms: string[];
  procedure: string[];
  notes: string;
  tools?: string[];
};

export type SystemUpdateAdvice = {
  campaigns: SystemUpdateCampaign[];
  checklist: string[];
  summaryLines: string[];
  riskNotes: string[];
};

export const APP_SYSTEM_META = {
  name: 'HENIZA OficIA',
  version: '1.2.0',
  buildLabel: 'oficia-fault-preventive-obd',
  modules: [
    'diagnose',
    'obd-live',
    'faultEngine',
    'preventiveMaintenance',
    'temperatureSensors',
    'systemUpdates',
    'networkSearch',
  ],
};

/** Situações típicas de oficina (não substitui TSB OEM). */
export const SYSTEM_UPDATE_CAMPAIGNS: SystemUpdateCampaign[] = [
  {
    id: 'ecu_after_battery',
    title: 'Recalibração / atualização após desconexão de bateria',
    systems: ['ECU', 'TCU', 'BCM'],
    severity: 'recomendada',
    symptoms: ['bateria', 'não pega', 'luzes no painel', 'câmbio em modo emergência', 'após troca de bateria'],
    procedure: [
      'Confirmar tensão estável > 12,4 V',
      'Ler falhas em todas as centrais',
      'Verificar se há software pendente no portal OEM',
      'Executar rotinas de basic settings / codificação se exigido',
    ],
    notes: 'Muitos veículos perdem adaptações; não é sempre “reflash”.',
    tools: ['Scanner OEM ou equivalente', 'Fonte de sustentação'],
  },
  {
    id: 'tcu_shift',
    title: 'Software de transmissão (TCU) — trocas irregulares',
    systems: ['TCU'],
    severity: 'recomendada',
    symptoms: ['câmbio', 'troca dura', 'patina', 'modo emergência', 'atf', 'p07'],
    procedure: [
      'Confirmar nível e estado do ATF',
      'Ler códigos TCU',
      'Consultar campanhas de software da montadora',
      'Só reprogramar com procedimento e calibragem corretos',
    ],
    notes: 'Atualização sem corrigir mecânica/ATF costuma reincidir.',
    tools: ['Interface OEM', 'Fonte 13,5–14,5 V estável'],
  },
  {
    id: 'ecu_emissions_misfire',
    title: 'Revisão de software de motor (missões / misfire)',
    systems: ['ECU'],
    severity: 'informativa',
    symptoms: ['p0300', 'misfire', 'falha de combust', 'catalisador', 'p0420', 'consumo'],
    procedure: [
      'Diagnosticar causa raiz (ignição/combustível/mecânica)',
      'Verificar se existe TSB de software para o motor',
      'Atualizar apenas se TSB/campanha indicar',
    ],
    notes: 'Não usar reflash como primeiro passo em P0300.',
    tools: ['Scanner', 'Portal RMI/TSB'],
  },
  {
    id: 'abs_esp',
    title: 'Atualização ABS/ESP após intervenção',
    systems: ['ABS', 'ESP', 'BCM'],
    severity: 'recomendada',
    symptoms: ['abs', 'esp', 'luz de freio', 'sensor de roda', 'após alinhamento'],
    procedure: [
      'Ler módulos de freios',
      'Sangria eletrônica se necessário',
      'Checar campanhas de software ABS/ESP',
    ],
    notes: 'Calibração de sensores de ângulo/yaw pode ser exigida.',
    tools: ['Scanner com rotinas ABS'],
  },
  {
    id: 'bcm_can',
    title: 'BCM / rede CAN — falhas intermitentes',
    systems: ['BCM', 'Gateway', 'CAN'],
    severity: 'recomendada',
    symptoms: ['can', 'comunicação', 'u0100', 'u1000', 'módulo offline', 'intermitente'],
    procedure: [
      'Mapear rede (resistência 60 Ω, osciloscópio se possível)',
      'Alimentação e massas dos módulos',
      'Gateway: verificar software e codificação',
    ],
    notes: 'Atualizar gateway sem sanar chicote/massa não resolve.',
    tools: ['Multímetro', 'Scanner de rede'],
  },
  {
    id: 'ev_bms',
    title: 'Atualização BMS / inversor (EV/Híbrido)',
    systems: ['BMS', 'Inversor', 'OBC'],
    severity: 'obrigatória',
    symptoms: ['bateria hv', 'não carrega', 'redução de potência', 'isolamento', 'híbrid', 'elétric'],
    procedure: [
      'EPI e isolamento HV',
      'Ler BMS com equipamento homologado',
      'Aplicar software apenas via procedimento OEM',
      'Validar gestão térmica pós-update',
    ],
    notes: 'Risco alto — somente profissional capacitado.',
    tools: ['Ferramenta OEM HV', 'EPI NR-10'],
  },
  {
    id: 'infotainment',
    title: 'Atualização multimídia / cluster',
    systems: ['Infotainment', 'Cluster'],
    severity: 'informativa',
    symptoms: ['multimídia', 'tela', 'bluetooth', 'navegador', 'painel digital'],
    procedure: [
      'Verificar versão de software no menu de serviço',
      'Baixar pacote oficial da montadora',
      'Manter bateria estável durante o flash',
    ],
    notes: 'Interrupção no flash pode “brickar” a unidade.',
    tools: ['USB/SD oficial', 'Fonte estabilizada'],
  },
];

export function findSystemUpdates(input: {
  description?: string;
  make?: string;
  isEv?: boolean;
}): SystemUpdateAdvice {
  const q = ((input.description || '') + ' ' + (input.make || '')).toLowerCase();
  const matched: SystemUpdateCampaign[] = [];

  for (const c of SYSTEM_UPDATE_CAMPAIGNS) {
    if (c.makes?.length) {
      const make = (input.make || '').toLowerCase();
      if (!c.makes.some((m) => make.includes(m.toLowerCase()))) continue;
    }
    if (c.id === 'ev_bms' && !input.isEv && !/elétr|eletr|híbrid|hibrid|bms|hv/.test(q)) {
      continue;
    }
    const hit = c.symptoms.some((s) => q.includes(s));
    if (hit) matched.push(c);
  }

  // Sem match forte: ainda assim orientar checagem genérica se houver códigos U ou “software”
  if (!matched.length && /software|atualiza|reprogram|flash|u0\d{3}/.test(q)) {
    matched.push({
      id: 'generic_sw_check',
      title: 'Verificação genérica de software de centrais',
      systems: ['ECU', 'Gateway'],
      severity: 'informativa',
      symptoms: [],
      procedure: [
        'Ler todos os módulos',
        'Anotar versões de software/hardware',
        'Consultar portal OEM / TSB',
      ],
      notes: 'Confirmar campanhas oficiais antes de reprogramar.',
      tools: ['Scanner'],
    });
  }

  const checklist: string[] = [];
  const summaryLines: string[] = [];
  const riskNotes: string[] = [];

  for (const c of matched.slice(0, 5)) {
    summaryLines.push(`[${c.severity}] ${c.title} — sistemas: ${c.systems.join(', ')}`);
    checklist.push(...c.procedure);
    riskNotes.push(c.notes);
  }

  if (matched.length) {
    checklist.unshift('Sustentar tensão da bateria durante qualquer atualização');
    checklist.push('Registrar versões antes e depois do procedimento');
  }

  return {
    campaigns: matched.slice(0, 5),
    checklist: Array.from(new Set(checklist)).slice(0, 12),
    summaryLines,
    riskNotes: Array.from(new Set(riskNotes)).slice(0, 6),
  };
}

export function formatSystemUpdatesForPrompt(advice: SystemUpdateAdvice): string {
  if (!advice.campaigns.length) return '';
  return [
    'ATUALIZAÇÃO DE SISTEMAS (software/centrais):',
    ...advice.summaryLines.map((l) => `- ${l}`),
    ...advice.riskNotes.map((r) => `Nota: ${r}`),
  ].join('\n');
}
