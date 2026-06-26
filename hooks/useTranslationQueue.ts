"use client";

import { useEffect, useRef } from "react";
import { useAppContext } from "@/context/AppContext";
import { translationCache } from "@/lib/cache";
import { showError } from "@/lib/toast";
import { useLatencyTracker } from "@/hooks/useLatencyTracker";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function useTranslationQueue() {
  const {
    committedSegments,
    settings,
    appendTranslation,
    addPendingTranslation,
    removePendingTranslation,
  } = useAppContext();
  const { recordLatency } = useLatencyTracker();

  const translatedIdsRef = useRef<Set<string>>(new Set());
  const abortControllerRef = useRef<AbortController | null>(null);
  const processingRef = useRef(false);
  const queueRef = useRef<string[]>([]);
  const settingsRef = useRef(settings);
  const segmentsRef = useRef(committedSegments);

  useEffect(() => {
    segmentsRef.current = committedSegments;
    if (committedSegments.length === 0) {
      translatedIdsRef.current.clear();
      queueRef.current = [];
      abortControllerRef.current?.abort();
      processingRef.current = false;
    }
  }, [committedSegments]);

  useEffect(() => {
    const prev = settingsRef.current;
    const changed =
      prev.model !== settings.model ||
      prev.sourceLanguage !== settings.sourceLanguage ||
      prev.targetLanguage !== settings.targetLanguage;

    settingsRef.current = settings;

    if (changed) {
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
      queueRef.current = [];
      processingRef.current = false;
    }
  }, [settings]);

  useEffect(() => {
    for (const segment of committedSegments) {
      if (translatedIdsRef.current.has(segment.id)) continue;
      if (queueRef.current.includes(segment.id)) continue;

      const text = segment.text.trim();
      if (!text) {
        translatedIdsRef.current.add(segment.id);
        continue;
      }

      queueRef.current.push(segment.id);
    }

    void processQueue();
  }, [committedSegments, settings]);

  async function processQueue(): Promise<void> {
    if (processingRef.current) return;
    processingRef.current = true;

    while (queueRef.current.length > 0) {
      const sourceId = queueRef.current[0];
      const segment = segmentsRef.current.find((s) => s.id === sourceId);
      if (!segment) {
        queueRef.current.shift();
        continue;
      }

      if (translatedIdsRef.current.has(sourceId)) {
        queueRef.current.shift();
        continue;
      }

      const text = segment.text.trim();
      if (!text) {
        translatedIdsRef.current.add(sourceId);
        queueRef.current.shift();
        continue;
      }

      const currentSettings = settingsRef.current;
      const cacheKey = {
        text,
        sourceLanguage: currentSettings.sourceLanguage,
        targetLanguage: currentSettings.targetLanguage,
        model: currentSettings.model,
      };

      const cached = translationCache.get(cacheKey);
      if (cached) {
        translatedIdsRef.current.add(sourceId);
        appendTranslation({
          id: generateId(),
          sourceId,
          text: cached,
          latencyMs: 0,
        });
        queueRef.current.shift();
        continue;
      }

      addPendingTranslation(sourceId);
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const response = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text,
            sourceLanguage: currentSettings.sourceLanguage,
            targetLanguage: currentSettings.targetLanguage,
            model: currentSettings.model,
          }),
          signal: controller.signal,
        });

        if (controller.signal.aborted) continue;

        const data = (await response.json()) as {
          translatedText?: string;
          latency?: number;
          error?: string;
        };

        if (!response.ok) {
          if (response.status === 429) {
            showError("Rate limit exceeded. Retrying…");
            await new Promise((r) => setTimeout(r, 1000));
            continue;
          }
          showError(data.error ?? "Translation failed");
          removePendingTranslation(sourceId);
          queueRef.current.shift();
          translatedIdsRef.current.add(sourceId);
          continue;
        }

        const translatedText = data.translatedText?.trim();
        if (!translatedText) {
          removePendingTranslation(sourceId);
          queueRef.current.shift();
          translatedIdsRef.current.add(sourceId);
          continue;
        }

        const latencyMs = data.latency ?? 0;
        translationCache.set(cacheKey, translatedText);
        recordLatency(latencyMs);
        translatedIdsRef.current.add(sourceId);
        appendTranslation({
          id: generateId(),
          sourceId,
          text: translatedText,
          latencyMs,
        });
        queueRef.current.shift();
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          break;
        }
        showError("Translation request failed");
        removePendingTranslation(sourceId);
        queueRef.current.shift();
        translatedIdsRef.current.add(sourceId);
      } finally {
        removePendingTranslation(sourceId);
      }
    }

    processingRef.current = false;
    abortControllerRef.current = null;

    if (queueRef.current.length > 0) {
      void processQueue();
    }
  }

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);
}
