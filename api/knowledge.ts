import type { VercelRequest, VercelResponse } from '@vercel/node';
import { addKnowledgeSource, createKnowledgeEntry, listKnowledge, reviewKnowledgeEntry } from './_lib/knowledge';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') return res.status(200).json({ ok: true, data: await listKnowledge(typeof req.query?.status === 'string' ? req.query.status : undefined) });
    if (req.method === 'POST') return res.status(201).json({ ok: true, data: await createKnowledgeEntry(req.body) });
    if (req.method === 'PATCH') {
      const { id, status, reviewerId, notes } = req.body ?? {};
      if (!id || !['approved', 'rejected'].includes(status)) return res.status(400).json({ ok: false, error: 'id e status válido são obrigatórios.' });
      return res.status(200).json({ ok: true, data: await reviewKnowledgeEntry(id, status, reviewerId, notes) });
    }
    if (req.method === 'PUT') {
      const { knowledgeId, citation, ...source } = req.body ?? {};
      if (!knowledgeId || !citation) return res.status(400).json({ ok: false, error: 'knowledgeId e citation são obrigatórios.' });
      return res.status(201).json({ ok: true, data: await addKnowledgeSource({ knowledgeId, citation, ...source }) });
    }
    res.setHeader('Allow', 'GET, POST, PATCH, PUT');
    return res.status(405).json({ ok: false, error: 'Método não permitido.' });
  } catch (error) {
    console.error('[knowledge]', error);
    return res.status(500).json({ ok: false, error: 'Não foi possível acessar a base técnica.' });
  }
}
