import { NextRequest, NextResponse } from "next/server";
import { transcribeAudio } from "@/lib/groq";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: "STT service is not configured" },
        { status: 503 }
      );
    }

    const formData = await request.formData();
    const audio = formData.get("audio");
    const language = formData.get("language");

    if (!(audio instanceof Blob) || audio.size === 0) {
      return NextResponse.json(
        { error: "Valid audio blob is required" },
        { status: 400 }
      );
    }

    const arrayBuffer = await audio.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = audio.type || "audio/webm";

    const text = await transcribeAudio(
      buffer,
      mimeType,
      typeof language === "string" ? language : undefined
    );

    return NextResponse.json({ text });
  } catch (error) {
    if (error instanceof Error && error.message.includes("not configured")) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    console.error("STT error:", error);
    return NextResponse.json(
      { error: "Speech transcription failed" },
      { status: 500 }
    );
  }
}
