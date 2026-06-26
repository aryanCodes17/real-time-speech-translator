"use client";

import { Controls } from "@/components/Controls";
import { Header } from "@/components/Header";
import { SettingsSidebar } from "@/components/SettingsSidebar";
import { TranscriptPanel } from "@/components/TranscriptPanel";
import { TranslationPanel } from "@/components/TranslationPanel";
import { useAppContext } from "@/context/AppContext";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useTranslationQueue } from "@/hooks/useTranslationQueue";
import { useEffect } from "react";
import { showError } from "@/lib/toast";

export function AppShell() {
  const { state, setError } = useAppContext();
  const speech = useSpeechRecognition();

  useTranslationQueue();

  useEffect(() => {
    if (state.error) {
      showError(state.error);
      setError(null);
    }
  }, [state.error, setError]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-900">
      <Header isRecording={speech.isRecording} isPaused={speech.isPaused} />

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 px-4 py-4 sm:px-6 sm:py-6">
        <div className="grid flex-1 gap-4 lg:grid-cols-2">
          <TranscriptPanel />
          <TranslationPanel />
        </div>

        <Controls
          isRecording={speech.isRecording}
          isPaused={speech.isPaused}
          isSupported={speech.isSupported}
          onStart={speech.start}
          onPause={speech.pause}
          onStop={speech.stop}
          onResume={speech.resume}
        />
      </main>

      <SettingsSidebar />
    </div>
  );
}
