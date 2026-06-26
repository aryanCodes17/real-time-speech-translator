import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  DEFAULT_GEMINI_MODEL,
  isGeminiModel,
  type GeminiModel,
} from "@/types/settings";

export type TranslateParams = {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
  model?: GeminiModel;
};

function getClient(): GoogleGenerativeAI {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_API_KEY is not configured");
  }
  return new GoogleGenerativeAI(apiKey);
}

function buildPrompt(
  text: string,
  sourceLanguage: string,
  targetLanguage: string
): string {
  return `Translate the following text from ${sourceLanguage} to ${targetLanguage}.
Return ONLY the translated text. Preserve punctuation and formatting.
Do not add explanations or quotes.

Text:
${text}`;
}

export async function translateWithGemini(
  params: TranslateParams
): Promise<string> {
  const modelName = params.model ?? DEFAULT_GEMINI_MODEL;
  if (!isGeminiModel(modelName)) {
    throw new Error(`Unsupported model: ${modelName}`);
  }

  const genAI = getClient();
  const model = genAI.getGenerativeModel({ model: modelName });
  const result = await model.generateContent(
    buildPrompt(params.text, params.sourceLanguage, params.targetLanguage)
  );
  const response = result.response;
  const translated = response.text().trim();

  if (!translated) {
    throw new Error("Empty translation response from Gemini");
  }

  return translated;
}

export function isRateLimitError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return (
    msg.includes("429") ||
    msg.includes("rate") ||
    msg.includes("quota") ||
    msg.includes("resource exhausted")
  );
}
