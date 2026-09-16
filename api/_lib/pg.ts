/**
 * Pool Postgres compartilhado (Vercel / serverless).
 * Usa DATABASE_URL_2 como origem preferencial, com fallbacks compatíveis.
 */
import type { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

declare global {
  // eslint-disable-next-line no-var
  var __henizaPgPool: Pool | undefined;
}

export function getDatabaseUrl(): string | null {
  return (
    process.env.DATABASE_URL_2 ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    null
  );
}

export function isPostgresEnabled(): boolean {
  return Boolean(getDatabaseUrl());
}

export async function getPool(): Promise<Pool | null> {
  const url = getDatabaseUrl();
  if (!url) return null;

  if (global.__henizaPgPool) return global.__henizaPgPool;

  const { Pool: PgPool } = await import('pg');
  const pool = new PgPool({
    connectionString: url,
    ssl: url.includes('localhost') || url.includes('127.0.0.1')
      ? false
      : { rejectUnauthorized: false },
    max: 3,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 8_000,
  });
  global.__henizaPgPool = pool;
  return pool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T> | null> {
  const pool = await getPool();
  if (!pool) return null;
  return pool.query<T>(text, params);
}

export async function withClient<T>(fn: (c: PoolClient) => Promise<T>): Promise<T | null> {
  const pool = await getPool();
  if (!pool) return null;
  const client = await pool.connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}
