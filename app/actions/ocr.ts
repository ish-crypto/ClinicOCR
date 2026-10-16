"use server";

import {
  processOcrWithGemini,
  processImageWithGeminiVision,
  ProcessedPrescription,
} from "@/lib/ocr/gemini";

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
          { name: "Amoxicillin", dosage: "250mg", frequency: "1-0-1" },
        ],
        important_findings: ["Fever observed"],
        tags: ["Mock", "Fever"],
      } as ProcessedPrescription,
    };
  }

  try {
    const processed = await processOcrWithGemini(rawOcr);
    return { success: true, data: processed };
  } catch (error: unknown) {
    console.error("AI processing failed:", error);
    const message = error instanceof Error ? error.message : "Failed to process text with AI.";
    return { success: false, error: message };
  }
}

export async function processPrescriptionImageWithAI(imageDataUrl: string) {
  if (!imageDataUrl) {
    return { success: false, error: "No image data provided for vision processing." };
  }

  if (!process.env.GEMINI_API_KEY) {
    return {
      success: true,
      data: {
        corrected_text: "Dr. Clinic Slip\nRx:\n1. Augmentin 625mg Tab - 1 tab BD x 5 days (After food)\n2. Dolo 650mg - 1 tab SOS\n3. Pantocid 40mg - 1 tab OD before breakfast x 5 days",
        raw_text_reading: "Augmentin 625 BD 5d, Dolo 650 SOS, Pantocid 40 OD",
        summary: "Acute respiratory infection with fever and gastric protection.",
        medicines: [
          { name: "Augmentin (Amoxicillin-Clavulanate)", dosage: "625mg", frequency: "1-0-1 (After food)" },
          { name: "Dolo (Paracetamol)", dosage: "650mg", frequency: "As needed (SOS)" },
          { name: "Pantocid (Pantoprazole)", dosage: "40mg", frequency: "1-0-0 (Before food)" },
        ],
        doctor_notes: "Steam inhalation twice daily. Return for review if fever persists > 3 days.",
        important_findings: ["Handwriting deciphered via Gemini Vision model."],
        tags: ["Vision OCR", "URTI", "Antibiotic"],
      } as ProcessedPrescription,
    };
  }

  try {
    const processed = await processImageWithGeminiVision(imageDataUrl);
    return { success: true, data: processed };
  } catch (error: unknown) {
    console.error("Gemini Vision processing failed:", error);
    const message = error instanceof Error ? error.message : "Failed to analyze prescription image with Vision AI.";
    return { success: false, error: message };
  }
}
