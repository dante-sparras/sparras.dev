import { type Skill, skills } from "@/content/skills";
import type { Href, ImageSrc } from "@/content/types";
import type { Locale } from "@/i18n/locale";

export type Project = {
  title: string;
  description: string;
  href: Href;
  imageSrc?: ImageSrc;
  stack: Skill[];
};

const projectSources: {
  title: string;
  description: Record<Locale, string>;
  href: Href;
  imageSrc?: ImageSrc;
  /** Names from `skills.ts`, so the card can show each skill's icon. */
  stack: string[];
}[] = [
  {
    title: "sparras.dev",
    description: {
      en: "My personal website built with Next.js, Tailwind CSS, and shadcn/ui.",
      sv: "Min personliga webbplats byggd med Next.js, Tailwind CSS och shadcn/ui.",
    },
    href: "https://github.com/dante-sparras/sparras.dev",
    imageSrc: "/banner/black-hole-banner.png",
    stack: ["Next.js", "TypeScript", "TailwindCSS", "shadcn/ui", "Bun"],
  },
  {
    title: "Winland",
    description: {
      en: "A keyboard-driven tiling window manager for Windows 11.",
      sv: "En tangentbordsstyrd tiling-fönsterhanterare för Windows 11.",
    },
    href: "https://github.com/dante-sparras/winland",
    stack: ["C#"],
  },
  {
    title: "Winshell",
    description: {
      en: "A shell toolkit for Windows 11 that matches Quickshell.",
      sv: "Ett verktygskit för skal i Windows 11 som matchar Quickshell.",
    },
    href: "https://github.com/dante-sparras/winshell",
    stack: ["C#"],
  },
  {
    title: "Winoma",
    description: {
      en: "Omarchy for Windows 11.",
      sv: "Omarchy för Windows 11.",
    },
    href: "https://github.com/dante-sparras/winoma",
    stack: ["C#"],
  },
];

function getSkill(name: string) {
  const skill = skills.find((entry) => entry.name === name);
  if (!skill) throw new Error(`Unknown skill in project stack: ${name}`);
  return skill;
}

export function getProjects(locale: Locale): Project[] {
  return projectSources.map((project) => ({
    title: project.title,
    description: project.description[locale],
    href: project.href,
    imageSrc: project.imageSrc,
    stack: project.stack.map(getSkill),
  }));
}
