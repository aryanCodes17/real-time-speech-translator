import Groq from "groq-sdk";

const WHISPER_MODEL = "whisper-large-v3";

function getClient(): Groq {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not configured");
  }
  return new Groq({ apiKey });
}

export async function transcribeAudio(
  audioBuffer: Buffer,
  mimeType: string,
  language?: string
): Promise<string> {
  const client = getClient();
  const file = new File([new Uint8Array(audioBuffer)], "audio.webm", {
    type: mimeType,
  });

  const transcription = await client.audio.transcriptions.create({
    file,
    model: WHISPER_MODEL,
    language: language?.split("-")[0],
    response_format: "json",
  });

  return (transcription.text ?? "").trim();
}
