"use client";

import { memo, useEffect } from "react";
import { useAppContext } from "@/context/AppContext";
import { translationCache } from "@/lib/cache";
import { showInfo } from "@/lib/toast";
import {
  GEMINI_MODELS,
  LANGUAGE_OPTIONS,
  type LanguageCode,
} from "@/types/settings";

function SettingsSidebarComponent() {
  const {
    settings,
    setSettings,
    clearAll,
    state,
    setSettingsOpen,
    recordingState,
  } = useAppContext();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSettingsOpen(false);
    };
    if (state.settingsOpen) {
      window.addEventListener("keydown", onKeyDown);
    }
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [state.settingsOpen, setSettingsOpen]);

  if (!state.settingsOpen) return null;

  const isRecording = recordingState !== "idle";

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm"
        aria-label="Close settings overlay"
        onClick={() => setSettingsOpen(false)}
      />
      <aside className="fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col border-l border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-950">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Settings
          </h2>
          <button
            type="button"
            onClick={() => setSettingsOpen(false)}
            className="rounded-md px-2 py-1 text-sm text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900"
          >
            Close
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Source language
            </span>
            <select
              value={settings.sourceLanguage}
              disabled={isRecording}
              onChange={(e) =>
                setSettings({ sourceLanguage: e.target.value as LanguageCode })
              }
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            >
              {LANGUAGE_OPTIONS.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Target language
            </span>
            <select
              value={settings.targetLanguage}
              disabled={isRecording}
              onChange={(e) =>
                setSettings({ targetLanguage: e.target.value as LanguageCode })
              }
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            >
              {LANGUAGE_OPTIONS.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Gemini model
            </span>
            <select
              value={settings.model}
              disabled={isRecording}
              onChange={(e) =>
                setSettings({
                  model: e.target.value as (typeof GEMINI_MODELS)[number],
                })
              }
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            >
              {GEMINI_MODELS.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Silence commit (ms)
              </span>
              <span className="text-xs tabular-nums text-slate-500">
                {settings.silenceCommitMs}
              </span>
            </div>
            <input
              type="range"
              min={500}
              max={4000}
              step={100}
              value={settings.silenceCommitMs}
              onChange={(e) =>
                setSettings({ silenceCommitMs: Number(e.target.value) })
              }
              className="w-full accent-indigo-600"
            />
          </label>

          <label className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-3 dark:border-slate-700">
            <div>
              <span className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Server-side STT (Groq Whisper)
              </span>
              <span className="text-xs text-slate-500">
                Replaces browser speech recognition
              </span>
            </div>
            <input
              type="checkbox"
              checked={settings.useServerStt}
              disabled={isRecording}
              onChange={(e) =>
                setSettings({ useServerStt: e.target.checked })
              }
              className="h-4 w-4 rounded accent-indigo-600"
            />
          </label>

          <button
            type="button"
            onClick={() => {
              clearAll();
              translationCache.clear();
              showInfo("Transcript cleared");
            }}
            className="w-full rounded-lg border border-rose-200 px-4 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50 dark:border-rose-900 dark:text-rose-400 dark:hover:bg-rose-950/40"
          >
            Clear transcript
          </button>

          {isRecording && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Stop recording to change language, model, or STT mode.
            </p>
          )}
        </div>
      </aside>
    </>
  );
}

export const SettingsSidebar = memo(SettingsSidebarComponent);
