"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
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

function LocaleMenuItem({
  target,
  pathname,
  active,
}: {
  target: Locale;
  pathname: string;
  active: boolean;
}) {
  const label = getLocaleLabel(target);
  const href = localizedPath(target, pathname);
  const linkRender = useMemo(() => <Link href={href} />, [href]);

  return (
    <DropdownMenuItem
      render={linkRender}
      nativeButton={false}
      data-active={active ? true : undefined}
      className={active ? "bg-accent text-accent-foreground" : undefined}
    >
      <span className="w-8 font-mono text-[0.65rem]">{label.short}</span>
      <span>{label.name}</span>
    </DropdownMenuItem>
  );
}

export function LanguageSwitcher({ locale, className }: LanguageSwitcherProps) {
  const pathname = usePathname();
  const current = getLocaleLabel(locale);
  const triggerRender = useMemo(
    () => (
      <Button
        variant="outline"
        size="sm"
        aria-label={locale === "sv" ? "Byt språk" : "Change language"}
      />
    ),
    [locale],
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={className} render={triggerRender}>
        <Languages className="size-3.5 opacity-70" aria-hidden />
        <span>{current.short}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((target) => (
          <LocaleMenuItem
            key={target}
            target={target}
            pathname={pathname}
            active={target === locale}
          />
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
