"use client";

import { memo, useEffect, useRef } from "react";
import { useAppContext } from "@/context/AppContext";

function TranslationPanelComponent() {
  const {
    translatedText,
    pendingTranslationIds,
    translationSegments,
  } = useAppContext();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [translatedText, pendingTranslationIds.length]);

  const isEmpty =
    !translatedText && pendingTranslationIds.length === 0;

  return (
    <section className="flex min-h-[280px] flex-1 flex-col rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Translation
        </h2>
      </div>
      <div
        ref={scrollRef}
        className="panel-scroll flex-1 overflow-y-auto px-4 py-4 text-base leading-relaxed text-slate-800 dark:text-slate-100"
      >
        {isEmpty ? (
          <p className="text-slate-400 dark:text-slate-500">
            Translations will appear here as segments are committed…
          </p>
        ) : (
          <>
            {translationSegments.map((segment) => (
              <span key={segment.id} className="mr-1">
                {segment.text}{" "}
              </span>
            ))}
            {pendingTranslationIds.length > 0 && (
              <span className="inline-flex items-center gap-1 text-sm text-slate-500">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-400" />
                Translating…
              </span>
            )}
          </>
        )}
      </div>
    </section>
  );
}

export const TranslationPanel = memo(TranslationPanelComponent);
