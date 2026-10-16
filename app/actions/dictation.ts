"use server";

import {
  processVoiceDictationWithGemini,
  ProcessedDictation,
} from "@/lib/dictation/gemini";

export async function processVoiceDictationAction(transcript: string) {
  if (!transcript || !transcript.trim()) {
    return { success: false, error: "Dictation transcript is empty." };
  }

  if (!process.env.GEMINI_API_KEY) {
    // Return realistic mocked structured data for development/offline mode
    const mockProcessed: ProcessedDictation = {
      corrected_text: transcript + "\n\n(Processed via Clinical Voice AI)",
      summary: "Patient presents with acute upper respiratory tract infection with mild fever.",
      symptoms: ["Cough", "Sore throat", "Low-grade fever"],
      vitals: {
        bp: "120/80 mmHg",
        pulse: "78 bpm",
        temp: "99.2 F",
        weight: null,
      },
      medicines: [
        {
          name: "Amoxicillin-Clavulanate (Augmentin)",
          dosage: "625mg",
          frequency: "Twice daily (1-0-1)",
          duration: "5 days",
          instructions: "Take after meals with plenty of water",
        },
        {
          name: "Paracetamol",
          dosage: "650mg",
          frequency: "As needed (SOS)",
          duration: "3 days",
          instructions: "Take for fever > 100°F, max 3 times daily",
        },
        {
          name: "Levocetirizine",
          dosage: "5mg",
          frequency: "Once daily at bedtime (0-0-1)",
          duration: "5 days",
          instructions: "May cause mild drowsiness",
        },
      ],
      doctor_advice: "Warm saline gargles 3 times daily. Steam inhalation twice a day. Avoid cold liquids. Return for review in 5 days if fever persists.",
      important_findings: ["Chest clear on auscultation, throat mildly congested."],
      tags: ["URTI", "Fever", "Antibiotic", "Voice Entry"],
    };

    return {
      success: true,
      data: mockProcessed,
    };
  }

  try {
    const processed = await processVoiceDictationWithGemini(transcript);
    return { success: true, data: processed };
  } catch (error: unknown) {
    console.error("Voice dictation AI processing failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to parse dictation with AI.";
    return { success: false, error: message };
  }
}
