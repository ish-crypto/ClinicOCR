import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;

const sql = neon(
  databaseUrl && !databaseUrl.includes("dummy")
    ? databaseUrl
    : "postgresql://user:pass@localhost:5432/dummy"
);

export const db = drizzle(sql, { schema });
