import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";
import path from "path";
import fs from "fs";

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;

if (!connectionString) {
  console.error("DATABASE_URL (or POSTGRES_URL) must be set. Exiting.");
  process.exit(1);
}

export const pool = new Pool({
  connectionString,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle DB client:", err);
});

export const db = drizzle(pool, { schema });

// Run migrations on startup if migrations folder is present
export async function runMigrations(): Promise<void> {
  const migrationsPath = path.resolve(process.cwd(), "migrations");
  if (
    fs.existsSync(migrationsPath) &&
    fs.existsSync(path.join(migrationsPath, "meta", "_journal.json"))
  ) {
    console.log("Running database migrations...");
    const { migrate } = await import("drizzle-orm/node-postgres/migrator");
    await migrate(db, { migrationsFolder: migrationsPath });
    console.log("Migrations completed.");
  } else {
    console.log("No migration files found — skipping auto-migration.");
  }
}
