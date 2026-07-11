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
import { getDictionary, locales, localizedPath, type Locale } from "@/lib/i18n";

type LanguageSwitcherProps = {
  locale: Locale;
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

export function LanguageSwitcher({ locale, className }: LanguageSwitcherProps) {
  const pathname = usePathname();
  const messages = getDictionary(locale);

  const triggerRender = useMemo(
    () => (
      <Button
        variant="outline"
        size="icon-sm"
        aria-label={messages.language.triggerAria}
        className="shrink-0"
      />
    ),
    [messages.language.triggerAria],
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={className} render={triggerRender}>
        <Languages className="size-4" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((target) => {
          const label = messages.locales[target];
          return (
            <LocaleMenuItem
              key={target}
              target={target}
              pathname={pathname}
              active={target === locale}
              short={label.short}
              name={label.name}
            />
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
