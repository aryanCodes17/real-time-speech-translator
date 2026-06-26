export function debounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  waitMs: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      timeoutId = null;
      fn(...args);
    }, waitMs);
  };
}

export function debounceLeading<T extends (...args: Parameters<T>) => void>(
  fn: T,
  waitMs: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let called = false;

  return (...args: Parameters<T>) => {
    if (!called) {
      called = true;
      fn(...args);
    }
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      called = false;
      timeoutId = null;
    }, waitMs);
  };
}
