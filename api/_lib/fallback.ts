export function resolveAutomotiveFaultKnowledge(
  query: string,
  plate = '',
  chassis = '',
  make = '',
  model = '',
  isEvAlternative = false
): Record<string, unknown> {
  const full = `${query} ${make} ${model} ${chassis}`.toLowerCase();
  const isEv =
    isEvAlternative ||
    /byd|dolphin|gwm|ora|el[eé]tric|bateria|isolamento|doip|hvil/.test(full);

  if (isEv) {
    return {
      codeType: 'DIAGNOSTICO_EV_ALTA_TENSAO',
      codeTypeLabel: 'Protocolo Alternativo EV (DoIP / Onboard)',
      originBadge: 'DIAGNÓSTICO ALTERNATIVO VEÍCULO ELÉTRICO (EV/DoIP)',
      originExplanation:
        'Scanners OBD2 convencionais falham em muitos EVs por SGW/CAN-FD/DoIP. Rota alternativa aplicada.',
      problemName: `${make || 'EV'} ${model || ''} — Diagnóstico de Alta Tensão`.trim(),
      supplierCategory: 'BMS / Inversor / Alta Tensão',
      severity: 'Alta',
      source: 'Base técnica local HENIZA / OficIA',
      diagnosticNotes:
        '1. Menu de engenharia na multimídia.\n2. Isolamento > 500 kΩ @ 500V DC.\n3. HVIL e bateria 12V auxiliar.',
      resetProcedure:
        '1. Negativo 12V.\n2. MSD laranja com EPI 1000V.\n3. Aguardar 10 min.\n4. Reconectar e religar.',
      correctiveChecklist: [
        'Medir isolamento HV',
        'Checar ΔV de células',
        'Testar HVIL',
        'Validar 12V auxiliar',
      ],
      preventiveChecklist: [
        'Carga AC completa semanal (calibração BMS)',
        'Inspecionar cabos HV',
      ],
      budgetItems: [
        { item: 'Diagnóstico EV / DoIP', category: 'Mão de Obra', estimatedCost: 450 },
      ],
      suggestedBestPractices: ['Luva isolante 1000V Classe 0 (NR-10).'],
    };
  }

  const isPanel = /\b\d{1,3}\b/.test(query) && !/\b[pcbu]\d{4}\b/i.test(query);

  return {
    codeType: isPanel ? 'PAINEL_INSTRUMENTOS' : 'SCANNER_OBD2',
    codeTypeLabel: isPanel
      ? 'Código de painel (DIC) — não é scanner'
      : 'Diagnóstico técnico OBD2 / sintoma',
    originBadge: isPanel
      ? 'PAINEL DE INSTRUMENTOS (2 DÍGITOS) — NÃO É SCANNER'
      : 'LAUDO TÉCNICO MULTIMODAL',
    originExplanation: isPanel
      ? 'Código curto de odômetro/painel, não DTC de scanner.'
      : 'Correlação com manuais de oficina e sintomas relatados.',
    problemName: `${make} ${model} — ${query.slice(0, 60) || 'Análise de falha'}`.trim(),
    supplierCategory: 'Powertrain / Elétrica',
    severity: 'Média',
    source: 'Base técnica local HENIZA / OficIA',
    diagnosticNotes:
      'Análise preliminar. Validar com scanner e medições de tensão/resistência.',
    resetProcedure: 'Seguir manual da montadora para reset/adaptação.',
    correctiveChecklist: [
      'Ler códigos OBD2/UDS',
      'Inspecionar conectores e massa',
      'Medir tensão de bateria',
    ],
    preventiveChecklist: ['Manutenção conforme manual do fabricante'],
    budgetItems: [
      { item: 'Diagnóstico eletrônico', category: 'Mão de Obra', estimatedCost: 180 },
    ],
    suggestedBestPractices: ['Registrar placa, chassi, fotos e áudio do sintoma.'],
    plate,
    chassis,
  };
}
