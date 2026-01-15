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
  { title: "Home", href: "/" },
  { title: "Documentation", href: "/" },
  { title: "Components", href: "/" },
  { title: "Blog", href: "/" },
  { title: "About", href: "/" },
];

export function Nav() {
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            navigationMenuTriggerStyle(),
            "md:hidden flex mr-auto size-7 px-0 cursor-pointer",
          )}
        >
          <MenuIcon className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="md:hidden">
          {navLinks.map((link) => (
            <DropdownMenuItem key={link.title} className="cursor-pointer">
              <Link href={link.href}>{link.title}</Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <NavigationMenu className="hidden md:flex">
        <NavigationMenuList>
          {navLinks.map((link) => (
            <NavigationMenuItem key={link.title}>
              <NavigationMenuLink
                className={navigationMenuTriggerStyle()}
                render={<Link href={link.href}>{link.title}</Link>}
              ></NavigationMenuLink>
            </NavigationMenuItem>
          ))}
        </NavigationMenuList>
      </NavigationMenu>
    </>
  );
}
