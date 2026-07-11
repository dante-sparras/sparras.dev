"use client";

/**
 * Next-safe theme provider (class strategy on <html>).
 * Replaces next-themes to avoid React 19 / Next 16 client <script> warnings.
 * Blocking FOUC script lives in app/layout.tsx (THEME_INIT_SCRIPT).
 *
 * Owns all theme mode types — import `ThemeChoice` / `ResolvedTheme` from here
 * (via `@/components/providers`), not from hooks.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { THEME_STORAGE_KEY } from "./theme-script";

/** User-selectable themes (stored preference). */
export const THEME_CHOICES = ["light", "dark", "system"] as const;
export type ThemeChoice = (typeof THEME_CHOICES)[number];

/** Applied document theme (`light` / `dark` class on <html>). */
export type ResolvedTheme = Exclude<ThemeChoice, "system">;

const THEME_CHOICE_SET: ReadonlySet<string> = new Set(THEME_CHOICES);

function isThemeChoice(value: string): value is ThemeChoice {
  return THEME_CHOICE_SET.has(value);
}

type ThemeContextValue = {
  theme: ThemeChoice;
  setTheme: (theme: ThemeChoice | ((prev: ThemeChoice) => ThemeChoice)) => void;
  resolvedTheme: ResolvedTheme | undefined;
  themes: readonly ThemeChoice[];
  systemTheme: ResolvedTheme | undefined;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const MEDIA = "(prefers-color-scheme: dark)";

function readSystem(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia(MEDIA).matches ? "dark" : "light";
}

function applyDomTheme(choice: ThemeChoice): ResolvedTheme {
  const resolved: ResolvedTheme = choice === "system" ? readSystem() : choice;
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(resolved);
  root.style.colorScheme = resolved;
  return resolved;
}

function readStored(defaultTheme: ThemeChoice): ThemeChoice {
  if (typeof window === "undefined") return defaultTheme;
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    if (raw && isThemeChoice(raw)) return raw;
  } catch {
    /* ignore */
  }
  return defaultTheme;
}

export type ThemeProviderProps = {
  children: ReactNode;
  /** default: system */
  defaultTheme?: ThemeChoice;
  disableTransitionOnChange?: boolean;
};

export function ThemeProvider({
  children,
  defaultTheme = "system",
  disableTransitionOnChange = false,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeChoice>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme | undefined>(
    undefined,
  );
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme | undefined>(
    undefined,
  );
  const [mounted, setMounted] = useState(false);

  // Hydrate from localStorage (script already set class for FOUC).
  useEffect(() => {
    const stored = readStored(defaultTheme);
    setThemeState(stored);
    setSystemTheme(readSystem());
    setResolvedTheme(applyDomTheme(stored));
    setMounted(true);
  }, [defaultTheme]);

  // Apply when user changes theme after mount.
  useEffect(() => {
    if (!mounted) return;

    let release: (() => void) | undefined;
    if (disableTransitionOnChange) {
      const style = document.createElement("style");
      style.appendChild(
        document.createTextNode(
          "*,*::before,*::after{-webkit-transition:none!important;transition:none!important}",
        ),
      );
      document.head.appendChild(style);
      release = () => {
        window.getComputedStyle(document.body);
        setTimeout(() => style.remove(), 1);
      };
    }

    setResolvedTheme(applyDomTheme(theme));
    release?.();
  }, [theme, mounted, disableTransitionOnChange]);

  // System preference changes while on "system".
  useEffect(() => {
    if (!mounted) return;
    const mq = window.matchMedia(MEDIA);
    const onChange = () => {
      const sys = readSystem();
      setSystemTheme(sys);
      if (theme === "system") setResolvedTheme(applyDomTheme("system"));
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme, mounted]);

  // Cross-tab sync
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== THEME_STORAGE_KEY) return;
      setThemeState(readStored(defaultTheme));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [defaultTheme]);

  const setTheme = useCallback(
    (next: ThemeChoice | ((prev: ThemeChoice) => ThemeChoice)) => {
      setThemeState((prev) => {
        const value = typeof next === "function" ? next(prev) : next;
        try {
          localStorage.setItem(THEME_STORAGE_KEY, value);
        } catch {
          /* ignore */
        }
        return value;
      });
    },
    [],
  );

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme,
      resolvedTheme,
      themes: THEME_CHOICES,
      systemTheme,
    }),
    [theme, setTheme, resolvedTheme, systemTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

/** Theme context for client components under ThemeProvider. */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return {
      theme: "system",
      setTheme: () => {},
      resolvedTheme: undefined,
      themes: THEME_CHOICES,
      systemTheme: undefined,
    };
  }
  return ctx;
}
