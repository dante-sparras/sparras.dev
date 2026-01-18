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

const navLinks: NavLink[] = [
  { title: "Showcase", href: "/" },
  { title: "Blog", href: "/" },
];

export function Nav() {
  return (
    <>
      {/** Mobile */}
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            navigationMenuTriggerStyle(),
            "mr-auto flex size-9 cursor-pointer px-0 md:hidden",
          )}
        >
          <MenuIcon className="size-5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="md:hidden">
          {navLinks.map((link) => (
            <DropdownMenuItem key={link.title} className="cursor-pointer">
              <Link href={link.href}>{link.title}</Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/** Desktop */}
      <NavigationMenu className="hidden md:flex">
        <NavigationMenuList>
          {navLinks.map((link) => (
            <NavigationMenuItem key={link.title}>
              <NavigationMenuLink
                className={cn(navigationMenuTriggerStyle(), "h-9")}
                render={<Link href={link.href}>{link.title}</Link>}
              ></NavigationMenuLink>
            </NavigationMenuItem>
          ))}
        </NavigationMenuList>
      </NavigationMenu>
    </>
  );
}
