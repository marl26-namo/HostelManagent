import fs from "node:fs";
import path from "node:path";
import { buildSeed } from "./seed";
import { isDatabaseConfigured } from "./db/client";
import { loadSnapshot } from "./db/store";
import type { Db } from "./types";

const DATA_DIR = path.join(process.cwd(), ".data");
const DB_PATH = path.join(DATA_DIR, "db.json");

/**
 * Data source for the whole application.
 *
 * Postgres (Drizzle ORM) is the store whenever `DATABASE_URL` is configured, which
 * is how the app runs in development against your database and in production on
 * hosting. The local JSON file store below is only a development fallback so the
 * app is still usable before the connection string is provided.
 */
export function usingPostgres(): boolean {
  return isDatabaseConfigured();
}

export async function readDb(): Promise<Db> {
  if (isDatabaseConfigured()) return loadSnapshot();
  return readJsonStore();
}

function readJsonStore(): Db {
  if (fs.existsSync(DB_PATH)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(DB_PATH, "utf8")) as Db;
      if (parsed && Array.isArray(parsed.users) && Array.isArray(parsed.rooms)) return parsed;
    } catch {
      // corrupted file — reseed below
    }
  }
  const seeded = buildSeed();
  writeJsonStore(seeded);
  return seeded;
}

function writeJsonStore(db: Db): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf8");
}

/**
 * Apply a mutation to the local JSON fallback store. With Postgres configured this
 * is a no-op and the caller must have written through Drizzle instead.
 */
export async function updateJsonStore(mutate: (db: Db) => void): Promise<void> {
  if (isDatabaseConfigured()) return;
  const db = readJsonStore();
  mutate(db);
  writeJsonStore(db);
}