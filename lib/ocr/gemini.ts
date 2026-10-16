import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const GEMINI_TEXT_PROMPT = `
You are an expert medical AI assistant. I am providing you with the raw OCR output extracted from a handwritten medical prescription.

Your task is to correct any OCR errors, format the text logically, extract medicines, generate a summary, and identify important findings.

Expected JSON output format:
{
  "corrected_text": "Full corrected text of the prescription",
  "summary": "A concise 1-2 sentence summary of the diagnosis or main treatment",
  "medicines": [
    {
      "name": "Medicine Name",
      "dosage": "Dosage (e.g., 500mg)",
      "frequency": "Frequency (e.g., 1-0-1 or Twice daily)"
    }
  ],
  "important_findings": ["Finding 1", "Finding 2"],
  "tags": ["Tag1", "Tag2"]
}

Rules:
1. Never hallucinate missing information. If dosage or frequency is missing, leave it as an empty string.
2. Preserve uncertain text as best as possible.
3. Prefix unclear medicine names with "Possibly ".
4. Generate tags (e.g., Fever, Antibiotic, Pediatric) based on the context.
5. Return ONLY valid JSON matching the schema above.

Raw OCR Output:
`;

const GEMINI_VISION_PROMPT = `
You are a world-class clinical AI medical vision specialist deciphering handwritten medical prescriptions, clinic slips, and doctor notes.

Inspect the provided prescription image closely:
1. Read the doctor's handwriting, clinic letterhead, patient symptoms, clinical diagnosis, and Rx instructions.
2. Extract all prescribed medicines with precise generic/brand name, dosage/strength (e.g. 500mg, 10ml), frequency/timing (e.g. 1-0-1, OD, BD, TID, QID, SOS, After food, At bedtime), and instructions.
3. Generate a complete, faithful transcript of the visible text in "corrected_text".
4. Provide a raw verbatim reading of the handwriting in "raw_text_reading".
5. Summarize the diagnosis and treatment plan in 1-2 sentences in "summary".
6. Extract key clinical findings, warnings, or dietary advice in "important_findings" and "doctor_notes".
7. Generate clinical category tags (e.g., "Antibiotic", "Pediatric", "Hypertension", "URTI", "Dermatology").

Expected JSON output format:
{
  "corrected_text": "Complete, cleanly formatted transcription of the entire prescription",
  "raw_text_reading": "Line-by-line verbatim reading of the visible text and handwriting",
  "summary": "Concise 1-2 sentence summary of diagnosis and clinical plan",
  "medicines": [
    {
      "name": "Medicine Brand or Generic Name",
      "dosage": "Dosage (e.g., 500mg, 1 tab)",
      "frequency": "Frequency (e.g., 1-0-1 After food / Twice daily)"
    }
  ],
  "doctor_notes": "Advice, dietary restrictions, follow-up instructions",
  "important_findings": ["Key finding 1", "Key finding 2"],
  "tags": ["Category1", "Category2"]
}

Rules:
1. Do NOT hallucinate unwritten medications. If a medicine name is hard to read, write your best clinical reading and prefix with "Possibly ".
2. If dosage or frequency is not specified on the sheet, leave as empty string.
3. Standardize medicine names with proper capitalization.
4. Return ONLY valid JSON matching the schema above.
`;

export type ProcessedPrescription = {
  corrected_text: string;
  raw_text_reading?: string;
  summary: string;
  medicines: {
    name: string;
    dosage: string;
    frequency: string;
  }[];
  doctor_notes?: string;
  important_findings: string[];
  tags: string[];
};

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function processOcrWithGemini(rawOcr: string): Promise<ProcessedPrescription> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured in .env");
  }

  const models = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"];
  const maxRetries = 2;
  let lastError: unknown = null;

  for (const model of models) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: GEMINI_TEXT_PROMPT + "\n" + rawOcr,
          config: {
            responseMimeType: "application/json",
          },
        });

        if (!response.text) {
          throw new Error("Empty response received from Gemini AI.");
        }

        const result = JSON.parse(response.text) as ProcessedPrescription;
        return result;
      } catch (error: unknown) {
        lastError = error;
        console.warn(`[Gemini Text AI] Model ${model} attempt ${attempt} failed:`, error);
        // Fast-fail on auth errors — retrying won't help
        if (error instanceof Error) {
          const msg = error.message.toLowerCase();
          if (msg.includes("api key") || msg.includes("unauthorized") || msg.includes("401") || msg.includes("403") || msg.includes("invalid key")) {
            throw new Error("Gemini API key is invalid or unauthorized. Please check your GEMINI_API_KEY in .env.local — it should start with 'AIzaSy'.");
          }
        }
        if (attempt < maxRetries) {
          await sleep(1200 * attempt);
        }
      }
    }
  }

  console.error("Gemini AI Processing Error:", lastError);
  throw new Error("Gemini AI is temporarily busy. Please try clicking 'Process with AI' again.");
}

export async function processImageWithGeminiVision(
  base64DataUrl: string
): Promise<ProcessedPrescription> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured in .env");
  }

  // Parse mime type and base64 payload from data URL
  let mimeType = "image/jpeg";
  let base64Data = base64DataUrl;

  const match = base64DataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (match) {
    mimeType = match[1];
    base64Data = match[2];
  }

  const models = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"];
  const maxRetries = 2;
  let lastError: unknown = null;

  for (const model of models) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: [
            {
              role: "user",
              parts: [
                {
                  inlineData: {
                    mimeType,
                    data: base64Data,
                  },
                },
                {
                  text: GEMINI_VISION_PROMPT,
                },
              ],
            },
          ],
          config: {
            responseMimeType: "application/json",
          },
        });

        if (!response.text) {
          throw new Error("Empty response received from Gemini Vision AI.");
        }

        const result = JSON.parse(response.text) as ProcessedPrescription;
        return result;
      } catch (error: unknown) {
        lastError = error;
        console.warn(`[Gemini Vision AI] Model ${model} attempt ${attempt} failed:`, error);
        // Fast-fail on auth errors — retrying won't help
        if (error instanceof Error) {
          const msg = error.message.toLowerCase();
          if (msg.includes("api key") || msg.includes("unauthorized") || msg.includes("401") || msg.includes("403") || msg.includes("invalid key")) {
            throw new Error("Gemini API key is invalid or unauthorized. Please check your GEMINI_API_KEY in .env.local — it should start with 'AIzaSy'.");
          }
        }
        if (attempt < maxRetries) {
          await sleep(1500 * attempt);
        }
      }
    }
  }

  console.error("Gemini Vision AI Processing Error:", lastError);
  const errMsg = lastError instanceof Error ? lastError.message : String(lastError);
  throw new Error(
    errMsg.toLowerCase().includes("quota")
      ? "Gemini API quota exceeded. Please check your Google AI Studio usage limits."
      : "Gemini Vision could not process the image. Please retry or use a clearer, well-lit image."
  );
}
