"use client";

import { memo } from "react";

type ControlsProps = {
  isRecording: boolean;
  isPaused: boolean;
  isSupported: boolean;
  onStart: () => void;
  onPause: () => void;
  onStop: () => void;
  onResume: () => void;
};

function ControlsComponent({
  isRecording,
  isPaused,
  isSupported,
  onStart,
  onPause,
  onStop,
  onResume,
}: ControlsProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
      <div className="flex flex-wrap items-center gap-3">
        {!isRecording && !isPaused && (
          <button
            type="button"
            onClick={onStart}
            disabled={!isSupported}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Start Recording
          </button>
        )}

        {isRecording && (
          <button
            type="button"
            onClick={onPause}
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-400"
          >
            Pause
          </button>
        )}

        {isPaused && (
          <button
            type="button"
            onClick={onResume}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500"
          >
            Resume
          </button>
        )}

        {(isRecording || isPaused) && (
          <button
            type="button"
            onClick={onStop}
            className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-500"
          >
            Stop
          </button>
        )}
      </div>

      {!isSupported && (
        <p className="mt-3 text-sm text-amber-600 dark:text-amber-400">
          Speech recognition is not supported in this browser. Enable server-side
          STT in settings or use Chrome/Edge.
        </p>
      )}
    </div>
  );
}

export const Controls = memo(ControlsComponent);
