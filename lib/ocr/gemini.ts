import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const GEMINI_PROMPT = `
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

export type ProcessedPrescription = {
  corrected_text: string;
  summary: string;
  medicines: {
    name: string;
    dosage: string;
    frequency: string;
  }[];
  important_findings: string[];
  tags: string[];
};

export async function processOcrWithGemini(rawOcr: string): Promise<ProcessedPrescription> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: GEMINI_PROMPT + "\n" + rawOcr,
      config: {
        responseMimeType: "application/json",
      }
    });

    if (!response.text) {
      throw new Error("Empty response from Gemini");
    }

    const result = JSON.parse(response.text) as ProcessedPrescription;
    return result;
  } catch (error) {
    console.error("Gemini AI Processing Error:", error);
    throw new Error("Failed to process OCR output with AI");
  }
}
