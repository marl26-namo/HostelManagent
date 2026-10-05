/**
 * Creates the Postgres schema (runs the Drizzle migrations in ./drizzle) and seeds
 * the MUBAS demo data.
 *
 *   bun run db:setup
 *
 * Requires DATABASE_URL in the environment.
 */
import path from "node:path";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { getDb, isDatabaseConfigured } from "../src/lib/db/client";
import { seedPostgres } from "../src/lib/db/seed-postgres";

async function main() {
  if (!isDatabaseConfigured()) {
    console.error(
      "DATABASE_URL is not set. Add your Postgres connection string in Settings → Environment (or .env.local) and run this command again.",
    );
    process.exit(1);
  }

  const db = getDb();
  await migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
  console.log("Migrations applied.");

  const seeded = await seedPostgres();
  console.log(seeded ? "Demo data seeded." : "Database already contains data — seeding skipped.");
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});