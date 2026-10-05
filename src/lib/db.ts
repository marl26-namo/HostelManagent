import fs from "node:fs";
import path from "node:path";
import { buildSeed } from "./seed";
import type { Db } from "./types";

const DATA_DIR = path.join(process.cwd(), ".data");
const DB_PATH = path.join(DATA_DIR, "db.json");

function persist(db: Db): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf8");
}

/** Read the JSON-backed data store, seeding it on first run. */
export function readDb(): Db {
  if (fs.existsSync(DB_PATH)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(DB_PATH, "utf8")) as Db;
      if (parsed && Array.isArray(parsed.users) && Array.isArray(parsed.rooms)) return parsed;
    } catch {
      // corrupted file — reseed below
    }
  }
  const seeded = buildSeed();
  persist(seeded);
  return seeded;
}

export function writeDb(db: Db): void {
  persist(db);
}
