const MAX_CACHE_SIZE = 200;

export type TranslationCacheKey = {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
  model: string;
};

function buildKey(params: TranslationCacheKey): string {
  return [
    params.text.trim(),
    params.sourceLanguage,
    params.targetLanguage,
    params.model,
  ].join("::");
}

class TranslationCache {
  private store = new Map<string, string>();

  get(params: TranslationCacheKey): string | undefined {
    return this.store.get(buildKey(params));
  }

  set(params: TranslationCacheKey, translatedText: string): void {
    const key = buildKey(params);
    if (this.store.has(key)) {
      this.store.delete(key);
    }
    this.store.set(key, translatedText);
    this.evictIfNeeded();
  }

  clear(): void {
    this.store.clear();
  }

  private evictIfNeeded(): void {
    while (this.store.size > MAX_CACHE_SIZE) {
      const firstKey = this.store.keys().next().value;
      if (firstKey) this.store.delete(firstKey);
      else break;
    }
  }
}

export const translationCache = new TranslationCache();
