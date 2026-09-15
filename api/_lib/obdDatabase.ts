/**
 * Banco OBD-II para o OficIA.
 * 1) Códigos comuns com checklist em PT (sempre offline)
 * 2) Base ampliada: OBDIICodes Codigos-ptbr.json (~2973 códigos, MIT)
 *    https://github.com/fabiovila/OBDIICodes
 * 3) OLP continua opcional em publicTechnicalApis
 */

export type ObdEntry = {
  code: string;
  title: string;
  meaning: string;
  checks: string[];
  family?: string;
  source: 'local' | 'obd-pt' | 'obd-en';
};

type RemoteRow = { Code?: string; code?: string; Description?: string; description?: string };

/** Cache em memória do processo serverless (sobrevive entre invocações quentes). */
let remotePt: Map<string, string> | null = null;
let remoteEn: Map<string, string> | null = null;
let loadPromise: Promise<void> | null = null;

function familyOf(code: string): string {
  const c = code.toUpperCase();
  if (c.startsWith('P')) return 'Powertrain (motor/transmissão)';
  if (c.startsWith('B')) return 'Body (carroceria)';
  if (c.startsWith('C')) return 'Chassis (freios/suspensão)';
  if (c.startsWith('U')) return 'Network (rede/comunicação)';
  return 'OBD';
}

/** Checklist padrão por família quando não há lista específica. */
function defaultChecks(code: string): string[] {
  const f = code[0]?.toUpperCase();
  if (f === 'P') {
    return [
      'Confirmar o código e freeze frame no scanner',
      'Verificar bateria e massas do motor',
      'Inspecionar chicotes e conectores do sistema',
      'Testar sensores/atuadores relacionados',
    ];
  }
  if (f === 'C') {
    return [
      'Ler módulos ABS/ESP',
      'Inspecionar sensores de roda e anéis fônicos',
      'Verificar nível e estado do fluido de freio',
    ];
  }
  if (f === 'U') {
    return [
      'Verificar alimentação e massas dos módulos',
      'Inspecionar rede CAN (continuidade/terminação)',
      'Ler outros módulos na mesma rede',
    ];
  }
  if (f === 'B') {
    return [
      'Ler módulo de carroceria/BCM',
      'Verificar fusíveis e alimentações',
      'Cuidado com sistemas SRS (airbag)',
    ];
  }
  return ['Confirmar código no scanner', 'Inspecionar sistema relacionado'];
}

/** Base local prioritária — códigos mais frequentes em oficina BR, com checklist. */
const LOCAL: Record<string, { title: string; meaning: string; checks: string[] }> = {
  P0300: {
    title: 'Falha de combustão aleatória / múltiplos cilindros',
    meaning:
      'Misfire em vários cilindros. Risco de dano ao catalisador se o motor continuar operando com a falha.',
    checks: [
      'Confirmar P0301–P030x',
      'Velas e bobinas',
      'Pressão de combustível',
      'Vazamento de vácuo / ar falso',
      'Compressão se elétrico/combustível OK',
    ],
  },
  P0301: {
    title: 'Falha de combustão — cilindro 1',
    meaning: 'Misfire detectado no cilindro 1.',
    checks: ['Bobina/vela cil. 1', 'Injetor 1', 'Compressão cil. 1', 'Cabos/conectores'],
  },
  P0302: {
    title: 'Falha de combustão — cilindro 2',
    meaning: 'Misfire detectado no cilindro 2.',
    checks: ['Bobina/vela cil. 2', 'Injetor 2', 'Compressão cil. 2'],
  },
  P0303: {
    title: 'Falha de combustão — cilindro 3',
    meaning: 'Misfire detectado no cilindro 3.',
    checks: ['Bobina/vela cil. 3', 'Injetor 3', 'Compressão cil. 3'],
  },
  P0304: {
    title: 'Falha de combustão — cilindro 4',
    meaning: 'Misfire detectado no cilindro 4.',
    checks: ['Bobina/vela cil. 4', 'Injetor 4', 'Compressão cil. 4'],
  },
  P0171: {
    title: 'Sistema muito pobre (banco 1)',
    meaning: 'Mistura ar/combustível magra no banco 1 — excesso de ar ou falta de combustível.',
    checks: ['Vazamento de admissão', 'MAF/MAP', 'Pressão combustível', 'Sonda lambda'],
  },
  P0172: {
    title: 'Sistema muito rico (banco 1)',
    meaning: 'Mistura rica no banco 1.',
    checks: ['Injetores vazando', 'Sensor MAF', 'Pressão combustível alta', 'Filtro de ar'],
  },
  P0174: {
    title: 'Sistema muito pobre (banco 2)',
    meaning: 'Mistura magra no banco 2.',
    checks: ['Vazamento admissão banco 2', 'MAF', 'Pressão combustível', 'Sonda banco 2'],
  },
  P0175: {
    title: 'Sistema muito rico (banco 2)',
    meaning: 'Mistura rica no banco 2.',
    checks: ['Injetores banco 2', 'MAF', 'Pressão combustível'],
  },
  P0420: {
    title: 'Eficiência do catalisador abaixo do limite (banco 1)',
    meaning: 'O monitor de catalisador indica baixa eficiência no banco 1.',
    checks: ['Sondas antes/depois', 'Fugas de escape', 'Catalisador', 'Misfire prévio'],
  },
  P0430: {
    title: 'Eficiência do catalisador abaixo do limite (banco 2)',
    meaning: 'Baixa eficiência do catalisador no banco 2.',
    checks: ['Sondas banco 2', 'Fugas de escape', 'Catalisador banco 2'],
  },
  P0130: {
    title: 'Circuito da sonda de O2 (banco 1, sensor 1)',
    meaning: 'Falha no circuito da sonda lambda pré-catalisador banco 1.',
    checks: ['Conector e chicote da sonda', 'Tensão de aquecimento', 'Scanner live data'],
  },
  P0135: {
    title: 'Aquecedor da sonda O2 (banco 1, sensor 1)',
    meaning: 'Circuito do aquecedor da sonda pré-cat com falha.',
    checks: ['Resistência do aquecedor', 'Fusível/alimentação', 'Chicote'],
  },
  P0141: {
    title: 'Aquecedor da sonda O2 (banco 1, sensor 2)',
    meaning: 'Falha no aquecedor da sonda pós-catalisador.',
    checks: ['Resistência do aquecedor', 'Alimentação', 'Chicote'],
  },
  P0128: {
    title: 'Termostato — temperatura abaixo da regulagem',
    meaning: 'Motor demora a atingir temperatura de trabalho.',
    checks: ['Termostato', 'Sensor ECT', 'Nível de arrefecimento'],
  },
  P0113: {
    title: 'Sensor IAT — circuito alto',
    meaning: 'Sinal do sensor de temperatura do ar de admissão fora da faixa (alto).',
    checks: ['Conector IAT', 'Resistência do sensor', 'Chicote'],
  },
  P0101: {
    title: 'MAF — faixa/desempenho',
    meaning: 'Fluxo de ar medido inconsistente com o esperado.',
    checks: ['Limpeza MAF', 'Vazamentos pós-MAF', 'Filtro de ar'],
  },
  P0102: {
    title: 'MAF — circuito baixo',
    meaning: 'Sinal do medidor de fluxo de ar muito baixo.',
    checks: ['Conector MAF', 'Alimentação 5V/12V', 'Obstrução filtro'],
  },
  P0401: {
    title: 'Fluxo EGR insuficiente',
    meaning: 'Sistema de recirculação de gases com fluxo abaixo do esperado.',
    checks: ['Válvula EGR', 'Passagens carbonizadas', 'Sensor posição EGR'],
  },
  P0442: {
    title: 'EVAP — vazamento pequeno',
    meaning: 'Sistema de evaporação detectou pequeno vazamento.',
    checks: ['Tampa do tanque', 'Mangueiras EVAP', 'Canister/purga'],
  },
  P0455: {
    title: 'EVAP — vazamento grande',
    meaning: 'Vazamento significativo no sistema de evaporação.',
    checks: ['Tampa do tanque', 'Linhas EVAP', 'Válvula de purga'],
  },
  P0500: {
    title: 'Sensor de velocidade do veículo',
    meaning: 'Sinal de velocidade inconsistente ou ausente.',
    checks: ['Sensor VSS', 'Chicote', 'ABS / módulo de velocidade'],
  },
  P0507: {
    title: 'RPM de marcha lenta acima do esperado',
    meaning: 'Controle de idle não mantém rotação na faixa.',
    checks: ['Corpo de borboleta', 'Vazamento de vácuo', 'IAC/ETB'],
  },
  P0700: {
    title: 'Sistema de controle da transmissão',
    meaning: 'Há falha no TCM — ler códigos específicos da transmissão.',
    checks: ['Códigos do TCM', 'Nível/estado ATF', 'Conectores TCM'],
  },
  P0720: {
    title: 'Sensor de velocidade de saída da transmissão',
    meaning: 'Sinal do sensor de saída inconsistente.',
    checks: ['Sensor OSS', 'Chicote', 'Anel relutor'],
  },
  P0011: {
    title: 'Árvore de comando — avanço excessivo (banco 1)',
    meaning: 'Sistema VVT/VANOS com posicionamento avançado demais.',
    checks: ['Óleo e filtro', 'Solenoide VVT', 'Corrente/corrente de comando'],
  },
  P0014: {
    title: 'Árvore de comando escape — avanço excessivo (banco 1)',
    meaning: 'VVT de escape fora da faixa.',
    checks: ['Solenoide VVT escape', 'Pressão de óleo', 'Faseamento'],
  },
  P0325: {
    title: 'Sensor de detonação (banco 1)',
    meaning: 'Circuito do sensor de knock com falha.',
    checks: ['Conector knock', 'Torque de fixação do sensor', 'Chicote'],
  },
  P0335: {
    title: 'Sensor de rotação do virabrequim',
    meaning: 'Sinal CKP ausente ou irregular.',
    checks: ['Sensor CKP', 'Folga do sensor', 'Anel fônico / chicote'],
  },
  P0340: {
    title: 'Sensor de fase do comando',
    meaning: 'Sinal CMP ausente ou irregular.',
    checks: ['Sensor CMP', 'Conector', 'Sincronismo'],
  },
  P0351: {
    title: 'Bobina de ignição A — circuito primário/secundário',
    meaning: 'Falha no circuito da bobina do cilindro 1 (ou circuito A).',
    checks: ['Bobina', 'Alimentação e massa', 'ECM driver'],
  },
  P0400: {
    title: 'Fluxo EGR',
    meaning: 'Anomalia geral no fluxo de recirculação de gases.',
    checks: ['Válvula EGR', 'Carbonização', 'Sensores EGR'],
  },
  P0480: {
    title: 'Controle da ventoinha 1',
    meaning: 'Circuito da ventoinha de arrefecimento com falha.',
    checks: ['Relé/fusível', 'Motor da ventoinha', 'Módulo de comando'],
  },
  P0505: {
    title: 'Sistema de controle de marcha lenta',
    meaning: 'Idle control fora de faixa.',
    checks: ['Corpo de borboleta', 'IAC', 'Vazamentos de ar'],
  },
  P0562: {
    title: 'Tensão do sistema baixa',
    meaning: 'Tensão da bateria/alternador abaixo do esperado.',
    checks: ['Bateria', 'Alternador', 'Maus contatos de massa'],
  },
  P0606: {
    title: 'Processador do ECM/PCM',
    meaning: 'Falha interna do módulo de controle do motor.',
    checks: ['Alimentação/massa ECM', 'Atualização de software', 'Substituição se confirmado'],
  },
  P1130: {
    title: 'Adaptação da sonda / A/F (específico OEM)',
    meaning: 'Código frequentemente OEM (Toyota e outros) relacionado a adaptação de mistura.',
    checks: ['Sonda A/F', 'Adaptações', 'Vazamentos de admissão'],
  },
  P2181: {
    title: 'Desempenho do sistema de arrefecimento',
    meaning: 'Sistema de cooling fora da faixa esperada.',
    checks: ['Termostato', 'Radiador/ventoinha', 'Sensor ECT'],
  },
  C0035: {
    title: 'Sensor de velocidade roda dianteira esquerda',
    meaning: 'Circuito ABS da roda DE com falha.',
    checks: ['Sensor ABS DE', 'Anel fônico', 'Chicote ABS'],
  },
  C0040: {
    title: 'Sensor de velocidade roda dianteira direita',
    meaning: 'Circuito ABS da roda DD.',
    checks: ['Sensor ABS DD', 'Anel fônico', 'Chicote'],
  },
  U0100: {
    title: 'Perda de comunicação com ECM/PCM',
    meaning: 'Módulo do motor não responde na rede.',
    checks: ['Alimentação/massa ECM', 'Rede CAN', 'Scanner em outros módulos'],
  },
  U0101: {
    title: 'Perda de comunicação com TCM',
    meaning: 'Módulo da transmissão offline na rede.',
    checks: ['Rede CAN', 'Alimentação TCM', 'Conectores'],
  },
  U0121: {
    title: 'Perda de comunicação com módulo ABS',
    meaning: 'ABS não comunica.',
    checks: ['Fusíveis ABS', 'Alimentação módulo', 'Rede CAN'],
  },
  B0001: {
    title: 'Airbag motorista — estágio 1',
    meaning: 'Circuito de disparo do airbag do motorista (SRS).',
    checks: ['Scanner SRS', 'Não medir resistência do airbag sem procedimento'],
  },
};

function parseRemoteList(data: unknown): Map<string, string> {
  const map = new Map<string, string>();
  if (!Array.isArray(data)) return map;
  for (const row of data as RemoteRow[]) {
    const code = String(row.Code || row.code || '')
      .toUpperCase()
      .replace(/\/SAE$/i, '')
      .trim();
    const desc = String(row.Description || row.description || '').trim();
    if (/^[PCBU][0-9A-F]{4}$/i.test(code) && desc) {
      map.set(code, desc);
    }
  }
  return map;
}

async function ensureRemoteLoaded(): Promise<void> {
  if (remotePt && remoteEn) return;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 12000);
    try {
      const [ptRes, enRes] = await Promise.all([
        fetch(
          'https://raw.githubusercontent.com/fabiovila/OBDIICodes/master/Codigos-ptbr.json',
          { signal: ctrl.signal, headers: { Accept: 'application/json' } }
        ),
        fetch('https://raw.githubusercontent.com/fabiovila/OBDIICodes/master/codes.json', {
          signal: ctrl.signal,
          headers: { Accept: 'application/json' },
        }),
      ]);
      if (ptRes.ok) {
        remotePt = parseRemoteList(await ptRes.json());
      } else {
        remotePt = remotePt || new Map();
      }
      if (enRes.ok) {
        remoteEn = parseRemoteList(await enRes.json());
      } else {
        remoteEn = remoteEn || new Map();
      }
    } catch (err) {
      console.warn('[obdDatabase] remote load failed', err);
      remotePt = remotePt || new Map();
      remoteEn = remoteEn || new Map();
    } finally {
      clearTimeout(timer);
    }
  })();

  return loadPromise;
}

export function lookupLocalObd(code: string): ObdEntry | null {
  const c = code.toUpperCase().trim();
  const row = LOCAL[c];
  if (!row) return null;
  return {
    code: c,
    title: row.title,
    meaning: row.meaning,
    checks: row.checks,
    family: familyOf(c),
    source: 'local',
  };
}

/**
 * Lookup completo: local → PT remoto → EN remoto.
 */
export async function lookupObdCode(code: string): Promise<ObdEntry | null> {
  const c = (code || '').toUpperCase().trim();
  if (!/^[PCBU][0-9A-F]{4}$/.test(c)) return null;

  const local = lookupLocalObd(c);
  if (local) return local;

  await ensureRemoteLoaded();

  const pt = remotePt?.get(c);
  if (pt) {
    return {
      code: c,
      title: pt,
      meaning: pt,
      checks: defaultChecks(c),
      family: familyOf(c),
      source: 'obd-pt',
    };
  }

  const en = remoteEn?.get(c);
  if (en) {
    return {
      code: c,
      title: en,
      meaning: en,
      checks: defaultChecks(c),
      family: familyOf(c),
      source: 'obd-en',
    };
  }

  return null;
}

export function extractObdCodes(text: string): string[] {
  const found = new Set<string>();
  const re = /\b([PCBU][0-9A-F]{4})\b/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text || ''))) {
    found.add(m[1].toUpperCase());
  }
  return Array.from(found).slice(0, 8);
}

export async function getObdStats(): Promise<{ local: number; pt: number; en: number }> {
  await ensureRemoteLoaded();
  return {
    local: Object.keys(LOCAL).length,
    pt: remotePt?.size || 0,
    en: remoteEn?.size || 0,
  };
}
