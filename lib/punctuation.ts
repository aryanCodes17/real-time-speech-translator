const TERMINAL_PATTERN = /[.?!。\n？！।]$/;

const LANGUAGE_TERMINATORS: Record<string, string> = {
  en: ".",
  es: ".",
  fr: ".",
  de: ".",
  pt: ".",
  ar: ".",
  ko: ".",
  hi: "।",
  ja: "。",
  zh: "。",
};

export function hasTerminalPunctuation(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  return TERMINAL_PATTERN.test(trimmed);
}

export function getTerminalForLanguage(languageCode: string): string {
  const base = languageCode.split("-")[0].toLowerCase();
  return LANGUAGE_TERMINATORS[base] ?? ".";
}

export function ensureTerminalPunctuation(
  text: string,
  languageCode: string
): string {
  const trimmed = text.trim();
  if (!trimmed) return trimmed;
  if (hasTerminalPunctuation(trimmed)) return trimmed;
  const terminal = getTerminalForLanguage(languageCode);
  return `${trimmed}${terminal}`;
}

export function extractCommitText(text: string): {
  commitPart: string;
  remainder: string;
} | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const match = trimmed.match(/^([\s\S]*?[.?!。\n？！।])(?:\s+([\s\S]*))?$/);
  if (!match) return null;

  const commitPart = match[1].trim();
  const remainder = (match[2] ?? "").trim();
  if (!commitPart) return null;

  return { commitPart, remainder };
}
