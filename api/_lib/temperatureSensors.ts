/**
 * Sensores de temperatura — base técnica para o OficIA.
 * ECT (arrefecimento), IAT (admissão), óleo, catalisador, ambiente, EV (pack).
 */

export type TempSensorId =
  | 'ECT'
  | 'IAT'
  | 'OIL'
  | 'CAT'
  | 'AMBIENT'
  | 'TFT'
  | 'EV_PACK'
  | 'EV_INVERTER';

export type TempSensorProfile = {
  id: TempSensorId;
  name: string;
  location: string;
  relatedCodes: string[];
  typicalRangeC: string;
  resistanceHint?: string;
  symptoms: string[];
  checks: string[];
  notes: string;
};

export type TempDiagnosis = {
  matchedSensors: TempSensorProfile[];
  summaryLines: string[];
  checks: string[];
  codes: string[];
  severity: 'Alta' | 'Média' | 'Baixa';
  problemName: string;
  diagnosticNotes: string;
};

export const TEMP_SENSORS: TempSensorProfile[] = [
  {
    id: 'ECT',
    name: 'Sensor de temperatura do líquido de arrefecimento (ECT/CTS)',
    location: 'Bloco / cabeçote / carcaça do termostato',
    relatedCodes: ['P0115', 'P0116', 'P0117', 'P0118', 'P0119', 'P0125', 'P0128', 'P0217', 'P2181'],
    typicalRangeC: 'Motor frio ≈ ambiente; quente 85–105 °C',
    resistanceHint: 'NTC: frio ~2–5 kΩ; quente ~200–400 Ω (valores típicos — confirmar manual)',
    symptoms: [
      'superaquecimento',
      'ventoinha sempre ligada',
      'demora a aquecer',
      'consumo alto',
      'ar quente fraco',
    ],
    checks: [
      'Comparar ECT no scanner com termômetro no tubo superior',
      'Medir resistência NTC (frio vs quente)',
      'Conector, chicote e massa do sensor',
      'Nível e sangria do arrefecimento',
      'Termostato (abre cedo/tarde)',
      'Ventoinha e relé',
    ],
    notes: 'ECT errado afeta injeção, ponto e comando da ventoinha.',
  },
  {
    id: 'IAT',
    name: 'Sensor de temperatura do ar de admissão (IAT)',
    location: 'Filtro de ar, coletor ou integrado ao MAF',
    relatedCodes: ['P0110', 'P0111', 'P0112', 'P0113', 'P0114'],
    typicalRangeC: 'Próximo da temperatura ambiente com motor frio',
    resistanceHint: 'NTC; se integrado ao MAF, testar pino IAT do conector',
    symptoms: ['falha a frio', 'engase', 'mistura rica/pobre', 'perda de potência'],
    checks: [
      'Live data IAT vs temperatura ambiente',
      'Sujidade no elemento do MAF/IAT',
      'Conector e chicote',
      'Vazamento de ar pós-MAF',
    ],
    notes: 'IAT influencia densidade do ar e tempo de injeção.',
  },
  {
    id: 'OIL',
    name: 'Sensor de temperatura do óleo do motor',
    location: 'Cárter / filtro / galeria de óleo',
    relatedCodes: ['P0195', 'P0196', 'P0197', 'P0198'],
    typicalRangeC: 'Após aquecimento tipicamente 90–120 °C',
    symptoms: ['aviso de óleo quente', 'modo de proteção', 'pressão de óleo instável'],
    checks: [
      'Nível e qualidade do óleo',
      'Live data OIL TEMP vs ECT',
      'Conector do sensor',
      'Radiador de óleo / entupimento',
    ],
    notes: 'Em alguns motores o sensor combina pressão + temperatura.',
  },
  {
    id: 'CAT',
    name: 'Sensor / modelo de temperatura do catalisador',
    location: 'Pré/pós catalisador (direto ou estimado via sondas)',
    relatedCodes: ['P0420', 'P0430', 'P0421', 'P0431', 'P0544', 'P0545', 'P0546'],
    typicalRangeC: 'Pós-aquecimento centenas de °C no escape',
    symptoms: ['cheiro de enxofre', 'luz de catalisador', 'perda de rendimento'],
    checks: [
      'Sondas O2/AFR antes e depois do cat',
      'Fugas de escape',
      'Histórico de misfire (P0300–P030x)',
      'Eficiência do catalisador no scanner',
    ],
    notes: 'Muitos veículos estimam temperatura do cat sem sensor físico dedicado.',
  },
  {
    id: 'AMBIENT',
    name: 'Sensor de temperatura ambiente',
    location: 'Para-choque / caixa de roda / espelho',
    relatedCodes: ['P0070', 'P0071', 'P0072', 'P0073'],
    typicalRangeC: 'Igual à temperatura externa real',
    symptoms: ['ar-condicionado irregular', 'indicador de temperatura externa errado'],
    checks: [
      'Comparar com temperatura real externa',
      'Sensor exposto ao sol/motor (leitura falsa)',
      'Conector e chicote',
    ],
    notes: 'Usado pelo climatizador e às vezes pela estratégia de cold start.',
  },
  {
    id: 'TFT',
    name: 'Sensor de temperatura do fluido da transmissão (TFT)',
    location: 'Cárter / corpo de válvulas da transmissão',
    relatedCodes: ['P0710', 'P0711', 'P0712', 'P0713', 'P0218'],
    typicalRangeC: 'Trabalho típico ~70–110 °C (varia por câmbio)',
    symptoms: ['câmbio em modo de emergência', 'trocas duras', 'superaquecimento ATF'],
    checks: [
      'Nível e estado do ATF',
      'Live data TFT',
      'Radiador de transmissão / linhas',
      'Conector do sensor TFT',
    ],
    notes: 'Superaquecimento de ATF reduz vida útil do câmbio.',
  },
  {
    id: 'EV_PACK',
    name: 'Sensores de temperatura do pacote de bateria HV (EV/Híbrido)',
    location: 'Módulos da bateria de alta tensão',
    relatedCodes: ['P0A2B', 'P0A2C', 'P0A2D', 'P0A2E', 'P0A94'],
    typicalRangeC: 'Operação típica ~15–40 °C (gestão térmica ativa)',
    symptoms: ['redução de potência', 'não carrega', 'aviso de bateria HV'],
    checks: [
      'Live data temperaturas das células/módulos',
      'Sistema de refrigeração da bateria',
      'Isolamento HV e conectores',
      'Usar EPI NR-10 / procedimentos OEM',
    ],
    notes: 'Diagnóstico HV somente com capacitação e isolamento adequados.',
  },
  {
    id: 'EV_INVERTER',
    name: 'Sensor de temperatura do inversor / eletrônica de potência',
    location: 'Inversor / conversor DC-DC',
    relatedCodes: ['P0A3C', 'P0A3D', 'P0A3E', 'P0A3F'],
    typicalRangeC: 'Depende do projeto; monitorar deriva térmica',
    symptoms: ['corte de torque', 'aviso de sistema híbrido/EV'],
    checks: [
      'Live data temp. inversor',
      'Circuito de refrigeração do inversor',
      'Conectores e massas',
    ],
    notes: 'Alta tensão — seguir manual OEM.',
  },
];

/** Códigos OBD de temperatura com texto PT e checklist. */
export const TEMP_DTC: Record<
  string,
  { title: string; meaning: string; sensor: TempSensorId; checks: string[] }
> = {
  P0115: {
    title: 'Circuito do sensor ECT',
    meaning: 'Falha geral no circuito do sensor de temperatura do arrefecimento.',
    sensor: 'ECT',
    checks: ['Conector ECT', 'Resistência NTC', 'Chicote até ECM'],
  },
  P0116: {
    title: 'ECT — faixa/desempenho',
    meaning: 'Leitura do ECT inconsistente com o aquecimento do motor.',
    sensor: 'ECT',
    checks: ['Comparar ECT x termômetro', 'Termostato', 'Bolhas no sistema'],
  },
  P0117: {
    title: 'ECT — circuito baixo',
    meaning: 'Sinal de tensão baixa (sensor “muito quente” ou curto).',
    sensor: 'ECT',
    checks: ['Curto no chicote', 'Sensor em curto', 'ECM'],
  },
  P0118: {
    title: 'ECT — circuito alto',
    meaning: 'Sinal de tensão alta (sensor “muito frio” ou aberto).',
    sensor: 'ECT',
    checks: ['Conector solto', 'Sensor aberto', 'Fio cortado'],
  },
  P0119: {
    title: 'ECT — circuito intermitente',
    meaning: 'Sinal instável do sensor de arrefecimento.',
    sensor: 'ECT',
    checks: ['Chicote com mau contato', 'Conector oxidado', 'Vibração'],
  },
  P0125: {
    title: 'Temperatura insuficiente para controle de combustível',
    meaning: 'Motor não atinge temperatura mínima para closed-loop a tempo.',
    sensor: 'ECT',
    checks: ['Termostato', 'ECT', 'Nível de arrefecimento'],
  },
  P0128: {
    title: 'Termostato — abaixo da temperatura de regulagem',
    meaning: 'Sistema demora a aquecer (termostato aberto ou ECT).',
    sensor: 'ECT',
    checks: ['Troca de termostato', 'Validar ECT', 'Sangria'],
  },
  P0217: {
    title: 'Superaquecimento do motor',
    meaning: 'Temperatura do motor acima do limite de segurança.',
    sensor: 'ECT',
    checks: [
      'Nível de água',
      'Ventoinha',
      'Bomba d’água',
      'Radiador',
      'Não abrir tampa quente',
    ],
  },
  P2181: {
    title: 'Desempenho do sistema de arrefecimento',
    meaning: 'Cooling system fora da faixa esperada.',
    sensor: 'ECT',
    checks: ['Termostato', 'Radiador', 'Ventoinha', 'ECT'],
  },
  P0110: {
    title: 'Circuito do sensor IAT',
    meaning: 'Falha geral no sensor de temperatura do ar de admissão.',
    sensor: 'IAT',
    checks: ['Conector IAT/MAF', 'Resistência', 'Chicote'],
  },
  P0111: {
    title: 'IAT — faixa/desempenho',
    meaning: 'Leitura IAT inconsistente.',
    sensor: 'IAT',
    checks: ['Comparar com ambiente', 'Sujidade MAF', 'Vazamento de ar'],
  },
  P0112: {
    title: 'IAT — circuito baixo',
    meaning: 'Sinal baixo (ar “muito quente” ou curto).',
    sensor: 'IAT',
    checks: ['Curto no chicote', 'Sensor'],
  },
  P0113: {
    title: 'IAT — circuito alto',
    meaning: 'Sinal alto (ar “muito frio” ou aberto).',
    sensor: 'IAT',
    checks: ['Conector aberto', 'Sensor', 'Chicote'],
  },
  P0114: {
    title: 'IAT — intermitente',
    meaning: 'Sinal intermitente do IAT.',
    sensor: 'IAT',
    checks: ['Mau contato', 'Vibração no chicote'],
  },
  P0195: {
    title: 'Sensor temperatura do óleo — circuito',
    meaning: 'Falha no circuito do sensor de temperatura do óleo.',
    sensor: 'OIL',
    checks: ['Conector', 'Nível de óleo', 'Chicote'],
  },
  P0196: {
    title: 'Temperatura do óleo — faixa/desempenho',
    meaning: 'Leitura de óleo inconsistente.',
    sensor: 'OIL',
    checks: ['Live data OIL vs ECT', 'Radiador de óleo'],
  },
  P0197: {
    title: 'Temperatura do óleo — circuito baixo',
    meaning: 'Sinal baixo no sensor de óleo.',
    sensor: 'OIL',
    checks: ['Curto', 'Sensor'],
  },
  P0198: {
    title: 'Temperatura do óleo — circuito alto',
    meaning: 'Sinal alto no sensor de óleo.',
    sensor: 'OIL',
    checks: ['Aberto', 'Conector'],
  },
  P0710: {
    title: 'Sensor TFT — circuito',
    meaning: 'Falha no sensor de temperatura do fluido da transmissão.',
    sensor: 'TFT',
    checks: ['Conector TFT', 'Nível ATF', 'Chicote'],
  },
  P0711: {
    title: 'TFT — faixa/desempenho',
    meaning: 'Temperatura do ATF inconsistente.',
    sensor: 'TFT',
    checks: ['Live data TFT', 'Radiador de transmissão'],
  },
  P0712: {
    title: 'TFT — circuito baixo',
    meaning: 'Sinal baixo do TFT.',
    sensor: 'TFT',
    checks: ['Curto', 'Sensor'],
  },
  P0713: {
    title: 'TFT — circuito alto',
    meaning: 'Sinal alto do TFT.',
    sensor: 'TFT',
    checks: ['Aberto', 'Conector'],
  },
  P0218: {
    title: 'Superaquecimento da transmissão',
    meaning: 'Temperatura do fluido da transmissão acima do limite.',
    sensor: 'TFT',
    checks: ['Nível ATF', 'Radiador/câmbio', 'Uso severo / reboque'],
  },
  P0070: {
    title: 'Sensor temperatura ambiente — circuito',
    meaning: 'Falha no sensor de temperatura externa.',
    sensor: 'AMBIENT',
    checks: ['Sensor no para-choque', 'Conector', 'Chicote'],
  },
  P0071: {
    title: 'Temperatura ambiente — faixa/desempenho',
    meaning: 'Leitura ambiente inconsistente.',
    sensor: 'AMBIENT',
    checks: ['Comparar com temperatura real', 'Exposição ao calor do motor'],
  },
  P0072: {
    title: 'Temperatura ambiente — circuito baixo',
    meaning: 'Sinal baixo do sensor ambiente.',
    sensor: 'AMBIENT',
    checks: ['Curto', 'Sensor'],
  },
  P0073: {
    title: 'Temperatura ambiente — circuito alto',
    meaning: 'Sinal alto do sensor ambiente.',
    sensor: 'AMBIENT',
    checks: ['Aberto', 'Conector'],
  },
  P0544: {
    title: 'Sensor temperatura gases de escape (banco 1)',
    meaning: 'Circuito do sensor EGT/CAT com falha.',
    sensor: 'CAT',
    checks: ['Sensor EGT', 'Chicote escape', 'Conector'],
  },
  P0545: {
    title: 'Sensor EGT — circuito baixo',
    meaning: 'Sinal baixo do sensor de temperatura de escape.',
    sensor: 'CAT',
    checks: ['Curto', 'Sensor'],
  },
  P0546: {
    title: 'Sensor EGT — circuito alto',
    meaning: 'Sinal alto do sensor de temperatura de escape.',
    sensor: 'CAT',
    checks: ['Aberto', 'Sensor'],
  },
};

function extractCodes(text: string): string[] {
  const found = new Set<string>();
  const re = /\b([PCBU][0-9A-F]{4})\b/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text || ''))) found.add(m[1].toUpperCase());
  return Array.from(found);
}

/** Detecta se o relato envolve temperatura / sensores térmicos. */
export function isTemperatureRelated(text: string): boolean {
  const q = (text || '').toLowerCase();
  if (extractCodes(text).some((c) => TEMP_DTC[c])) return true;
  return /temperatura|superaquec|esquent|ferven|termostato|arrefec|ventoinha|radiador|ect\b|iat\b|\batf\b|óleo quente|oleo quente|sensor.*temp|temp.*sensor|cold start|aquecimento|super ?aquecido/.test(
    q
  );
}

export function diagnoseTemperature(text: string): TempDiagnosis | null {
  if (!isTemperatureRelated(text)) return null;

  const q = (text || '').toLowerCase();
  const codes = extractCodes(text);
  const matchedSensors: TempSensorProfile[] = [];
  const checks: string[] = [];
  const summaryLines: string[] = [];
  const codeSet = new Set<string>();

  for (const c of codes) {
    const dtc = TEMP_DTC[c];
    if (!dtc) continue;
    codeSet.add(c);
    summaryLines.push(`${c}: ${dtc.title} — ${dtc.meaning}`);
    checks.push(...dtc.checks);
    const profile = TEMP_SENSORS.find((s) => s.id === dtc.sensor);
    if (profile && !matchedSensors.find((m) => m.id === profile.id)) {
      matchedSensors.push(profile);
      checks.push(...profile.checks);
    }
  }

  // Sintomas sem código
  for (const s of TEMP_SENSORS) {
    if (matchedSensors.find((m) => m.id === s.id)) continue;
    const hitSymptom = s.symptoms.some((sy) => q.includes(sy));
    const hitName =
      (s.id === 'ECT' && /arrefec|termostato|ventoinha|radiador|superaquec|ferven|esquent/.test(q)) ||
      (s.id === 'IAT' && /admiss[aã]o|iat\b|maf/.test(q)) ||
      (s.id === 'OIL' && /óleo|oleo/.test(q) && /temp|quent/.test(q)) ||
      (s.id === 'TFT' && /c[aâ]mbio|transmiss|atf/.test(q)) ||
      (s.id === 'EV_PACK' && /bateria|hv|el[eé]tric|h[ií]brid/.test(q)) ||
      (s.id === 'AMBIENT' && /ambiente|externa/.test(q));
    if (hitSymptom || hitName) {
      matchedSensors.push(s);
      checks.push(...s.checks);
      summaryLines.push(`${s.name}: ${s.notes}`);
      s.relatedCodes.slice(0, 4).forEach((c) => codeSet.add(c));
    }
  }

  if (!matchedSensors.length && !codeSet.size) {
    // genérico temperatura
    matchedSensors.push(TEMP_SENSORS.find((s) => s.id === 'ECT')!);
    checks.push(...TEMP_SENSORS[0].checks);
    summaryLines.push('Relato de temperatura sem código específico — iniciar por ECT/termostato/ventoinha.');
  }

  const uniqueChecks = Array.from(new Set(checks)).slice(0, 12);
  const severity: TempDiagnosis['severity'] =
    /superaquec|ferven|p0217|p0218|ev_pack/i.test(q + Array.from(codeSet).join(' '))
      ? 'Alta'
      : 'Média';

  const names = matchedSensors.map((s) => s.name).join('; ');
  const problemName =
    codeSet.size > 0
      ? `${Array.from(codeSet).slice(0, 3).join('/')} — sensores de temperatura`
      : `Verificar sensores de temperatura (${matchedSensors.map((s) => s.id).join(', ')})`;

  const diagnosticNotes = [
    summaryLines.join('\n'),
    '',
    'Sensores envolvidos: ' + names,
    ...matchedSensors.map(
      (s) =>
        `• ${s.id}: faixa típica ${s.typicalRangeC}${s.resistanceHint ? ' | ' + s.resistanceHint : ''}`
    ),
  ].join('\n');

  return {
    matchedSensors,
    summaryLines,
    checks: uniqueChecks,
    codes: Array.from(codeSet),
    severity,
    problemName,
    diagnosticNotes,
  };
}

export function temperatureHitsFromDiagnosis(diag: TempDiagnosis) {
  return diag.matchedSensors.map((s) => ({
    title: `${s.id} — ${s.name}`,
    snippet: `${s.location}. Faixa: ${s.typicalRangeC}. ${s.notes}`,
    kind: 'dtc' as const,
    url: undefined as string | undefined,
  }));
}
