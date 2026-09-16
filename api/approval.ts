/**
 * Aprovação locadora/seguradora — Postgres se DATABASE_URL, senão memória.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  createApproval,
  decide,
  getById,
  getByToken,
  listRecent,
  healthPostgres,
  type ApprovalRequest,
} from './_lib/approvalStore';
import { authFromRequest } from './_lib/authTokens';
import { publishFeedEvent } from './_lib/realtimeStore';
import { isPostgresEnabled } from './_lib/pg';

function publicBase(req: VercelRequest): string {
  const host = (req.headers['x-forwarded-host'] as string) || req.headers.host || 'heniza.vercel.app';
  const proto = (req.headers['x-forwarded-proto'] as string) || 'https';
  return `${proto}://${host}`;
}

function escapeHtml(s: string): string {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function htmlPage(row: ApprovalRequest, base: string): string {
  const pending = row.status === 'pending';
  const items = (row.budgetItems || [])
    .map(
      (i) =>
        `<li style="margin:4px 0">${escapeHtml(i.item)} — <b>R$ ${Number(i.estimatedCost).toFixed(2)}</b></li>`
    )
    .join('');
  const total =
    row.budgetTotal != null
      ? row.budgetTotal
      : (row.budgetItems || []).reduce((s, i) => s + Number(i.estimatedCost || 0), 0);

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Aprovação OficIA — ${escapeHtml(row.plate)}</title>
<style>
  body{font-family:system-ui,sans-serif;background:#0b1220;color:#e2e8f0;margin:0;padding:24px}
  .card{max-width:520px;margin:0 auto;background:#111827;border:1px solid #1e293b;border-radius:16px;padding:20px}
  h1{font-size:18px;margin:0 0 8px}
  .muted{color:#94a3b8;font-size:13px}
  .total{font-size:22px;font-weight:800;color:#34d399;margin:12px 0}
  .status{display:inline-block;padding:4px 10px;border-radius:999px;font-size:12px;font-weight:700}
  .pending{background:#422006;color:#fcd34d}
  .approved{background:#064e3b;color:#6ee7b7}
  .rejected{background:#450a0a;color:#fca5a5}
  .expired{background:#1e293b;color:#94a3b8}
  button{width:100%;padding:12px;border:0;border-radius:12px;font-weight:800;cursor:pointer;margin-top:8px}
  .ok{background:#10b981;color:#052e16}
  .no{background:#7f1d1d;color:#fecaca}
  textarea{width:100%;min-height:72px;border-radius:10px;border:1px solid #334155;background:#0f172a;color:#e2e8f0;padding:10px;box-sizing:border-box}
  input{width:100%;padding:10px;border-radius:10px;border:1px solid #334155;background:#0f172a;color:#e2e8f0;box-sizing:border-box;margin:6px 0}
</style>
</head>
<body>
<div class="card">
  <h1>Aprovação de serviço — OficIA / HENIZA</h1>
  <p class="muted">${escapeHtml(row.vehicleLabel)} · Placa <b>${escapeHtml(row.plate)}</b></p>
  <p><span class="status ${row.status}">${row.status.toUpperCase()}</span></p>
  <p><b>${escapeHtml(row.problemName || 'Diagnóstico')}</b></p>
  <p class="muted">${escapeHtml((row.diagnosticNotes || '').slice(0, 400))}</p>
  <ul style="padding-left:18px;font-size:14px">${items || '<li class="muted">Sem itens detalhados</li>'}</ul>
  <div class="total">Total estimado: R$ ${Number(total).toFixed(2)}</div>
  ${
    pending
      ? `<form method="POST" action="${base}/api/approval">
    <input type="hidden" name="token" value="${escapeHtml(row.token)}"/>
    <label class="muted">Seu nome / setor</label>
    <input name="decidedBy" placeholder="Ex.: Frota Locadora XPTO"/>
    <label class="muted">Observação</label>
    <textarea name="note" placeholder="Opcional"></textarea>
    <button class="ok" name="action" value="approve" type="submit">Aprovar orçamento</button>
    <button class="no" name="action" value="reject" type="submit">Recusar</button>
  </form>`
      : `<p class="muted">Decisão em ${escapeHtml(row.updatedAt)}${row.decidedBy ? ' por ' + escapeHtml(row.decidedBy) : ''}. ${escapeHtml(row.decisionNote || '')}</p>`
  }
  <p class="muted" style="margin-top:16px">Link válido até ${escapeHtml(row.expiresAt)}. Persistência: ${isPostgresEnabled() ? 'Postgres' : 'memória'}.</p>
</div>
</body></html>`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const base = publicBase(req);

  if (req.method === 'GET') {
    if (String(req.query.health || '') === '1') {
      const h = await healthPostgres();
      return res.status(h.ok ? 200 : 503).json({ ok: h.ok, ...h, postgresConfigured: isPostgresEnabled() });
    }

    const token = String(req.query.token || '');
    const id = String(req.query.id || '');
    const list = String(req.query.list || '') === '1';

    if (token) {
      const row = await getByToken(token);
      if (!row) {
        res.status(404).setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.send('<p style="font-family:sans-serif">Pedido não encontrado ou expirado.</p>');
      }
      res.status(200).setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(htmlPage(row, base));
    }

    if (list) {
      const user = authFromRequest(req);
      if (!user) return res.status(401).json({ ok: false, error: 'Login online necessário' });
      return res.status(200).json({ ok: true, items: await listRecent(50), mode: isPostgresEnabled() ? 'postgres' : 'memory' });
    }

    if (id) {
      const row = await getById(id);
      if (!row) return res.status(404).json({ ok: false, error: 'not found' });
      return res.status(200).json({ ok: true, item: row });
    }

    return res.status(400).json({ ok: false, error: 'token ou id obrigatório' });
  }

  if (req.method === 'POST') {
    let body: any = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        body = Object.fromEntries(new URLSearchParams(body));
      }
    }
    body = body || {};

    if (body.token && (body.action === 'approve' || body.action === 'reject')) {
      const decision = body.action === 'approve' ? 'approved' : 'rejected';
      const row = await decide(String(body.token), decision, body.note, body.decidedBy);
      if (!row) {
        res.status(404).setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.send('<p>Pedido não encontrado.</p>');
      }
      try {
        publishFeedEvent({
          type: 'approval',
          plate: row.plate,
          chassis: row.chassis,
          caseId: row.caseId,
          title: `Aprovação ${row.status}: ${row.plate}`,
          body: row.decisionNote || row.problemName,
          authorName: row.decidedBy,
        });
      } catch {
        /* */
      }
      res.status(200).setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(htmlPage(row, base));
    }

    if (body.action === 'create' || body.create) {
      const user = authFromRequest(req);
      const row = await createApproval({
        caseId: body.caseId,
        plate: String(body.plate || 'SEM-PLACA').toUpperCase(),
        chassis: body.chassis ? String(body.chassis).toUpperCase() : undefined,
        vehicleLabel: String(body.vehicleLabel || 'Veículo'),
        workshop: body.workshop || user?.workshop,
        problemName: body.problemName,
        diagnosticNotes: body.diagnosticNotes,
        budgetTotal: body.budgetTotal != null ? Number(body.budgetTotal) : undefined,
        budgetItems: Array.isArray(body.budgetItems) ? body.budgetItems : undefined,
        requesterName: body.requesterName || user?.name,
        ttlHours: body.ttlHours != null ? Number(body.ttlHours) : 72,
      });
      const url = `${base}/api/approval?token=${row.token}`;
      try {
        publishFeedEvent({
          type: 'approval',
          plate: row.plate,
          chassis: row.chassis,
          caseId: row.caseId,
          title: `Aguardando aprovação: ${row.plate}`,
          body: row.problemName,
          authorName: row.requesterName,
        });
      } catch {
        /* */
      }
      return res.status(200).json({
        ok: true,
        item: row,
        url,
        storage: isPostgresEnabled() ? 'postgres' : 'memory',
      });
    }

    if (body.token && body.decision) {
      const decision = body.decision === 'approved' ? 'approved' : 'rejected';
      const row = await decide(String(body.token), decision, body.note, body.decidedBy);
      if (!row) return res.status(404).json({ ok: false, error: 'not found' });
      return res.status(200).json({ ok: true, item: row });
    }

    return res.status(400).json({ ok: false, error: 'ação inválida' });
  }

  return res.status(405).json({ ok: false, error: 'Method not allowed' });
}
