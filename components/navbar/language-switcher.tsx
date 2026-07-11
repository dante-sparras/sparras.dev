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
import { localizedPath, type Locale } from "@/lib/i18n/locale";

export type LanguageOption = {
  locale: Locale;
  short: string;
  name: string;
};

type LanguageSwitcherProps = {
  locale: Locale;
  triggerAria: string;
  options: readonly LanguageOption[];
  className?: string;
};

function LocaleMenuItem({
  target,
  pathname,
  active,
  short,
  name,
}: {
  target: Locale;
  pathname: string;
  active: boolean;
  short: string;
  name: string;
}) {
  const href = localizedPath(target, pathname);
  const linkRender = useMemo(() => <Link href={href} />, [href]);

  return (
    <DropdownMenuItem
      render={linkRender}
      nativeButton={false}
      data-active={active ? true : undefined}
      className={active ? "bg-accent text-accent-foreground" : undefined}
    >
      <span className="w-8 font-mono text-[0.65rem]">{short}</span>
      <span>{name}</span>
    </DropdownMenuItem>
  );
}

export function LanguageSwitcher({
  locale,
  triggerAria,
  options,
  className,
}: LanguageSwitcherProps) {
  const pathname = usePathname();

  const triggerRender = useMemo(
    () => (
      <Button
        variant="outline"
        size="icon-sm"
        aria-label={triggerAria}
        className="shrink-0"
      />
    ),
    [triggerAria],
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={className} render={triggerRender}>
        <Languages className="size-4" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {options.map((option) => (
          <LocaleMenuItem
            key={option.locale}
            target={option.locale}
            pathname={pathname}
            active={option.locale === locale}
            short={option.short}
            name={option.name}
          />
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
