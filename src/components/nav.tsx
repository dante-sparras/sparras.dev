"use client";

import { Menu as MenuIcon } from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";

type NavLink = {
  title: string;
  href: React.ComponentProps<typeof Link>["href"];
};

export type NavData = NavLink[];

export function NavDropdown({
  data,
  className,
}: {
  data: NavData;
  className?: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          navigationMenuTriggerStyle(),
          "mr-auto size-9 cursor-pointer px-0",
          className,
        )}
      >
        <MenuIcon className="size-5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="md:hidden"
        render={
          <nav aria-label="Main navigation">
            {data.map((link) => (
              <DropdownMenuItem
                key={link.title}
                render={<Link href={link.href}>{link.title}</Link>}
                className="cursor-pointer"
              />
            ))}
          </nav>
        }
      ></DropdownMenuContent>
    </DropdownMenu>
  );
}

export function NavList({
  data,
  className,
}: {
  data: NavLink[];
  className?: string;
}) {
  return (
    <NavigationMenu className={className} aria-label="Main navigation">
      <NavigationMenuList>
        {data.map((link) => (
          <NavigationMenuItem key={link.title}>
            <NavigationMenuLink
              className={cn(navigationMenuTriggerStyle(), "h-9")}
              render={<Link href={link.href}>{link.title}</Link>}
            ></NavigationMenuLink>
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  );
}
