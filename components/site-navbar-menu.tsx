"use client";

import { Menu } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { navAnchors, navLinkIds, resumePath } from "@/lib/nav/config";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type SiteNavbarMenuProps = {
  locale: Locale;
  className?: string;
};

const mobileLinkClass =
  "text-foreground hover:bg-muted flex w-full items-center rounded-none px-3 py-2.5 text-sm transition-colors";

export function SiteNavbarMenu({ locale, className }: SiteNavbarMenuProps) {
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
            <a
              key={id}
              href={navAnchors[id]}
              className={mobileLinkClass}
              onClick={closeMenu}
            >
              {nav.links[id]}
            </a>
          ))}
        </nav>
        <div className="mt-auto border-t border-border p-4">
          <a
            href={resumePath}
            download
            className={cn(buttonVariants({ size: "sm" }), "w-full")}
            onClick={closeMenu}
          >
            {nav.resume}
          </a>
        </div>
      </SheetContent>
    </Sheet>
  );
}
