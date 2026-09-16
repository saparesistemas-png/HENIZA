# Postgres — aprovações locadora (HENIZA)

## Variáveis na Vercel

Em **Project → Settings → Environment Variables** (Production + Preview):

| Variável | Exemplo |
|----------|---------|
| `DATABASE_URL` | `postgresql://user:pass@host:5432/db?sslmode=require` |

Aliases aceitos pelo código:

- `DATABASE_URL`
- `POSTGRES_URL` (Vercel Postgres)
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`

## Provedores comuns

1. **Neon** — criar projeto → copiar connection string → colar como `DATABASE_URL`
2. **Supabase** — Project Settings → Database → URI
3. **Vercel Postgres** — Storage → Create Database → env vars injetadas automaticamente
4. **Railway / Render** — Postgres add-on → `DATABASE_URL`

## Tabela (criada automaticamente)

Na primeira requisição de aprovação com Postgres ativo, o app executa:

```sql
CREATE TABLE IF NOT EXISTS heniza_approvals (
  id TEXT PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  case_id TEXT,
  plate TEXT NOT NULL,
  chassis TEXT,
  vehicle_label TEXT NOT NULL DEFAULT '',
  workshop TEXT,
  problem_name TEXT,
  diagnostic_notes TEXT,
  budget_total DOUBLE PRECISION,
  budget_items JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  decided_by TEXT,
  decision_note TEXT,
  requester_name TEXT
);
```

## Health check

```
GET https://seu-dominio.vercel.app/api/approval?health=1
```

Resposta esperada com DB:

```json
{ "ok": true, "mode": "postgres", "postgresConfigured": true }
```

Sem DB:

```json
{ "ok": true, "mode": "memory", "postgresConfigured": false }
```

## Comportamento

| Situação | Onde grava |
|----------|------------|
| `DATABASE_URL` definida e acessível | Postgres |
| Sem URL ou falha de conexão na criação | Fallback memória (dev) |

Links de aprovação (`?token=`) passam a sobreviver a cold start e múltiplas regiões quando o Postgres está ativo.
