"use client";

/**
 * Next-safe theme provider (class strategy on <html>).
 * Replaces next-themes to avoid React 19 / Next 16 client <script> warnings.
 * Blocking FOUC script lives in app/layout.tsx (THEME_INIT_SCRIPT).
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

export type ThemeChoice = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

type ThemeContextValue = {
  theme: ThemeChoice;
  setTheme: (theme: ThemeChoice | ((prev: ThemeChoice) => ThemeChoice)) => void;
  resolvedTheme: ResolvedTheme | undefined;
  themes: ThemeChoice[];
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
    if (raw === "light" || raw === "dark" || raw === "system") return raw;
  } catch {
    /* ignore */
  }
  return defaultTheme;
}

export type ThemeProviderProps = {
  children: ReactNode;
  /** default: system */
  defaultTheme?: ThemeChoice;
  /** API parity with former next-themes layout props — class is always used */
  attribute?: "class";
  enableSystem?: boolean;
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
      themes: ["light", "dark", "system"],
      systemTheme,
    }),
    [theme, setTheme, resolvedTheme, systemTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

/** Drop-in for former next-themes `useTheme` call sites. */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return {
      theme: "system",
      setTheme: () => {},
      resolvedTheme: undefined,
      themes: ["light", "dark", "system"],
      systemTheme: undefined,
    };
  }
  return ctx;
}
