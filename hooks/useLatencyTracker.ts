"use client";

import { useCallback } from "react";
import { useAppContext } from "@/context/AppContext";

export function useLatencyTracker() {
  const { latency, updateLatency } = useAppContext();

  const recordLatency = useCallback(
    (ms: number) => {
      if (ms >= 0) updateLatency(ms);
    },
    [updateLatency]
  );

  return {
    latestMs: latency.latestMs,
    averageMs: latency.averageMs,
    totalRequests: latency.totalRequests,
    recordLatency,
  };
}
