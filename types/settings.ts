export const GEMINI_MODELS = [
  "gemini-2.5-flash-lite",
  "gemini-1.5-flash",
  "gemini-2.5-flash",
  "gemini-2.5-pro",
] as const;

export type GeminiModel = (typeof GEMINI_MODELS)[number];

export const DEFAULT_GEMINI_MODEL: GeminiModel = "gemini-2.5-flash-lite";

export const LANGUAGE_OPTIONS = [
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "hi", label: "Hindi" },
  { code: "ja", label: "Japanese" },
  { code: "zh", label: "Chinese" },
  { code: "ko", label: "Korean" },
  { code: "pt", label: "Portuguese" },
  { code: "ar", label: "Arabic" },
] as const;

export type LanguageCode = (typeof LANGUAGE_OPTIONS)[number]["code"];

export type AppSettings = {
  sourceLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  model: GeminiModel;
  silenceCommitMs: number;
  useServerStt: boolean;
};

export const DEFAULT_SETTINGS: AppSettings = {
  sourceLanguage: "en",
  targetLanguage: "es",
  model: DEFAULT_GEMINI_MODEL,
  silenceCommitMs: 1500,
  useServerStt: false,
};

export function isGeminiModel(value: string): value is GeminiModel {
  return (GEMINI_MODELS as readonly string[]).includes(value);
}
