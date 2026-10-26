import { NextResponse } from "next/server";
import { analyzeMedicinePackageWithGemma, isGemmaConfigured } from "@/lib/ai/gemma";

export const maxDuration = 60; // Next.js API route timeout

export async function POST(request: Request) {
  try {
    if (!isGemmaConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error:
            "GEMINI_API_KEY is not configured on the server. Please add your Gemini API key to your .env file to enable Gemma 4 vision scanning. You can register stock immediately using the Manual Registration tab.",
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
          { success: false, error: "No package photo file attached in upload." },
          { status: 400 }
        );
      }

      // Validate file size (max 8MB)
      if (file.size > 8 * 1024 * 1024) {
        return NextResponse.json(
          { success: false, error: "File exceeds 8MB limit. Please upload a compressed photo." },
          { status: 400 }
        );
      }

      // Validate MIME type
      mimeType = file.type || "image/jpeg";
      if (!mimeType.match(/^image\/(jpeg|jpg|png|webp)$/i)) {
        return NextResponse.json(
          { success: false, error: "Unsupported image format. Please upload JPG, JPEG, or PNG." },
          { status: 400 }
        );
      }

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

    const extracted = await analyzeMedicinePackageWithGemma(base64Image, mimeType);

    return NextResponse.json({
      success: true,
      data: extracted,
      modelUsed: process.env.GEMMA_MODEL || "gemma-4-26b-a4b-it",
      notice: "AyuTrace: Extracted facts require mandatory pharmacist verification prior to inventory commit.",
    });
  } catch (error: any) {
    console.error("POST /api/scan-medicine error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Gemma 4 vision analysis encountered an error.",
      },
      { status: 500 }
    );
  }
}
