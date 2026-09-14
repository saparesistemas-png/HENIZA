/**
 * Busca técnica na rede pública para o OficIA.
 * 1) APIs grátis: NHTSA (recalls/complaints/VIN) + DTC local (+ OLP se chave)
 * 2) Portais RMI/OEM curados (Europa — muitos pagos)
 * 3) Gemini + Google Search grounding (YouTube, engenharia, web)
 */

import { gatherPublicTechnicalData } from './publicTechnicalApis';

export type NetworkHit = {
  title: string;
  url?: string;
  snippet: string;
  kind: string;
};

export type NetworkSearchResult = {
  summary: string;
  sources: string[];
  hits: NetworkHit[];
  queries: string[];
  grounded: boolean;
};

type SearchInput = {
  description?: string;
  make?: string;
  model?: string;
  chassis?: string;
  isEv?: boolean;
};

function extractCode(text: string): string | null {
  const m = text.match(/\b([PCBU]\d{4})\b/i);
  return m ? m[1].toUpperCase() : null;
}

function buildQueries(input: SearchInput): string[] {
  const desc = (input.description || '').trim();
  const make = (input.make || '').trim();
  const model = (input.model || '').trim();
  const code = extractCode(desc);
  const base = [make, model, code || desc.slice(0, 80)].filter(Boolean).join(' ');
  const queries = [
    `${base} diagnostic repair procedure`,
    `${base} TSB technical service bulletin`,
    `${code || base} site:youtube.com diagnosis`,
    `${base} workshop manual OR service manual Europe OR RMI`,
  ];
  if (input.isEv || /ev|hybrid|bms|doip|hvil/i.test(desc + make + model)) {
    queries.push(`${make} ${model} high voltage isolation BMS diagnosis`);
  }
  return queries.filter(Boolean).slice(0, 5);
}

export function curatedTechnicalPortals(make?: string): NetworkHit[] {
  const m = (make || '').toLowerCase();
  const hits: NetworkHit[] = [
    {
      title: 'NHTSA — recalls e comunicações (EUA, público)',
      url: 'https://www.nhtsa.gov/recalls',
      snippet: 'Base pública de recalls e manufacturer communications.',
      kind: 'tsb',
    },
    {
      title: 'Open Labor Project — DTC',
      url: 'https://openlaborproject.com/eu/dtc-codes/',
      snippet: 'Códigos OBD-II e dados auxiliares (API com chave opcional).',
      kind: 'web',
    },
  ];

  if (/volkswagen|vw|audi|seat|skoda|cupra/.test(m)) {
    hits.push({
      title: 'Volkswagen Group erWin (RMI Europa — licença)',
      url: 'https://erwin.vwgroup-datahub.com',
      snippet: 'Portal oficial RMI — acesso pago/regulamentado para oficinas.',
      kind: 'oem',
    });
  }
  if (/bmw|mini/.test(m)) {
    hits.push({
      title: 'BMW AOS (RMI Europa — licença)',
      url: 'https://aos.bmwgroup.com',
      snippet: 'Informação oficial BMW Group.',
      kind: 'oem',
    });
  }
  if (/toyota|lexus/.test(m)) {
    hits.push({
      title: 'Toyota Tech Europe (RMI)',
      url: 'https://www.toyota-tech.eu',
      snippet: 'Portal técnico Toyota Europa.',
      kind: 'oem',
    });
  }
  if (/ford/.test(m)) {
    hits.push({
      title: 'Ford Service Info Europa',
      url: 'https://www.fordserviceinfo.com/',
      snippet: 'Portal oficial Ford Europa.',
      kind: 'oem',
    });
  }
  if (/renault|dacia/.test(m)) {
    hits.push({
      title: 'Renault Dialogys / RMI',
      url: 'https://newdialogys.renault.com',
      snippet: 'Portal técnico Renault Group.',
      kind: 'oem',
    });
  }
  if (/hyundai|kia/.test(m)) {
    hits.push({
      title: 'Hyundai Service Europe',
      url: 'https://service.hyundai-motor.com',
      snippet: 'Portal de serviço Hyundai Europa.',
      kind: 'oem',
    });
  }
  if (/mercedes|benz/.test(m)) {
    hits.push({
      title: 'Mercedes-Benz service info',
      url: 'https://service-info.mercedes-benz-trucks.com',
      snippet: 'Acesso controlado / licença.',
      kind: 'oem',
    });
  }
  if (/peugeot|citroen|citroën|opel|ds/.test(m)) {
    hits.push({
      title: 'Stellantis Service Box (parcial público)',
      url: 'https://public.servicebox.peugeot.com',
      snippet: 'Manuais de utilização e parte da info técnica Stellantis.',
      kind: 'manual',
    });
  }
  return hits;
}

function extractGroundingSources(response: any): NetworkHit[] {
  const hits: NetworkHit[] = [];
  try {
    const meta =
      response?.candidates?.[0]?.groundingMetadata || response?.groundingMetadata || {};
    const chunks = meta.groundingChunks || [];
    for (const ch of chunks) {
      const web = ch.web || ch.retrievedContext || {};
      const uri = web.uri || web.url;
      const title = web.title || 'Fonte web';
      if (!uri && !title) continue;
      let kind = 'web';
      const u = String(uri || '').toLowerCase();
      if (u.includes('youtube')) kind = 'youtube';
      else if (u.includes('facebook')) kind = 'forum';
      else if (/nhtsa|tsb|bulletin/.test(u + title.toLowerCase())) kind = 'tsb';
      else if (/erwin|techinfo|rmi/.test(u)) kind = 'oem';
      hits.push({ title, url: uri, snippet: web.snippet || title, kind });
    }
  } catch {
    /* ignore */
  }
  return hits.slice(0, 10);
}

async function geminiGroundedSummary(
  input: SearchInput,
  apiKey: string,
  queries: string[],
  publicBlock: string
): Promise<{ text: string; hits: NetworkHit[] } | null> {
  try {
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey });
    const code = extractCode(input.description || '') || '';
    const prompt = [
      'Você é pesquisador técnico automotivo para oficinas no Brasil.',
      'Com base na EVIDÊNCIA PÚBLICA abaixo e na busca web, resuma soluções reais.',
      'Português, máx. 8 frases curtas. Não invente manual grátis se for pago.',
      '',
      'EVIDÊNCIA PÚBLICA (NHTSA / DTC):',
      publicBlock,
      '',
      `Marca: ${input.make || 'N/I'} | Modelo: ${input.model || 'N/I'}`,
      `Chassi: ${input.chassis || 'N/I'}`,
      `Código/sintoma: ${code || input.description || 'N/I'}`,
      `Consultas: ${queries.join(' | ')}`,
    ].join('\n');

    for (const model of ['gemini-2.5-flash', 'gemini-2.0-flash']) {
      try {
        const response: any = await ai.models.generateContent({
          model,
          contents: prompt,
          config: { tools: [{ googleSearch: {} }], temperature: 0.2 },
        });
        const text =
          response.text ||
          response.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '').join('') ||
          '';
        if (text?.trim()) {
          return { text: text.trim(), hits: extractGroundingSources(response) };
        }
      } catch (err: any) {
        console.error('[networkSearch] grounding', model, err?.message || err);
      }
    }
  } catch (err) {
    console.error('[networkSearch] gemini', err);
  }
  return null;
}

/**
 * Pipeline completo de rede — sempre tenta APIs públicas; grounding se houver chave.
 */
export async function searchTechnicalNetwork(
  input: SearchInput,
  apiKey?: string
): Promise<NetworkSearchResult> {
  const queries = buildQueries(input);
  const curated = curatedTechnicalPortals(input.make);

  // 1) Fontes públicas estruturadas (sem chave)
  let publicBundle;
  try {
    publicBundle = await gatherPublicTechnicalData({
      description: input.description,
      make: input.make,
      model: input.model,
      chassis: input.chassis,
    });
  } catch (err) {
    console.error('[networkSearch] public APIs', err);
    publicBundle = {
      summaryLines: ['APIs públicas indisponíveis nesta execução.'],
      hits: [] as NetworkHit[],
      sources: [] as string[],
    };
  }

  const publicHits: NetworkHit[] = (publicBundle.hits || []).map((h) => ({
    title: h.title,
    url: h.url,
    snippet: h.snippet,
    kind: h.kind,
  }));

  const publicBlock = (publicBundle.summaryLines || []).join('\n');

  // 2) Grounding Gemini (opcional)
  let groundedText = '';
  let groundedHits: NetworkHit[] = [];
  let grounded = false;
  if (apiKey) {
    const g = await geminiGroundedSummary(input, apiKey, queries, publicBlock);
    if (g) {
      groundedText = g.text;
      groundedHits = g.hits;
      grounded = true;
    }
  }

  const summary = [
    publicBlock,
    groundedText ? '\n---\nBusca web:\n' + groundedText : '',
  ]
    .filter(Boolean)
    .join('\n')
    .trim();

  const hits = [...publicHits, ...groundedHits, ...curated].slice(0, 18);
  const sources = Array.from(
    new Set([
      ...(publicBundle.sources || []),
      ...hits.map((h) => (h.url ? `${h.title} — ${h.url}` : h.title)),
    ])
  ).slice(0, 16);

  return {
    summary:
      summary ||
      'Use o checklist local. Consulte NHTSA e portais RMI da montadora quando necessário.',
    sources,
    hits,
    queries,
    grounded,
  };
}

export function mergeNetworkIntoDiagnosis(
  diagnosis: Record<string, unknown>,
  network: NetworkSearchResult
): Record<string, unknown> {
  return {
    ...diagnosis,
    networkNotes: network.summary,
    networkSources: network.sources,
    networkHits: network.hits,
    networkQueries: network.queries,
    networkGrounded: network.grounded,
    originExplanation:
      (diagnosis.originExplanation as string) ||
      'Cruzamento entre laudo da IA e evidências públicas (NHTSA, DTC, rede).',
  };
}
