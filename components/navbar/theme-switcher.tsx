"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme, type ThemeChoice } from "@/components/providers";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const themeChoices = [
  "system",
  "light",
  "dark",
] as const satisfies readonly ThemeChoice[];

const icons: Record<ThemeChoice, typeof Sun> = {
  system: Monitor,
  light: Sun,
  dark: Moon,
};

export type ThemeSwitcherLabels = {
  triggerAria: string;
  system: string;
  light: string;
  dark: string;
};

type ThemeSwitcherProps = {
  labels: ThemeSwitcherLabels;
  className?: string;
};

function ThemeMenuItem({
  choice,
  label,
  active,
  onSelect,
}: {
  choice: ThemeChoice;
  label: string;
  active: boolean;
  onSelect: (choice: ThemeChoice) => void;
}) {
  const Icon = icons[choice];
  const handleSelect = useCallback(() => onSelect(choice), [choice, onSelect]);

  return (
    <DropdownMenuItem
      onClick={handleSelect}
      data-active={active ? true : undefined}
      className={active ? "bg-accent text-accent-foreground" : undefined}
    >
      <Icon className="size-3.5 opacity-70" aria-hidden />
      <span>{label}</span>
    </DropdownMenuItem>
  );
}

export function ThemeSwitcher({ labels, className }: ThemeSwitcherProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleThemeSelect = useCallback(
    (choice: ThemeChoice) => {
      setTheme(choice);
    },
    [setTheme],
  );

  const active: ThemeChoice =
    theme === "light" || theme === "dark" || theme === "system"
      ? (theme as ThemeChoice)
      : "system";

  const TriggerIcon = useMemo(() => {
    if (!mounted) return Monitor;
    if (active === "system") {
      return resolvedTheme === "dark" ? Moon : Sun;
    }
    return icons[active];
  }, [active, mounted, resolvedTheme]);

  const triggerRender = useMemo(
    () => (
      <Button
        variant="outline"
        size="icon-sm"
        aria-label={labels.triggerAria}
        className="shrink-0"
      />
    ),
    [labels.triggerAria],
  );

  const choiceLabels: Record<ThemeChoice, string> = {
    system: labels.system,
    light: labels.light,
    dark: labels.dark,
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={className} render={triggerRender}>
        <TriggerIcon className="size-4" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {themeChoices.map((choice) => (
          <ThemeMenuItem
            key={choice}
            choice={choice}
            label={choiceLabels[choice]}
            active={active === choice}
            onSelect={handleThemeSelect}
          />
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
