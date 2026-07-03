"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { navLinkIds, navPath } from "@/lib/nav/config";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type NavbarMenuProps = {
  locale: Locale;
  className?: string;
};

const mobileLinkClass =
  "text-foreground hover:bg-muted flex w-full items-center rounded-none px-3 py-2.5 text-sm transition-colors";

export function NavbarMenu({ locale, className }: NavbarMenuProps) {
  const { nav } = getDictionary(locale);
  const [open, setOpen] = useState(false);

  const closeMenu = useCallback(() => setOpen(false), []);

  const triggerRender = useMemo(
    () => (
      <Button
        variant="outline"
        size="icon-sm"
        aria-label={nav.menu}
        className="shrink-0"
      />
    ),
    [nav.menu],
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className={className} render={triggerRender}>
        <Menu className="size-4" aria-hidden />
      </SheetTrigger>
      <SheetContent side="right" className="gap-0 p-0">
        <SheetHeader className="border-b border-border p-4">
          <SheetTitle>{nav.menuTitle}</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col p-2" aria-label={nav.aria}>
          {navLinkIds.map((id) => (
            <Link
              key={id}
              href={navPath(locale, id)}
              className={mobileLinkClass}
              onClick={closeMenu}
            >
              {nav.links[id]}
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
