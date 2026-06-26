"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import { DEFAULT_SETTINGS, type AppSettings } from "@/types/settings";
import type {
  LatencyMetrics,
  RecordingState,
  TranscriptSegment,
  TranslationSegment,
} from "@/types/transcript";

type AppState = {
  settings: AppSettings;
  recordingState: RecordingState;
  interimTranscript: string;
  committedSegments: TranscriptSegment[];
  translationSegments: TranslationSegment[];
  pendingTranslationIds: string[];
  isTranscribing: boolean;
  latency: LatencyMetrics;
  error: string | null;
  settingsOpen: boolean;
};

type AppAction =
  | { type: "SET_SETTINGS"; payload: Partial<AppSettings> }
  | { type: "SET_INTERIM"; payload: string }
  | { type: "COMMIT_SEGMENT"; payload: TranscriptSegment }
  | { type: "APPEND_TRANSLATION"; payload: TranslationSegment }
  | { type: "SET_RECORDING_STATE"; payload: RecordingState }
  | { type: "SET_PENDING_TRANSLATIONS"; payload: string[] }
  | { type: "ADD_PENDING_TRANSLATION"; payload: string }
  | { type: "REMOVE_PENDING_TRANSLATION"; payload: string }
  | { type: "SET_TRANSCRIBING"; payload: boolean }
  | { type: "UPDATE_LATENCY"; payload: number }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "CLEAR_ALL" }
  | { type: "SET_SETTINGS_OPEN"; payload: boolean };

const initialState: AppState = {
  settings: DEFAULT_SETTINGS,
  recordingState: "idle",
  interimTranscript: "",
  committedSegments: [],
  translationSegments: [],
  pendingTranslationIds: [],
  isTranscribing: false,
  latency: { latestMs: 0, averageMs: 0, totalRequests: 0 },
  error: null,
  settingsOpen: false,
};

const LATENCY_WINDOW = 20;
const latencySamples: number[] = [];

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_SETTINGS":
      return { ...state, settings: { ...state.settings, ...action.payload } };
    case "SET_INTERIM":
      return { ...state, interimTranscript: action.payload };
    case "COMMIT_SEGMENT":
      return {
        ...state,
        committedSegments: [...state.committedSegments, action.payload],
        interimTranscript: "",
      };
    case "APPEND_TRANSLATION":
      return {
        ...state,
        translationSegments: [...state.translationSegments, action.payload],
        pendingTranslationIds: state.pendingTranslationIds.filter(
          (id) => id !== action.payload.sourceId
        ),
      };
    case "SET_RECORDING_STATE":
      return { ...state, recordingState: action.payload };
    case "SET_PENDING_TRANSLATIONS":
      return { ...state, pendingTranslationIds: action.payload };
    case "ADD_PENDING_TRANSLATION":
      if (state.pendingTranslationIds.includes(action.payload)) return state;
      return {
        ...state,
        pendingTranslationIds: [...state.pendingTranslationIds, action.payload],
      };
    case "REMOVE_PENDING_TRANSLATION":
      return {
        ...state,
        pendingTranslationIds: state.pendingTranslationIds.filter(
          (id) => id !== action.payload
        ),
      };
    case "SET_TRANSCRIBING":
      return { ...state, isTranscribing: action.payload };
    case "UPDATE_LATENCY": {
      latencySamples.push(action.payload);
      if (latencySamples.length > LATENCY_WINDOW) latencySamples.shift();
      const averageMs = Math.round(
        latencySamples.reduce((sum, v) => sum + v, 0) / latencySamples.length
      );
      return {
        ...state,
        latency: {
          latestMs: action.payload,
          averageMs,
          totalRequests: state.latency.totalRequests + 1,
        },
      };
    }
    case "SET_ERROR":
      return { ...state, error: action.payload };
    case "CLEAR_ALL":
      latencySamples.length = 0;
      return {
        ...state,
        interimTranscript: "",
        committedSegments: [],
        translationSegments: [],
        pendingTranslationIds: [],
        isTranscribing: false,
        latency: { latestMs: 0, averageMs: 0, totalRequests: 0 },
        error: null,
      };
    case "SET_SETTINGS_OPEN":
      return { ...state, settingsOpen: action.payload };
    default:
      return state;
  }
}

type AppContextValue = {
  state: AppState;
  settings: AppSettings;
  recordingState: RecordingState;
  interimTranscript: string;
  committedSegments: TranscriptSegment[];
  translationSegments: TranslationSegment[];
  pendingTranslationIds: string[];
  isTranscribing: boolean;
  latency: LatencyMetrics;
  committedText: string;
  translatedText: string;
  setSettings: (partial: Partial<AppSettings>) => void;
  setInterim: (text: string) => void;
  commitSegment: (segment: TranscriptSegment) => void;
  appendTranslation: (segment: TranslationSegment) => void;
  setRecordingState: (state: RecordingState) => void;
  addPendingTranslation: (sourceId: string) => void;
  removePendingTranslation: (sourceId: string) => void;
  setTranscribing: (value: boolean) => void;
  updateLatency: (ms: number) => void;
  setError: (message: string | null) => void;
  clearAll: () => void;
  setSettingsOpen: (open: boolean) => void;
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const setSettings = useCallback((partial: Partial<AppSettings>) => {
    dispatch({ type: "SET_SETTINGS", payload: partial });
  }, []);

  const setInterim = useCallback((text: string) => {
    dispatch({ type: "SET_INTERIM", payload: text });
  }, []);

  const commitSegment = useCallback((segment: TranscriptSegment) => {
    dispatch({ type: "COMMIT_SEGMENT", payload: segment });
  }, []);

  const appendTranslation = useCallback((segment: TranslationSegment) => {
    dispatch({ type: "APPEND_TRANSLATION", payload: segment });
  }, []);

  const setRecordingState = useCallback((recordingState: RecordingState) => {
    dispatch({ type: "SET_RECORDING_STATE", payload: recordingState });
  }, []);

  const addPendingTranslation = useCallback((sourceId: string) => {
    dispatch({ type: "ADD_PENDING_TRANSLATION", payload: sourceId });
  }, []);

  const removePendingTranslation = useCallback((sourceId: string) => {
    dispatch({ type: "REMOVE_PENDING_TRANSLATION", payload: sourceId });
  }, []);

  const setTranscribing = useCallback((value: boolean) => {
    dispatch({ type: "SET_TRANSCRIBING", payload: value });
  }, []);

  const updateLatency = useCallback((ms: number) => {
    dispatch({ type: "UPDATE_LATENCY", payload: ms });
  }, []);

  const setError = useCallback((message: string | null) => {
    dispatch({ type: "SET_ERROR", payload: message });
  }, []);

  const clearAll = useCallback(() => {
    dispatch({ type: "CLEAR_ALL" });
  }, []);

  const setSettingsOpen = useCallback((open: boolean) => {
    dispatch({ type: "SET_SETTINGS_OPEN", payload: open });
  }, []);

  const committedText = useMemo(
    () => state.committedSegments.map((s) => s.text).join(" "),
    [state.committedSegments]
  );

  const translatedText = useMemo(
    () => state.translationSegments.map((s) => s.text).join(" "),
    [state.translationSegments]
  );

  const value = useMemo<AppContextValue>(
    () => ({
      state,
      settings: state.settings,
      recordingState: state.recordingState,
      interimTranscript: state.interimTranscript,
      committedSegments: state.committedSegments,
      translationSegments: state.translationSegments,
      pendingTranslationIds: state.pendingTranslationIds,
      isTranscribing: state.isTranscribing,
      latency: state.latency,
      committedText,
      translatedText,
      setSettings,
      setInterim,
      commitSegment,
      appendTranslation,
      setRecordingState,
      addPendingTranslation,
      removePendingTranslation,
      setTranscribing,
      updateLatency,
      setError,
      clearAll,
      setSettingsOpen,
    }),
    [
      state,
      committedText,
      translatedText,
      setSettings,
      setInterim,
      commitSegment,
      appendTranslation,
      setRecordingState,
      addPendingTranslation,
      removePendingTranslation,
      setTranscribing,
      updateLatency,
      setError,
      clearAll,
      setSettingsOpen,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error("useAppContext must be used within AppProvider");
  }
  return ctx;
}
