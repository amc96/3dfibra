import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";
import * as schema from "@shared/schema";
import path from "path";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false
});
export const db = drizzle(pool, { schema });

// Auto-migrate on startup
(async () => {
  try {
    if (!process.env.DATABASE_URL) {
      console.warn("DATABASE_URL not set, skipping migrations");
      return;
    }
    console.log("Running migrations...");
    const migrationsPath = path.resolve(process.cwd(), "migrations");
    await migrate(db, { migrationsFolder: migrationsPath });
    console.log("Migrations completed.");
  } catch (err) {
    console.error("Migration failed:", err);
  }
})();
