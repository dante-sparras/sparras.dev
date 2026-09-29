import { useCallback, useSyncExternalStore } from "react";

const CHANGE_EVENT = "stored-preference-change";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

/**
 * A string preference persisted in localStorage.
 *
 * The server and the first client render use `fallback`, so hydration
 * never mismatches. The saved value is picked up right after hydration
 * and stays in sync across tabs and across components using the same key.
 */
export function useStoredPreference<T extends string>(
  key: string,
  options: readonly T[],
  fallback: T,
) {
  const value = useSyncExternalStore(
    subscribe,
    () => {
      try {
        const stored = window.localStorage.getItem(key);
        return options.find((option) => option === stored) ?? fallback;
      } catch {
        return fallback;
      }
    },
    () => fallback,
  );

  const setValue = useCallback(
    (next: T) => {
      try {
        window.localStorage.setItem(key, next);
      } catch {
        // Storage can be blocked (private mode); the choice is then not saved.
      }
      window.dispatchEvent(new Event(CHANGE_EVENT));
    },
    [key],
  );

  return [value, setValue] as const;
}
