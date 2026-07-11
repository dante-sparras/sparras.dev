"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export type NavbarMenuLink = {
  href: string;
  label: string;
};

type NavbarMenuProps = {
  menuLabel: string;
  menuTitle: string;
  navAria: string;
  links: readonly NavbarMenuLink[];
  className?: string;
};

const mobileLinkClass =
  "text-foreground hover:bg-muted flex w-full items-center rounded-none px-3 py-2.5 text-sm transition-colors";

export function NavbarMenu({
  menuLabel,
  menuTitle,
  navAria,
  links,
  className,
}: NavbarMenuProps) {
  const [open, setOpen] = useState(false);

  const closeMenu = useCallback(() => setOpen(false), []);

  const triggerRender = useMemo(
    () => (
      <Button
        variant="outline"
        size="icon-sm"
        aria-label={menuLabel}
        className="shrink-0"
      />
    ),
    [menuLabel],
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className={className} render={triggerRender}>
        <Menu className="size-4" aria-hidden />
      </SheetTrigger>
      <SheetContent side="right" className="gap-0 p-0">
        <SheetHeader className="border-b border-border p-4">
          <SheetTitle>{menuTitle}</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col p-2" aria-label={navAria}>
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={mobileLinkClass}
              onClick={closeMenu}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
