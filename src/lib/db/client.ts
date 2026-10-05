import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Postgres connection used by every server component and server action.
 *
 * `prepare: false` keeps the driver safe for pooled/serverless connections
 * (Neon, Supabase, PgBouncer) where prepared statements are not supported.
 * The client is created once per server process and reused.
 */

const url = process.env.DATABASE_URL?.trim();

/** True when a Postgres connection string is available. */
export function isDatabaseConfigured(): boolean {
  return Boolean(url);
}

type Database = ReturnType<typeof drizzle<typeof schema>>;

let cached: Database | null = null;
let cachedSql: ReturnType<typeof postgres> | null = null;

export function getSql() {
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Add your Postgres connection string in Settings → Environment, then run `bun run db:setup` to create the schema and seed the demo data.",
    );
  }
  if (!cachedSql) {
    cachedSql = postgres(url, {
      max: Number(process.env.DATABASE_POOL_MAX ?? 5),
      idle_timeout: 20,
      connect_timeout: 10,
      prepare: false,
    });
  }
  return cachedSql;
}

export function getDb(): Database {
  if (!cached) cached = drizzle(getSql(), { schema });
  return cached;
}

export { schema };