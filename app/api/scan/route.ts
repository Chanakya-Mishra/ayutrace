import { NextResponse } from "next/server";
import { analyzePackageWithGemma, isGemmaConfigured } from "@/lib/gemma/scanner";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    if (!isGemmaConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error:
            "GEMINI_API_KEY is not configured on the server. Please add your Gemini API key to your .env file to enable Gemma 4 vision scanning. In the meantime, use the Manual Product Entry form to register items.",
          isConfigured: false,
        },
        { status: 503 }
      );
    }

    const contentType = request.headers.get("content-type") || "";
    let base64Image = "";
    let mimeType = "image/jpeg";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("image") as File | null;

      if (!file) {
        return NextResponse.json(
          { success: false, error: "No image file provided in form data." },
          { status: 400 }
        );
      }

      mimeType = file.type || "image/jpeg";
      const arrayBuffer = await file.arrayBuffer();
      base64Image = Buffer.from(arrayBuffer).toString("base64");
    } else {
      const body = await request.json();
      if (!body.imageBase64) {
        return NextResponse.json(
          { success: false, error: "Missing imageBase64 payload." },
          { status: 400 }
        );
      }
      base64Image = body.imageBase64.replace(/^data:image\/[a-z]+;base64,/, "");
      mimeType = body.mimeType || "image/jpeg";
    }

    const extracted = await analyzePackageWithGemma(base64Image, mimeType);

    return NextResponse.json({
      success: true,
      data: extracted,
      modelUsed: process.env.GEMMA_MODEL || "gemma-4-26b-a4b-it",
    });
  } catch (error: any) {
    console.error("POST /api/scan error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Gemma 4 vision analysis encountered an error.",
      },
      { status: 500 }
    );
  }
}
