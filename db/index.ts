import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Use a dummy URL if DATABASE_URL is not provided so the app can still build and run UI
const databaseUrl = process.env.DATABASE_URL || "postgres://dummy:dummy@dummy/dummy";
const sql = neon(databaseUrl);
export const db = drizzle(sql, { schema });
