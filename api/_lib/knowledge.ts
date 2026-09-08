import { Pool } from 'pg';

const pool = process.env.DATABASE_URL ? new Pool({ connectionString: process.env.DATABASE_URL, max: 3 }) : null;

export type KnowledgeEntry = {
  id: string;
  title: string;
  content: string;
  source_type: string;
  source_url: string | null;
  author_name: string | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  tags: string[];
};

export async function getApprovedKnowledge(make: string, model: string): Promise<KnowledgeEntry[]> {
  if (!pool) return [];
  try {
    const result = await pool.query<KnowledgeEntry>(
      `SELECT id, title, content, source_type, source_url, author_name, vehicle_make, vehicle_model, tags
       FROM public.technical_knowledge
       WHERE status = 'approved'
         AND (vehicle_make IS NULL OR lower(vehicle_make) = lower($1))
         AND (vehicle_model IS NULL OR lower(vehicle_model) = lower($2))
       ORDER BY reviewed_at DESC NULLS LAST, created_at DESC
       LIMIT 12`,
      [make || '', model || '']
    );
    return result.rows;
  } catch (error) {
    console.warn('[knowledge] approved context unavailable', error);
    return [];
  }
}

export async function createKnowledgeEntry(input: Omit<KnowledgeEntry, 'id' | 'tags'> & { tags?: string[] }) {
  if (!pool) throw new Error('DATABASE_URL não configurada');
  const result = await pool.query(
    `INSERT INTO public.technical_knowledge
      (title, content, source_type, source_url, author_name, vehicle_make, vehicle_model, tags, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
     RETURNING id, title, status, created_at`,
    [input.title, input.content, input.source_type, input.source_url, input.author_name, input.vehicle_make, input.vehicle_model, input.tags ?? []]
  );
  return result.rows[0];
}

export async function reviewKnowledgeEntry(id: string, status: 'approved' | 'rejected', reviewerId?: string, notes?: string) {
  if (!pool) throw new Error('DATABASE_URL não configurada');
  const result = await pool.query(
    `UPDATE public.technical_knowledge
     SET status = $2, reviewed_by = $3, review_notes = $4, reviewed_at = now()
     WHERE id = $1
     RETURNING id, status, reviewed_at`,
    [id, status, reviewerId ?? null, notes ?? null]
  );
  return result.rows[0] ?? null;
}

export async function listKnowledge(status?: string) {
  if (!pool) return [];
  const values = status ? [status] : [];
  const result = await pool.query(
    `SELECT id, title, content, source_type, source_url, author_name, vehicle_make, vehicle_model, tags, status, review_notes, created_at, reviewed_at
     FROM public.technical_knowledge
     ${status ? 'WHERE status = $1' : ''}
     ORDER BY created_at DESC LIMIT 100`,
    values
  );
  return result.rows;
}

export async function addKnowledgeSource(input: { knowledgeId: string; citation: string; url?: string; publisher?: string; excerpt?: string; reliability?: string }) {
  if (!pool) throw new Error('DATABASE_URL não configurada');
  const result = await pool.query(
    `INSERT INTO public.technical_knowledge_sources (knowledge_id, citation, url, publisher, excerpt, reliability)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, knowledge_id`,
    [input.knowledgeId, input.citation, input.url ?? null, input.publisher ?? null, input.excerpt ?? null, input.reliability ?? 'unverified']
  );
  return result.rows[0];
}

export function formatKnowledgeForPrompt(entries: KnowledgeEntry[]) {
  if (!entries.length) return 'Nenhum conhecimento interno aprovado foi encontrado.';
  return entries.map((entry, index) => {
    const source = [entry.source_type, entry.author_name, entry.source_url].filter(Boolean).join(' | ');
    return `[${index + 1}] ${entry.title}\nFonte: ${source}\nConteúdo: ${entry.content}`;
  }).join('\n\n');
}

export async function closeKnowledgePool() {
  await pool?.end();
}
