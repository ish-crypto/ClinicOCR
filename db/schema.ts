import { pgTable, text, integer, timestamp, boolean, json, uuid } from "drizzle-orm/pg-core";

export const patients = pgTable("patients", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  age: integer("age").notNull(),
  gender: text("gender").notNull(),
  phone: text("phone").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const prescriptions = pgTable("prescriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  patientId: uuid("patient_id")
    .notNull()
    .references(() => patients.id, { onDelete: "cascade" }),
  imageUrl: text("image_url").notNull(),
  rawOcr: text("raw_ocr").notNull(),
  correctedText: text("corrected_text").notNull(),
  aiSummary: text("ai_summary").notNull(),
  medicinesJson: json("medicines_json").notNull(),
  doctorNotes: text("doctor_notes"),
  tags: json("tags"),
  important: boolean("important").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
