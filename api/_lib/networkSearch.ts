/**
 * Busca técnica na rede pública para o OficIA.
 * 1) NHTSA + DTC + OLP torque/labor (se chave)
 * 2) Portais RMI curados
 * 3) Gemini grounding (opcional)
 */

import { gatherPublicTechnicalData } from './publicTechnicalApis.js';

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
  torqueSpecs?: Array<{
    job?: string;
    component: string;
    nm?: number | null;
    lbFt?: number | null;
    angleDegrees?: number | null;
    isCritical?: boolean;
    notes?: string;
  }>;
  laborTimes?: Array<{ job: string; hours?: number; notes?: string }>;
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
  return [
    `${base} diagnostic repair procedure`,
    `${base} TSB technical service bulletin`,
    `${code || base} site:youtube.com diagnosis`,
    `${base} torque specs workshop`,
  ].filter(Boolean);
}

export function curatedTechnicalPortals(make?: string): NetworkHit[] {
  const m = (make || '').toLowerCase();
  const hits: NetworkHit[] = [
    {
      title: 'NHTSA — recalls (público)',
      url: 'https://www.nhtsa.gov/recalls',
      snippet: 'Recalls e manufacturer communications.',
      kind: 'tsb',
    },
    {
      title: 'Open Labor Project — DTC / torque / labor',
      url: 'https://openlaborproject.com/docs/api',
      snippet: 'Requer OPEN_LABOR_API_KEY na Vercel.',
      kind: 'web',
    },
  ];
  if (/volkswagen|vw|audi|seat|skoda|cupra/.test(m)) {
    hits.push({
      title: 'VW Group erWin (RMI — licença)',
      url: 'https://erwin.vwgroup-datahub.com',
      snippet: 'Portal oficial RMI Europa.',
      kind: 'oem',
    });
  }
  if (/bmw|mini/.test(m)) {
    hits.push({
      title: 'BMW AOS (RMI)',
      url: 'https://aos.bmwgroup.com',
      snippet: 'Informação oficial BMW.',
      kind: 'oem',
    });
  }
  if (/toyota|lexus/.test(m)) {
    hits.push({
      title: 'Toyota Tech Europe',
      url: 'https://www.toyota-tech.eu',
      snippet: 'Portal técnico Toyota EU.',
      kind: 'oem',
    });
  }
  if (/ford/.test(m)) {
    hits.push({
      title: 'Ford Service Info Europa',
      url: 'https://www.fordserviceinfo.com/',
      snippet: 'Portal oficial Ford EU.',
      kind: 'oem',
    });
  }
  return hits;
}

function extractGroundingSources(response: any): NetworkHit[] {
  const hits: NetworkHit[] = [];
  try {
    const meta =
      response?.candidates?.[0]?.groundingMetadata || response?.groundingMetadata || {};
    for (const ch of meta.groundingChunks || []) {
      const web = ch.web || {};
      const uri = web.uri || web.url;
      const title = web.title || 'Fonte web';
      if (!uri && !title) continue;
      hits.push({ title, url: uri, snippet: web.snippet || title, kind: 'web' });
    }
  } catch {
    /* ignore */
  }
  return hits.slice(0, 8);
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
    const prompt = [
      'Pesquisador técnico automotivo. Resuma em PT-BR (máx. 8 frases).',
      'Use a evidência pública. Não invente torque sem fonte.',
      '',
      'EVIDÊNCIA:',
      publicBlock,
      '',
      `Marca: ${input.make || 'N/I'} Modelo: ${input.model || 'N/I'}`,
      `Relato: ${input.description || 'N/I'}`,
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
        if (text?.trim()) return { text: text.trim(), hits: extractGroundingSources(response) };
      } catch (err: any) {
        console.error('[networkSearch] grounding', model, err?.message || err);
      }
    }
  } catch (err) {
    console.error('[networkSearch] gemini', err);
  }
  return null;
}

export async function searchTechnicalNetwork(
  input: SearchInput,
  apiKey?: string
): Promise<NetworkSearchResult> {
  const queries = buildQueries(input);
  const curated = curatedTechnicalPortals(input.make);

  let publicBundle: Awaited<ReturnType<typeof gatherPublicTechnicalData>>;
  try {
    publicBundle = await gatherPublicTechnicalData({
      description: input.description,
      make: input.make,
      model: input.model,
      chassis: input.chassis,
    });
  } catch (err) {
    console.error('[networkSearch] public', err);
    publicBundle = {
      summaryLines: ['APIs públicas indisponíveis.'],
      hits: [],
      sources: [],
    };
  }

  const publicHits: NetworkHit[] = (publicBundle.hits || []).map((h) => ({
    title: h.title,
    url: h.url,
    snippet: h.snippet,
    kind: h.kind,
  }));

  const publicBlock = (publicBundle.summaryLines || []).join('\n');

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

  const summary = [publicBlock, groundedText ? '\n---\nBusca web:\n' + groundedText : '']
    .filter(Boolean)
    .join('\n')
    .trim();

  const hits = [...publicHits, ...groundedHits, ...curated].slice(0, 20);
  const sources = Array.from(
    new Set([
      ...(publicBundle.sources || []),
      ...hits.map((h) => (h.url ? `${h.title} — ${h.url}` : h.title)),
    ])
  ).slice(0, 18);

  return {
    summary:
      summary ||
      'Sem evidência de rede. Configure OPEN_LABOR_API_KEY para torque e tempos OLP.',
    sources,
    hits,
    queries,
    grounded,
    torqueSpecs: publicBundle.torqueSpecs,
    laborTimes: publicBundle.laborTimes,
  };
}

export function mergeNetworkIntoDiagnosis(
  diagnosis: Record<string, unknown>,
  network: NetworkSearchResult
): Record<string, unknown> {
  const out: Record<string, unknown> = {
    ...diagnosis,
    networkNotes: network.summary,
    networkSources: network.sources,
    networkHits: network.hits,
    networkQueries: network.queries,
    networkGrounded: network.grounded,
    originExplanation:
      (diagnosis.originExplanation as string) ||
      'Cruzamento IA + fontes públicas (NHTSA, DTC, OLP torque/labor).',
  };

  if (network.torqueSpecs?.length) {
    out.torqueSpecs = network.torqueSpecs;
  }
  if (network.laborTimes?.length) {
    out.laborTimes = network.laborTimes;
    const existing = (diagnosis.budgetItems as any[]) || [];
    if (existing.length <= 2) {
      const laborItems = network.laborTimes.slice(0, 3).map((l) => ({
        item: l.job,
        category: 'Mão de Obra',
        estimatedCost: Math.round((l.hours || 1) * 180),
      }));
      out.budgetItems = [...laborItems, ...existing].slice(0, 6);
    }
  }

  return out;
}
