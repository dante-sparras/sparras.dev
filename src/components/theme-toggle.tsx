"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [mounted, setMounted] = useState(false);

  console.log({ resolvedTheme });

  // Avoid Hydration Mismatch
  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) return null;

  const onClick = () => setTheme(isDark ? "light" : "dark");

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={onClick}
      aria-pressed={isDark}
      className="relative h-9 w-9 cursor-pointer p-0"
    >
      <span className="sr-only">Toggle theme</span>
      <Sun
        className={`-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2 size-4 transition-all ${
          isDark
            ? "rotate-90 scale-0 opacity-0"
            : "rotate-0 scale-100 opacity-100"
        }`}
      />
      <Moon
        className={`-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2 size-4 transition-all ${
          isDark
            ? "rotate-0 scale-100 opacity-100"
            : "-rotate-90 scale-0 opacity-0"
        }`}
      />
    </Button>
  );
}
