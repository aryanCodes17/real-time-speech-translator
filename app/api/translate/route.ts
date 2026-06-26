import { NextRequest, NextResponse } from "next/server";
import { isGeminiModel } from "@/types/settings";
import { isRateLimitError, translateWithGemini } from "@/lib/gemini";

export const runtime = "nodejs";

type TranslateBody = {
  text?: string;
  sourceLanguage?: string;
  targetLanguage?: string;
  model?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as TranslateBody;
    const text = body.text?.trim();
    const sourceLanguage = body.sourceLanguage?.trim();
    const targetLanguage = body.targetLanguage?.trim();
    const model = body.model?.trim();

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }
    if (!sourceLanguage || !targetLanguage) {
      return NextResponse.json(
        { error: "Source and target languages are required" },
        { status: 400 }
      );
    }
    if (model && !isGeminiModel(model)) {
      return NextResponse.json({ error: "Invalid model" }, { status: 400 });
    }

    if (!process.env.GOOGLE_API_KEY) {
      return NextResponse.json(
        { error: "Translation service is not configured" },
        { status: 503 }
      );
    }

    const start = performance.now();
    const translatedText = await translateWithGemini({
      text,
      sourceLanguage,
      targetLanguage,
      model: model && isGeminiModel(model) ? model : undefined,
    });
    const latency = Math.round(performance.now() - start);

    return NextResponse.json({ translatedText, latency });
  } catch (error) {
    if (error instanceof Error && error.message.includes("not configured")) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    if (isRateLimitError(error)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again shortly." },
        { status: 429 }
      );
    }
    console.error("Translation error:", error);
    return NextResponse.json(
      { error: "Translation failed" },
      { status: 500 }
    );
  }
}
