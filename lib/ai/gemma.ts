import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";

export const ScannedMedicineSchema = z.object({
  medicineName: z.string().optional().nullable(),
  genericName: z.string().optional().nullable(),
  brand: z.string().optional().nullable(),
  strength: z.string().optional().nullable(),
  dosageForm: z.string().optional().nullable(), // Tablet, Capsule, Syrup, Injection, etc.
  manufacturer: z.string().optional().nullable(),
  batchNumber: z.string().optional().nullable(),
  manufacturingDateText: z.string().optional().nullable(),
  expiryDateText: z.string().optional().nullable(),
  packSize: z.string().optional().nullable(),
  storageInstructions: z.string().optional().nullable(),
  scheduleType: z.string().optional().nullable(),
  uncertaintyWarnings: z.string().optional().nullable(),
  rawConfidence: z.enum(["high", "medium", "low"]).default("medium"),
});

export type ScannedMedicineResult = z.infer<typeof ScannedMedicineSchema>;

/**
 * Check whether the Gemini API key is configured on the server.
 */
export function isGemmaConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== "");
}

/**
 * Extract pharmaceutical packaging information from image bytes using Google Gemma 4.
 *
 * Grounding & Safety Constraints:
 * 1. Evidence-Grounded Only: Extract strictly what is printed on the physical packaging.
 * 2. Conservative Nulls: If batch, expiry, or composition is blurred, torn, or unprinted, return null.
 * 3. NO Clinical Claims: Do not produce drug substitutions, clinical indications, or dosage prescriptions.
 *
 * @param imageBase64 - Base64 encoded image string (stripped of data URI prefix)
 * @param mimeType - Image MIME type (e.g. 'image/jpeg', 'image/png')
 */
export async function analyzeMedicinePackageWithGemma(
  imageBase64: string,
  mimeType: string
): Promise<ScannedMedicineResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === "") {
    throw new Error(
      "GEMINI_API_KEY is not configured on the server. " +
        "Please provide a valid Gemini API key in your .env file to enable Gemma 4 vision scanning. " +
        "Manual medicine registration remains fully available."
    );
  }

  const modelName = process.env.GEMMA_MODEL || "gemma-4-26b-a4b-it";
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: modelName });

  const systemPrompt = `You are AyuTrace's pharmaceutical packaging inspection specialist powered by Google Gemma 4.
Your sole role is to accurately transcribe physical text printed on real medicine packaging, blister packs, vials, ampoules, or syrup bottles.

SAFETY & PHARMACEUTICAL CONSTRAINTS:
1. EVIDENCE GROUNDED ONLY: Read ONLY text clearly visible on the package. NEVER invent, hallucinate, or extrapolate information.
2. MISSING VALUES: If an expiry date, lot number, strength, or composition is blurred, cropped, smudged, or unreadable, set the field to null.
3. NEVER GUESS EXPIRY DATES: Missing dates must remain null for human pharmacist review.
4. NO CLINICAL ADVICE: Do NOT provide therapeutic recommendations, prescribing advice, dosages, or drug substitutions.
5. Return ONLY a single raw JSON object matching this schema without markdown fences:
{
  "medicineName": string or null (e.g., "Paracip 500", "Amoxyclav 625"),
  "genericName": string or null (composition, e.g., "Paracetamol Tablets IP", "Amoxicillin and Potassium Clavulanate"),
  "brand": string or null,
  "strength": string or null (e.g., "500 mg", "625 mg", "250 mg / 5 ml"),
  "dosageForm": string or null ("Tablet" | "Capsule" | "Syrup" | "Injection" | "Ointment" | "Drops" | "IV Fluid" | "Suspension" | "Inhaler"),
  "manufacturer": string or null (e.g., "Cipla Ltd", "Sun Pharma", "Dr. Reddy's"),
  "batchNumber": string or null (e.g., "B240901", "LOT-998"),
  "manufacturingDateText": string or null (literal printed text, e.g., "MFG 08/2024"),
  "expiryDateText": string or null (literal printed text, e.g., "EXP 08/2026", "08/26"),
  "packSize": string or null (e.g., "Strip of 10 Tablets", "Bottle of 100ml"),
  "storageInstructions": string or null (e.g., "Store below 25°C. Protect from light."),
  "scheduleType": string or null ("Schedule H" | "Schedule H1" | "Schedule X" | "OTC" | null),
  "uncertaintyWarnings": string or null (notes on blurred areas, creased foil, or ambiguous characters),
  "rawConfidence": "high" | "medium" | "low"
}`;

  try {
    const result = await model.generateContent([
      systemPrompt,
      {
        inlineData: {
          data: imageBase64,
          mimeType: mimeType || "image/jpeg",
        },
      },
    ]);

    const response = await result.response;
    const text = response.text().trim();

    // Clean potential markdown code blocks
    const jsonText = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
    const parsed = JSON.parse(jsonText);

    return ScannedMedicineSchema.parse(parsed);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      throw new Error(`Gemma 4 response format validation failed: ${error.message}`);
    }
    throw new Error(`Gemma 4 medicine vision analysis failed: ${error.message || String(error)}`);
  }
}
