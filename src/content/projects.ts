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
      en: "Portfolio built with Next.js and TypeScript.",
      sv: "Portfolio byggd med Next.js och TypeScript.",
    },
    href: "https://github.com/dante-sparras/sparras.dev",
    imageSrc: "/banner/black-hole-banner.png",
    stack: ["Next.js", "TypeScript", "TailwindCSS", "shadcn/ui", "Bun"],
  },
  {
    title: "Winland",
    description: {
      en: "Keyboard-driven tiling window manager for Windows 11, built in C#.",
      sv: "Tangentbordsstyrd fönsterhanterare för Windows 11, byggd i C#.",
    },
    href: "https://github.com/dante-sparras/winland",
    stack: ["C#"],
  },
  {
    title: "Winshell",
    description: {
      en: "Desktop shell toolkit for Windows 11, built in C# and configured in QML.",
      sv: "Verktyg för skrivbordsskal i Windows 11, byggt i C# och konfigurerat i QML.",
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

/** Strongest first, and only projects a reader can open: Winoma's repo is private. */
const resumeProjectTitles = ["Winland", "Winshell", "sparras.dev"];

function getSkill(name: string) {
  const skill = skills.find((entry) => entry.name === name);
  if (!skill) throw new Error(`Unknown skill in project stack: ${name}`);
  return skill;
}

export function getResumeProjects(locale: Locale): Project[] {
  const projects = getProjects(locale);
  return resumeProjectTitles.flatMap((title) =>
    projects.filter((project) => project.title === title),
  );
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
