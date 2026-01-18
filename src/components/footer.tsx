import Image from "next/image";
import Link from "next/link";
import React from "react";
import { Muted } from "./typography/muted";

interface LinkItemBase {
  href: React.ComponentProps<typeof Link>["href"];
}
interface LinkItemWithIcon extends LinkItemBase {
  icon: React.ReactNode;
  text?: never;
}
interface LinkItemWithText extends LinkItemBase {
  text: string;
  icon?: never;
}
type LinkItem = LinkItemWithIcon | LinkItemWithText;

// #region DATA
const madeWithLinks: LinkItem[] = [
  {
    href: "https://nextjs.org",
    text: "Next.js",
  },
  {
    href: "https://ui.shadcn.com",
    text: "Shadcn/ui",
  },
  {
    href: "https://tailwindcss.com",
    text: "Tailwind CSS",
  },
];

const socialLinks: LinkItem[] = [
  {
    href: "https://x.com/DanteSparras",
    icon: (
      <Image
        src="/x.svg"
        alt="X Logo"
        width={16}
        height={16}
        className="dark:brightness-0 dark:invert dark:filter"
      />
    ),
  },
  {
    href: "https://www.linkedin.com/in/dante-sparras/",
    icon: (
      <Image
        src="/linkedin.svg"
        alt="LinkedIn Logo"
        width={16}
        height={16}
        className="dark:brightness-0 dark:invert dark:filter"
      />
    ),
  },
  {
    href: "https://github.com/dante-sparras",
    icon: (
      <Image
        src="/github.svg"
        alt="GitHub Logo"
        width={16}
        height={16}
        className="dark:brightness-0 dark:invert dark:filter"
      />
    ),
  },
];
// #endregion

export function Footer() {
  return (
    <footer className="flex flex-col items-center gap-6 border-t px-4 py-6 md:px-6">
      <Muted className="text-center">
        Made with{" "}
        {madeWithLinks.map((link) => (
          <React.Fragment key={link.href.toString()}>
            <Link href={link.href} className="text-blue-400 hover:underline">
              {link.text}
            </Link>{" "}
          </React.Fragment>
        ))}
        ❤️
      </Muted>
      <ul className="flex w-full flex-row justify-center">
        {socialLinks.map((link) => (
          <li
            key={link.href.toString()}
            className="flex size-10 items-center justify-center"
          >
            <Link href={link.href}>{link.icon ? link.icon : link.text}</Link>
          </li>
        ))}
      </ul>
    </footer>
  );
}
