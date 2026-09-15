import type { VercelRequest, VercelResponse } from '@vercel/node';
import { APP_SYSTEM_META, SYSTEM_UPDATE_CAMPAIGNS } from './_lib/systemUpdates.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const hasGemini = Boolean(process.env.GEMINI_API_KEY);
  const hasOlp = Boolean(process.env.OPEN_LABOR_API_KEY);

  return res.status(200).json({
    ok: true,
    app: APP_SYSTEM_META,
    health: {
      gemini: hasGemini,
      openLabor: hasOlp,
      timestamp: new Date().toISOString(),
    },
    capabilities: {
      liveObd: true,
      faultEngine: true,
      preventiveMaintenance: true,
      systemUpdates: true,
      temperatureSensors: true,
      networkSearch: true,
    },
    systemUpdateCatalogSize: SYSTEM_UPDATE_CAMPAIGNS.length,
    updateGuidance: {
      app: 'PWA: feche e reabra a aba ou use “Atualizar app” no módulo para limpar cache.',
      vehicle:
        'Atualização de centrais exige scanner/OEM, tensão estável e campanha oficial — o OficIA só orienta.',
    },
  });
}
