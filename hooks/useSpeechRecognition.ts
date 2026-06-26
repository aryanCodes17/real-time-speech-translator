"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAppContext } from "@/context/AppContext";
import { debounce } from "@/lib/debounce";
import {
  ensureTerminalPunctuation,
  extractCommitText,
  hasTerminalPunctuation,
} from "@/lib/punctuation";
import { showError } from "@/lib/toast";

const INTERIM_DEBOUNCE_MS = 100;
const GROQ_CHUNK_MS = 2500;

type SpeechRecognitionInstance = SpeechRecognition;

function getSpeechRecognitionCtor():
  | (new () => SpeechRecognitionInstance)
  | null {
  if (typeof window === "undefined") return null;

  const w = window as Window & {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  };

  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function useSpeechRecognition() {
  const {
    settings,
    recordingState,
    setInterim,
    commitSegment,
    setRecordingState,
    setTranscribing,
    setError,
  } = useAppContext();

  const [isSupported, setIsSupported] = useState(false);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingCommitRef = useRef("");
  const latestInterimRef = useRef("");
  const sttAbortRef = useRef<AbortController | null>(null);
  const shouldRestartRef = useRef(false);
  const recordingStateRef = useRef(recordingState);

  useEffect(() => {
    recordingStateRef.current = recordingState;
  }, [recordingState]);

  useEffect(() => {
    const supported =
      settings.useServerStt ||
      getSpeechRecognitionCtor() !== null ||
      (typeof navigator !== "undefined" &&
        !!navigator.mediaDevices?.getUserMedia);

    setIsSupported(supported);
  }, [settings.useServerStt]);

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const commitText = useCallback(
    (rawText: string) => {
      const trimmed = rawText.trim();
      if (!trimmed) return;

      const text = ensureTerminalPunctuation(
        trimmed,
        settings.sourceLanguage
      );

      commitSegment({
        id: generateId(),
        text,
        committedAt: Date.now(),
      });

      pendingCommitRef.current = "";
      setInterim("");
    },
    [commitSegment, setInterim, settings.sourceLanguage]
  );

  const tryPunctuationCommit = useCallback(
    (text: string) => {
      if (!hasTerminalPunctuation(text)) return false;

      const extracted = extractCommitText(text);

      if (extracted) {
        commitText(extracted.commitPart);

        if (extracted.remainder) {
          pendingCommitRef.current = extracted.remainder;
          setInterim(extracted.remainder);
        }

        return true;
      }

      commitText(text);
      return true;
    },
    [commitText, setInterim]
  );

  const resetSilenceTimer = useCallback(
    (currentText: string) => {
      clearSilenceTimer();

      silenceTimerRef.current = setTimeout(() => {
        const combined = `${pendingCommitRef.current} ${currentText}`.trim();

        if (combined) {
          commitText(combined);
        }
      }, settings.silenceCommitMs);
    },
    [clearSilenceTimer, commitText, settings.silenceCommitMs]
  );

  const debouncedSetInterim = useRef(
    debounce((text: string) => {
      latestInterimRef.current = text;
      setInterim(text);
    }, INTERIM_DEBOUNCE_MS)
  ).current;

  const stopBrowserRecognition = useCallback(() => {
    shouldRestartRef.current = false;

    recognitionRef.current?.stop();
    recognitionRef.current = null;

    clearSilenceTimer();
  }, [clearSilenceTimer]);

  const stopGroqCapture = useCallback(() => {
    if (mediaRecorderRef.current?.state !== "inactive") {
      try {
        mediaRecorderRef.current?.stop();
      } catch {
        //
      }
    }

    mediaRecorderRef.current = null;

    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());

    mediaStreamRef.current = null;

    sttAbortRef.current?.abort();
    sttAbortRef.current = null;

    clearSilenceTimer();

    setTranscribing(false);
  }, [clearSilenceTimer, setTranscribing]);

  const uploadAudioChunk = useCallback(
    async (blob: Blob) => {
      if (!blob.size) return;

      setTranscribing(true);

      sttAbortRef.current?.abort();

      const controller = new AbortController();

      sttAbortRef.current = controller;

      try {
        const formData = new FormData();

        formData.append("audio", blob, "audio.webm");
        formData.append("language", settings.sourceLanguage);

        const response = await fetch("/api/stt", {
          method: "POST",
          body: formData,
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;

        const data = (await response.json()) as {
          text?: string;
          error?: string;
        };

        if (!response.ok) {
          showError(data.error ?? "Transcription failed");
          return;
        }

        const text = data.text?.trim();

        if (text) {
          commitText(text);
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        showError("Failed to transcribe audio");
      } finally {
        setTranscribing(false);
      }
    },
    [commitText, setTranscribing, settings.sourceLanguage]
  );

  const startGroqCapture = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      mediaStreamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported(
        "audio/webm;codecs=opus"
      )
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const recorder = new MediaRecorder(stream, { mimeType });

      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (
          event.data.size > 0 &&
          recordingStateRef.current === "recording"
        ) {
          void uploadAudioChunk(event.data);
        }
      };

      recorder.start(GROQ_CHUNK_MS);

      setRecordingState("recording");
      shouldRestartRef.current = false;
    } catch {
      showError("Microphone permission denied");

      setError("Microphone permission denied");
      setRecordingState("idle");
    }
  }, [setError, setRecordingState, uploadAudioChunk]);

  const startBrowserRecognition = useCallback(() => {
    const Ctor = getSpeechRecognitionCtor();

    if (!Ctor) {
      showError(
        "Speech recognition is not supported. Enable server-side STT or use Chrome/Edge."
      );

      setError("Browser speech recognition not supported");

      return;
    }

    const recognition = new Ctor();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = settings.sourceLanguage;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      let final = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0]?.transcript ?? "";

        if (result.isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }

      const combined = `${pendingCommitRef.current} ${
        final || interim
      }`.trim();

      if (!combined) return;

      debouncedSetInterim(combined);

      resetSilenceTimer(combined);

      if (final.trim()) {
        if (!tryPunctuationCommit(combined)) {
          pendingCommitRef.current = combined;
        }
      } else if (tryPunctuationCommit(combined)) {
        //
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const code = event.error;

      if (
        code === "not-allowed" ||
        code === "service-not-allowed"
      ) {
        showError("Microphone permission denied");

        setError("Microphone permission denied");

        setRecordingState("idle");

        shouldRestartRef.current = false;
      } else if (
        code !== "no-speech" &&
        code !== "aborted"
      ) {
        showError(`Speech recognition error: ${code}`);
      }
    };

    recognition.onend = () => {
      if (
        shouldRestartRef.current &&
        recordingStateRef.current === "recording"
      ) {
        try {
          recognition.start();
        } catch {
          //
        }
      }
    };

    recognitionRef.current = recognition;

    shouldRestartRef.current = true;

    try {
      recognition.start();

      setRecordingState("recording");
    } catch {
      showError("Could not start speech recognition");

      setRecordingState("idle");
    }
  }, [
    debouncedSetInterim,
    resetSilenceTimer,
    setError,
    setRecordingState,
    settings.sourceLanguage,
    tryPunctuationCommit,
  ]);

  const start = useCallback(() => {
    setError(null);

    if (settings.useServerStt) {
      void startGroqCapture();
    } else {
      startBrowserRecognition();
    }
  }, [
    setError,
    settings.useServerStt,
    startGroqCapture,
    startBrowserRecognition,
  ]);

  const pause = useCallback(() => {
    shouldRestartRef.current = false;

    clearSilenceTimer();

    if (settings.useServerStt) {
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.pause();
      }
    } else {
      recognitionRef.current?.stop();
    }

    setRecordingState("paused");
  }, [
    clearSilenceTimer,
    setRecordingState,
    settings.useServerStt,
  ]);

  const stop = useCallback(() => {
    shouldRestartRef.current = false;

    clearSilenceTimer();

    const interim = `${pendingCommitRef.current} ${latestInterimRef.current}`.trim();

    if (interim.trim()) {
      commitText(interim);
    }

    if (settings.useServerStt) {
      stopGroqCapture();
    } else {
      stopBrowserRecognition();
    }

    setInterim("");

    pendingCommitRef.current = "";
    latestInterimRef.current = "";

    setRecordingState("idle");
  }, [
    clearSilenceTimer,
    commitText,
    setInterim,
    setRecordingState,
    settings.useServerStt,
    stopBrowserRecognition,
    stopGroqCapture,
  ]);

  const resume = useCallback(() => {
    if (settings.useServerStt) {
      if (mediaRecorderRef.current?.state === "paused") {
        mediaRecorderRef.current.resume();

        setRecordingState("recording");
      } else {
        void startGroqCapture();
      }
    } else {
      shouldRestartRef.current = true;

      try {
        recognitionRef.current?.start();

        setRecordingState("recording");
      } catch {
        startBrowserRecognition();
      }
    }
  }, [
    setRecordingState,
    settings.useServerStt,
    startBrowserRecognition,
    startGroqCapture,
  ]);

  useEffect(() => {
    return () => {
      stopBrowserRecognition();
      stopGroqCapture();
    };
  }, [stopBrowserRecognition, stopGroqCapture]);

  return {
    start,
    pause,
    stop,
    resume,
    isSupported,
    isRecording: recordingState === "recording",
    isPaused: recordingState === "paused",
  };
}