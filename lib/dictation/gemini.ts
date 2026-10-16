import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const DICTATION_PROMPT = `
You are an expert clinical AI medical scribe and transcription assistant.
I am providing you with a raw voice dictation/transcript spoken by a physician during a patient consultation.

Your task is to convert this spoken dictation into structured, standard medical prescription data.

Format and interpret spoken clinical phrases:
- Translate medical abbreviations into clean clinical terms (e.g., "od" -> "Once daily", "bd/bid" -> "Twice daily (1-0-1)", "tid/tds" -> "Thrice daily (1-1-1)", "qid" -> "Four times daily", "sos/prn" -> "As needed (SOS)", "hs" -> "At bedtime", "ac" -> "Before food", "pc" -> "After food", "stat" -> "Immediately").
- Extract clear medicines with Name, Dosage (e.g. 500mg), Frequency (e.g. 1-0-1 After food), Duration (e.g. 5 days), and Special Instructions (e.g. Drink plenty of water).
- Identify patient symptoms, clinical diagnosis, vital signs (if mentioned), doctor advice, and clinical tags.

Expected JSON output format:
{
  "corrected_text": "Clean, professionally formatted full transcript of the doctor's consultation notes",
  "summary": "Concise 1-2 sentence clinical diagnosis and management summary",
  "symptoms": ["Symptom 1", "Symptom 2"],
  "vitals": {
    "bp": "120/80 mmHg or null",
    "pulse": "72 bpm or null",
    "temp": "98.6 F or null",
    "weight": "70 kg or null"
  },
  "medicines": [
    {
      "name": "Medicine Name",
      "dosage": "Dosage (e.g. 500mg, 1 tablet, 5ml)",
      "frequency": "Frequency & Timing (e.g. 1-0-1 After food / Twice daily)",
      "duration": "Duration (e.g. 5 days, 1 week)",
      "instructions": "Specific instructions (e.g. Take with warm water)"
    }
  ],
  "doctor_advice": "Non-pharmacological advice, dietary precautions, follow-up schedule",
  "important_findings": ["Key finding or red flag warning"],
  "tags": ["Diagnosis/Category Tag", "Tag2"]
}

Rules:
1. Do not invent unmentioned medications.
2. Standardize medicine generic/brand names properly with correct capitalization (e.g. "Amoxicillin-Clavulanate 625mg", "Paracetamol 650mg").
3. If unclear medicine is spoken, prefix with "Possibly ".
4. Return ONLY valid JSON matching the schema above.

Spoken Dictation Transcript:
`;

export type StructuredDictatedMedicine = {
  name: string;
  dosage: string;
  frequency: string;
  duration?: string;
  instructions?: string;
};

export type ProcessedDictation = {
  corrected_text: string;
  summary: string;
  symptoms?: string[];
  vitals?: {
    bp?: string | null;
    pulse?: string | null;
    temp?: string | null;
    weight?: string | null;
  };
  medicines: StructuredDictatedMedicine[];
  doctor_advice?: string;
  important_findings: string[];
  tags: string[];
};

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function processVoiceDictationWithGemini(
  transcript: string
): Promise<ProcessedDictation> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured in .env");
  }

  const models = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-flash-latest"];
  const maxRetries = 2;
  let lastError: unknown = null;

  for (const model of models) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: DICTATION_PROMPT + "\n" + transcript,
          config: {
            responseMimeType: "application/json",
          },
        });

        if (!response.text) {
          throw new Error("Empty response received from Gemini AI.");
        }

        const result = JSON.parse(response.text) as ProcessedDictation;
        return result;
      } catch (error: unknown) {
        lastError = error;
        console.warn(`[Gemini Dictation] Model ${model} attempt ${attempt} failed:`, error);
        if (attempt < maxRetries) {
          await sleep(1200 * attempt);
        }
      }
    }
  }

  console.error("Gemini Dictation Processing Error:", lastError);
  throw new Error("Gemini AI was unable to parse the dictation. Please check your API key and retry.");
}
