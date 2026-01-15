"use client";

import Link from "next/link";

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

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

export function Navbar() {
  return (
    <NavigationMenu>
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
  );
}
