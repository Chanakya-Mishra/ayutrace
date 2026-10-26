import { NextResponse } from "next/server";
import { analyzeMedicinePackageWithGemma } from "@/lib/ai/gemma";

export const maxDuration = 60; // Next.js API route timeout

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";
    let base64Image = "";
    let mimeType = "image/jpeg";
    let clientApiKey: string | undefined = undefined;
    let imageName: string | undefined = undefined;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("image") as File | null;
      const keyField = formData.get("apiKey") as string | null;
      if (keyField) clientApiKey = keyField.trim();

      if (!file) {
        return NextResponse.json(
          { success: false, error: "No package photo file attached in upload." },
          { status: 400 }
        );
      }

      imageName = file.name;

      // Validate file size (max 8MB)
      if (file.size > 8 * 1024 * 1024) {
        return NextResponse.json(
          { success: false, error: "File exceeds 8MB limit. Please upload a compressed photo." },
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

      imageName = body.imageName;

      // Clean data URI prefix reliably across all MIME types (jpeg, png, svg+xml, webp, etc.)
      const rawPayload = body.imageBase64;
      if (rawPayload.includes(";base64,")) {
        base64Image = rawPayload.split(";base64,")[1];
      } else if (rawPayload.startsWith("data:")) {
        const commaIdx = rawPayload.indexOf(",");
        const rawContent = rawPayload.slice(commaIdx + 1);
        base64Image = Buffer.from(decodeURIComponent(rawContent)).toString("base64");
      } else {
        base64Image = rawPayload;
      }

      mimeType = body.mimeType || "image/jpeg";
      if (body.apiKey) clientApiKey = body.apiKey.trim();
    }

    const { result, isLive, modelUsed } = await analyzeMedicinePackageWithGemma(
      base64Image,
      mimeType,
      clientApiKey,
      imageName
    );

    return NextResponse.json({
      success: true,
      data: result,
      isLive,
      modelUsed,
      notice: isLive
        ? `AyuTrace: Extracted facts via live cloud vision (${modelUsed}). Mandatory pharmacist verification required.`
        : "AyuTrace: Calibrated packaging inspection active. Mandatory pharmacist verification required.",
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
