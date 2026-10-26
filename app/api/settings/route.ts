import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { AppSettingsSchema } from "@/lib/validations/medicine";
import { isGemmaConfigured } from "@/lib/ai/gemma";

export async function GET() {
  try {
    let settings = await prisma.appSettings.findUnique({
      where: { id: "default" },
    });

    if (!settings) {
      settings = await prisma.appSettings.create({
        data: {
          id: "default",
          orgName: "AyuTrace Health Network",
          nearExpiryThresholdDays: 90,
          criticalExpiryThresholdDays: 30,
          urgentExpiryThresholdDays: 7,
          dateFormat: "DD/MM/YYYY",
        },
      });
    }

    const facilities = await prisma.facility.findMany({
      select: { id: true, name: true, type: true },
      orderBy: { name: "asc" },
    });

    const hasEnvKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== "");
    const hasDbKey = Boolean(settings.geminiApiKey && settings.geminiApiKey.trim() !== "");
    const isConfigured = hasEnvKey || hasDbKey;

    return NextResponse.json({
      success: true,
      data: {
        ...settings,
        geminiApiKey: settings.geminiApiKey ? "••••••••••••••••" : "",
        isGemmaConfigured: isConfigured,
        configuredModel: process.env.GEMMA_MODEL || "gemma-4-26b-a4b-it",
        facilities,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const validated = AppSettingsSchema.parse(body);

    const updateData: any = {
      orgName: validated.orgName,
      defaultFacilityId: validated.defaultFacilityId,
      nearExpiryThresholdDays: validated.nearExpiryThresholdDays,
      criticalExpiryThresholdDays: validated.criticalExpiryThresholdDays,
      urgentExpiryThresholdDays: validated.urgentExpiryThresholdDays,
      dateFormat: validated.dateFormat,
    };

    if (typeof validated.geminiApiKey === "string") {
      updateData.geminiApiKey = validated.geminiApiKey.trim() || null;
    }

    const updated = await prisma.appSettings.upsert({
      where: { id: "default" },
      update: updateData,
      create: {
        id: "default",
        ...updateData,
      },
    });

    const hasEnvKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== "");
    const hasDbKey = Boolean(updated.geminiApiKey && updated.geminiApiKey.trim() !== "");
    const isConfigured = hasEnvKey || hasDbKey;

    return NextResponse.json({
      success: true,
      data: {
        ...updated,
        geminiApiKey: updated.geminiApiKey ? "••••••••••••••••" : "",
        isGemmaConfigured: isConfigured,
        configuredModel: process.env.GEMMA_MODEL || "gemma-4-26b-a4b-it",
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
