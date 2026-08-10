"use server";

import { processOcrWithGemini, ProcessedPrescription } from "@/lib/ocr/gemini";

export async function processPrescriptionWithAI(rawOcr: string) {
  if (!process.env.GEMINI_API_KEY) {
    // Return mock data for MVP if API key is not set
    return {
      success: true,
      data: {
        corrected_text: rawOcr + "\n\n(Mocked Correction)",
        summary: "Patient presents with mock symptoms, prescribed mock medication.",
        medicines: [
          { name: "Paracetamol", dosage: "500mg", frequency: "1-1-1" },
          { name: "Amoxicillin", dosage: "250mg", frequency: "1-0-1" }
        ],
        important_findings: ["Fever observed"],
        tags: ["Mock", "Fever"]
      } as ProcessedPrescription
    };
  }

  try {
    const processed = await processOcrWithGemini(rawOcr);
    return { success: true, data: processed };
  } catch (error) {
    console.error("AI processing failed:", error);
    return { success: false, error: "Failed to process text with AI." };
  }
}
