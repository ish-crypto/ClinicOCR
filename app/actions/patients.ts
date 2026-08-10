"use server";

import { db } from "@/db";
import { patients } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const patientSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  age: z.coerce.number().min(0).max(150),
  gender: z.string().min(1, "Gender is required"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
});

export async function createPatient(data: z.infer<typeof patientSchema>) {
  if (!process.env.DATABASE_URL) {
    return { success: false, error: "Database not configured" };
  }
  
  try {
    const validated = patientSchema.parse(data);
    const [newPatient] = await db.insert(patients).values(validated).returning();
    revalidatePath("/patients");
    return { success: true, data: newPatient };
  } catch (error) {
    console.error("Failed to create patient:", error);
    return { success: false, error: "Failed to create patient. Please check the inputs." };
  }
}

export async function updatePatient(id: string, data: z.infer<typeof patientSchema>) {
  if (!process.env.DATABASE_URL) {
    return { success: false, error: "Database not configured" };
  }
  
  try {
    const validated = patientSchema.parse(data);
    await db.update(patients).set(validated).where(eq(patients.id, id));
    revalidatePath("/patients");
    revalidatePath(`/patients/${id}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to update patient:", error);
    return { success: false, error: "Failed to update patient." };
  }
}

export async function deletePatient(id: string) {
  if (!process.env.DATABASE_URL) {
    return { success: false, error: "Database not configured" };
  }
  
  try {
    await db.delete(patients).where(eq(patients.id, id));
    revalidatePath("/patients");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete patient:", error);
    return { success: false, error: "Failed to delete patient." };
  }
}
