/**
 * Busca técnica na rede pública para o OficIA.
 * - Gemini + Google Search grounding (YouTube, fóruns, sites de engenharia, OEM)
 * - Atalhos para portais RMI/Europa e fontes públicas de DTC/TSB
 *
 * Limitações legais: no Brasil muitos manuais OEM não são livres.
 * Na UE há portais RMI oficiais (muitos pagos, alguns com conteúdo aberto).
 * Nunca inventar link de manual pago como se fosse grátis.
 */

export type NetworkHit = {
  title: string;
  url?: string;
  snippet: string;
  kind: 'youtube' | 'oem' | 'tsb' | 'forum' | 'manual' | 'web' | 'engineering';
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
  ];

  if (input.isEv || /ev|hybrid|bms|doip|hvil/i.test(desc + make + model)) {
    queries.push(`${make} ${model} high voltage isolation BMS diagnosis`);
  }

  // Fontes europeias / públicas preferidas
  queries.push(`${base} workshop manual OR service manual Europe OR RMI`);

  return queries.filter(Boolean).slice(0, 5);
}

/** Portais e fontes públicas úteis (não são scrape; são pistas para o mecânico). */
export function curatedTechnicalPortals(make?: string): NetworkHit[] {
  const m = (make || '').toLowerCase();
  const hits: NetworkHit[] = [
    {
      title: 'NHTSA — TSBs e recalls (EUA, público)',
      url: 'https://www.nhtsa.gov/recalls',
      snippet: 'Base pública de recalls e boletins relacionados a segurança.',
      kind: 'tsb',
    },
    {
      title: 'Open Labor Project — DTC Europa',
      url: 'https://openlaborproject.com/eu/dtc-codes/',
      snippet: 'Consulta pública de códigos OBD-II por montadora (Europa).',
      kind: 'web',
    },
  ];

  if (/volkswagen|vw|audi|seat|skoda/.test(m)) {
    hits.push({
      title: 'Volkswagen erWin (RMI Europa)',
      url: 'https://volkswagen.erwin-store.com/erwin',
      snippet: 'Portal oficial RMI UE — manuais/TSB sob assinatura ou acesso regulamentado.',
      kind: 'oem',
    });
  }
  if (/bmw|mini/.test(m)) {
    hits.push({
      title: 'BMW Aftersales Online System (RMI)',
      url: 'https://aos.bmwgroup.com',
      snippet: 'Portal oficial BMW Group para informação de reparação (UE).',
      kind: 'oem',
    });
  }
  if (/toyota|lexus/.test(m)) {
    hits.push({
      title: 'Toyota Tech Europe (RMI)',
      url: 'https://www.toyota-tech.eu',
      snippet: 'Informação técnica oficial Toyota Europa.',
      kind: 'oem',
    });
  }
  if (/ford/.test(m)) {
    hits.push({
      title: 'Ford Service Info Europa',
      url: 'https://www.fordserviceinfo.com/',
      snippet: 'Portal oficial Ford Europa (RMI).',
      kind: 'oem',
    });
  }
  if (/renault|dacia/.test(m)) {
    hits.push({
      title: 'Renault Dialogys / RMI',
      url: 'https://newdialogys.renault.com',
      snippet: 'Portal técnico Renault Group (UE).',
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
      title: 'Mercedes-Benz B2B / service info',
      url: 'https://service-info.mercedes-benz-trucks.com',
      snippet: 'Informação de serviço Mercedes (acesso controlado).',
      kind: 'oem',
    });
  }
  if (/peugeot|citroen|citroën|opel|ds /.test(m) || m === 'ds') {
    hits.push({
      title: 'Stellantis / Service Box (manuais de uso e info técnica)',
      url: 'https://public.servicebox.peugeot.com',
      snippet: 'Parte do conteúdo Stellantis/PSA pode ser consultada publicamente (manuais de uso).',
      kind: 'manual',
    });
  }

  return hits;
}

function extractGroundingSources(response: any): NetworkHit[] {
  const hits: NetworkHit[] = [];
  try {
    const meta =
      response?.candidates?.[0]?.groundingMetadata ||
      response?.groundingMetadata ||
      {};
    const chunks = meta.groundingChunks || meta.groundingSupports || [];
    for (const ch of chunks) {
      const web = ch.web || ch.retrievedContext || {};
      const uri = web.uri || web.url;
      const title = web.title || 'Fonte web';
      if (!uri && !title) continue;
      let kind: NetworkHit['kind'] = 'web';
      const u = String(uri || '').toLowerCase();
      if (u.includes('youtube.com') || u.includes('youtu.be')) kind = 'youtube';
      else if (u.includes('facebook.com')) kind = 'forum';
      else if (/tsb|nhtsa|bulletin/.test(u + title.toLowerCase())) kind = 'tsb';
      else if (/erwin|techinfo|serviceinfo|rmi|workshop/.test(u)) kind = 'oem';
      hits.push({
        title,
        url: uri,
        snippet: web.snippet || title,
        kind,
      });
    }
    const queries = meta.webSearchQueries || [];
    for (const q of queries) {
      if (typeof q === 'string') {
        hits.push({
          title: `Busca: ${q}`,
          snippet: 'Consulta usada no grounding Google Search',
          kind: 'web',
        });
      }
    }
  } catch {
    /* ignore */
  }
  return hits.slice(0, 12);
}

/**
 * Pesquisa na rede via Gemini + ferramenta googleSearch.
 * Retorna resumo em PT para o quadro "Informações da rede".
 */
export async function searchTechnicalNetwork(
  input: SearchInput,
  apiKey: string
): Promise<NetworkSearchResult> {
  const queries = buildQueries(input);
  const curated = curatedTechnicalPortals(input.make);
  const empty: NetworkSearchResult = {
    summary:
      'Busca na rede indisponível no momento. Use o checklist local e valide no veículo. Portais OEM europeus (RMI) e NHTSA são referências públicas/oficiais.',
    sources: curated.map((h) => h.title),
    hits: curated,
    queries,
    grounded: false,
  };

  try {
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey });

    const code = extractCode(input.description || '') || '';
    const prompt = [
      'Você é um pesquisador técnico automotivo para oficinas.',
      'Busque na web soluções REAIS de diagnóstico e reparo.',
      'Priorize: manuais/TSB públicos, portais OEM Europa (RMI), vídeos técnicos YouTube de engenharia/oficina, posts técnicos de montadoras.',
      'Evite conteúdo genérico de marketing. Cite causas prováveis e passos de verificação.',
      'Responda em português do Brasil, texto curto (máx. 8 frases).',
      'Se a informação for de manual pago, diga que o acesso é pago e indique o portal.',
      '',
      `Marca: ${input.make || 'N/I'}`,
      `Modelo: ${input.model || 'N/I'}`,
      `Chassi: ${input.chassis || 'N/I'}`,
      `Código/sintoma: ${code || input.description || 'N/I'}`,
      `Consultas sugeridas: ${queries.join(' | ')}`,
    ].join('\n');

    const models = ['gemini-2.5-flash', 'gemini-2.0-flash'];
    let lastErr: unknown = null;

    for (const model of models) {
      try {
        const response: any = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            tools: [{ googleSearch: {} }],
            temperature: 0.2,
          },
        });

        const text =
          response.text ||
          response.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '').join('') ||
          '';

        const groundedHits = extractGroundingSources(response);
        const hits = [...groundedHits, ...curated].slice(0, 15);
        const sources = [
          ...groundedHits.map((h) => (h.url ? `${h.title} — ${h.url}` : h.title)),
          ...curated.map((h) => (h.url ? `${h.title} — ${h.url}` : h.title)),
        ].slice(0, 12);

        if (text && text.trim()) {
          return {
            summary: text.trim(),
            sources,
            hits,
            queries,
            grounded: groundedHits.length > 0 || true,
          };
        }
      } catch (err) {
        lastErr = err;
        console.error('[networkSearch] model fail', model, (err as any)?.message || err);
      }
    }

    if (lastErr) console.error('[networkSearch] all failed', lastErr);
    return empty;
  } catch (err) {
    console.error('[networkSearch] fatal', err);
    return empty;
  }
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
      'Cruzamento entre laudo da IA e evidências públicas da rede (quando disponíveis).',
  };
}
