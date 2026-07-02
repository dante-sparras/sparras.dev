"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type Locale, locales } from "@/lib/i18n/config";
import { getLocaleLabel, localizedPath } from "@/lib/i18n/paths";

type LanguageSwitcherProps = {
  locale: Locale;
  className?: string;
};

export function LanguageSwitcher({ locale, className }: LanguageSwitcherProps) {
  const pathname = usePathname();
  const current = getLocaleLabel(locale);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={className}
        render={
          <Button
            variant="outline"
            size="sm"
            aria-label={locale === "sv" ? "Byt språk" : "Change language"}
          />
        }
      >
        <Languages className="size-3.5 opacity-70" aria-hidden />
        <span>{current.short}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((target) => {
          const label = getLocaleLabel(target);
          const href = localizedPath(target, pathname);
          const isActive = target === locale;

          return (
            <DropdownMenuItem
              key={target}
              render={<Link href={href} />}
              nativeButton={false}
              data-active={isActive ? true : undefined}
              className={
                isActive ? "bg-accent text-accent-foreground" : undefined
              }
            >
              <span className="w-8 font-mono text-[0.65rem]">
                {label.short}
              </span>
              <span>{label.name}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
