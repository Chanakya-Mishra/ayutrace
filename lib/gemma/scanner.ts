import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";

export const ScannedLabelSchema = z.object({
  productName: z.string().optional().nullable(),
  brand: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  batchNumber: z.string().optional().nullable(),
  manufacturingDateText: z.string().optional().nullable(),
  printedDateText: z.string().optional().nullable(),
  dateType: z
    .enum(["expiry_date", "best_before", "use_by", "manufacturing_date", "unknown"])
    .default("unknown"),
  packageNetQuantity: z.string().optional().nullable(),
  unit: z.string().optional().nullable(),
  storageInstructions: z.string().optional().nullable(),
  warnings: z.string().optional().nullable(),
  uncertaintyNotes: z.string().optional().nullable(),
  rawConfidence: z.enum(["high", "medium", "low"]).default("medium"),
});

export type ScannedLabelResult = z.infer<typeof ScannedLabelSchema>;

/**
 * Check whether the Gemini API key is configured on the server.
 */
export function isGemmaConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== "");
}

/**
 * Extract packaging information from an uploaded image using Gemma 4 via the Google Generative AI SDK.
 *
 * @param imageBase64 - Base64 encoded image string (without data URI prefix)
 * @param mimeType - Image MIME type (e.g. 'image/jpeg', 'image/png')
 */
export async function analyzePackageWithGemma(
  imageBase64: string,
  mimeType: string
): Promise<ScannedLabelResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === "") {
    throw new Error(
      "GEMINI_API_KEY is not configured on the server. " +
        "Please provide a valid Gemini API key in your .env file to enable Gemma 4 image scanning."
    );
  }

  const modelName = process.env.GEMMA_MODEL || "gemma-4-26b-a4b-it";

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: modelName });

  const systemPrompt = `You are ShelfSense AI's packaging extraction specialist powered by Google Gemma 4.
Your job is to read real consumer packaged goods labels accurately and conservatively.

CRITICAL RULES:
1. NEVER INVENT OR GUESS missing, blurred, or obscured details. If unreadable, return null.
2. DISTINGUISH DATE SEMANTICS:
   - "EXPIRY" or "EXP" or "USE BY": dateType = "expiry_date" or "use_by" (strict food safety threshold).
   - "BEST BEFORE" or "BB" or "BEST BY": dateType = "best_before" (quality threshold, not safety cutoff).
   - "MFG" or "PACKED ON" or "PKD": dateType = "manufacturing_date".
   - If ambiguous or just numbers with no label: dateType = "unknown".
3. PACKAGE NET QUANTITY is the printed net contents (e.g. "500g", "1 Liter"). This is NOT the inventory stock count.
4. Return ONLY valid raw JSON with NO markdown code fences, matching this exact structure:
{
  "productName": string or null,
  "brand": string or null,
  "category": "Dairy" | "Bakery" | "Beverages" | "Snacks" | "Pantry" | "Condiments" | "Frozen" | "Personal Care" | "General" or null,
  "batchNumber": string or null,
  "manufacturingDateText": string or null,
  "printedDateText": string or null,
  "dateType": "expiry_date" | "best_before" | "use_by" | "manufacturing_date" | "unknown",
  "packageNetQuantity": string or null,
  "unit": string or null,
  "storageInstructions": string or null,
  "warnings": string or null,
  "uncertaintyNotes": string or null,
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

    // Clean potential markdown fences
    const jsonText = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
    const parsed = JSON.parse(jsonText);

    return ScannedLabelSchema.parse(parsed);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      throw new Error(`Gemma 4 response format validation failed: ${error.message}`);
    }
    throw new Error(`Gemma 4 vision analysis failed: ${error.message || String(error)}`);
  }
}
