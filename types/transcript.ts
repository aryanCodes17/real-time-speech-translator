export type TranscriptSegment = {
  id: string;
  text: string;
  committedAt: number;
};

export type TranslationSegment = {
  id: string;
  sourceId: string;
  text: string;
  latencyMs: number;
};

export type RecordingState = "idle" | "recording" | "paused";

export type LatencyMetrics = {
  latestMs: number;
  averageMs: number;
  totalRequests: number;
};
