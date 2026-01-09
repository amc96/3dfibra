import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

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

export const db = drizzle(pool, { schema });
