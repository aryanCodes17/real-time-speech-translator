"use client";

import { memo } from "react";
import { LatencyBadge } from "@/components/LatencyBadge";
import { useAppContext } from "@/context/AppContext";
import { GEMINI_MODELS } from "@/types/settings";

type HeaderProps = {
  isRecording: boolean;
  isPaused: boolean;
};

function HeaderComponent({ isRecording, isPaused }: HeaderProps) {
  const { settings, latency, setSettingsOpen } = useAppContext();

  const modelLabel =
    GEMINI_MODELS.find((m) => m === settings.model) ?? settings.model;

  const statusLabel = isRecording
    ? "Recording"
    : isPaused
      ? "Paused"
      : "Idle";

  const statusColor = isRecording
    ? "bg-emerald-500"
    : isPaused
      ? "bg-amber-500"
      : "bg-slate-400";

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Speech Translator
          </h1>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:text-slate-300">
            <span className={`h-2 w-2 rounded-full ${statusColor}`} />
            {statusLabel}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span className="rounded-md border border-slate-200 px-2.5 py-1 text-xs text-slate-600 dark:border-slate-700 dark:text-slate-300">
            {modelLabel}
          </span>
          <LatencyBadge
            latestMs={latency.latestMs}
            averageMs={latency.averageMs}
            totalRequests={latency.totalRequests}
          />
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
            aria-label="Open settings"
          >
            Settings
          </button>
        </div>
      </div>
    </header>
  );
}

export const Header = memo(HeaderComponent);
