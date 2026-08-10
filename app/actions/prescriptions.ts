"use server";

import { db } from "@/db";
import { prescriptions } from "@/db/schema";
import { revalidatePath } from "next/cache";

type Medicine = {
  name: string;
  dosage: string;
  frequency: string;
};

type SavePrescriptionData = {
  patientId: string;
  imageUrl?: string;
  rawOcr: string;
  correctedText: string;
  summary: string;
  medicines: Medicine[];
  tags?: string[];
  important?: boolean;
  doctorNotes?: string;
};

export async function savePrescription(data: SavePrescriptionData) {
  if (!process.env.DATABASE_URL) {
    return { success: false, error: "Database not configured" };
  }
  
  try {
    const [newPrescription] = await db.insert(prescriptions).values({
      patientId: data.patientId,
      imageUrl: data.imageUrl || "placeholder-image-url", // MVP placeholder since we aren't uploading to S3
      rawOcr: data.rawOcr,
      correctedText: data.correctedText,
      aiSummary: data.summary,
      medicinesJson: data.medicines,
      tags: data.tags || [],
      important: data.important || false,
      doctorNotes: data.doctorNotes || "",
    }).returning();
    
    revalidatePath("/patients");
    revalidatePath(`/patients/${data.patientId}`);
    revalidatePath("/dashboard");
    
    return { success: true, data: newPrescription };
  } catch (error) {
    console.error("Failed to save prescription:", error);
    return { success: false, error: "Failed to save prescription to database." };
  }
}
