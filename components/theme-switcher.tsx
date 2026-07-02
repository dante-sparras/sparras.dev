"use client";

import { useTheme } from "next-themes";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Locale } from "@/lib/i18n/config";
import {
  getThemeLabels,
  themeChoices,
  type ThemeChoice,
} from "@/lib/theme/labels";

const icons: Record<ThemeChoice, typeof Sun> = {
  system: Monitor,
  light: Sun,
  dark: Moon,
};

type ThemeSwitcherProps = {
  locale: Locale;
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

export function ThemeSwitcher({ locale, className }: ThemeSwitcherProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const copy = getThemeLabels(locale);

  useEffect(() => {
    setMounted(true);
  }, []);

  const active: ThemeChoice =
    theme === "light" || theme === "dark" || theme === "system"
      ? theme
      : "system";

  const TriggerIcon = useMemo(() => {
    if (!mounted) return Monitor;
    if (active === "system") {
      return resolvedTheme === "dark" ? Moon : Sun;
    }
    return icons[active];
  }, [active, mounted, resolvedTheme]);

  const triggerRender = useMemo(
    () => <Button variant="outline" size="sm" aria-label={copy.trigger} />,
    [copy.trigger],
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={className} render={triggerRender}>
        <TriggerIcon className="size-3.5 opacity-70" aria-hidden />
        <span className="max-w-16 truncate">
          {mounted ? copy.short[active] : copy.short.system}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {themeChoices.map((choice) => (
          <ThemeMenuItem
            key={choice}
            choice={choice}
            label={copy[choice]}
            active={active === choice}
            onSelect={setTheme}
          />
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
