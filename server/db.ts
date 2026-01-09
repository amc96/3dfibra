import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";
import path from "path";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.warn(
    "DATABASE_URL must be set. Please provision a database in your environment.",
  );
}

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL || "",
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export const db = drizzle(pool, { schema });

// Auto-migrate on startup
(async () => {
  try {
    if (!process.env.DATABASE_URL) {
      console.warn("DATABASE_URL not set, skipping migrations");
      return;
    }
    
    // In production/Railway, migrations might be handled externally
    // We only try to migrate if the folder exists and has content
    const migrationsPath = path.resolve(process.cwd(), "migrations");
    
    // Check if the directory exists first to avoid crashes in environments without it
    const fs = await import("fs");
    if (fs.existsSync(migrationsPath) && fs.existsSync(path.join(migrationsPath, "meta", "_journal.json"))) {
      console.log("Running migrations...");
      const { migrate } = await import("drizzle-orm/node-postgres/migrator");
      await migrate(db, { migrationsFolder: migrationsPath });
      console.log("Migrations completed.");
    } else {
      console.log("No migration files found or journal missing, skipping auto-migration.");
    }
  } catch (err) {
    console.error("Migration failed:", err);
  }
})();
