import { type Skill, skills } from "@/content/skills";
import type { Href } from "@/content/types";
import type { Locale } from "@/i18n/locale";

/** The live scene on the card, drawn by a component of the same name. */
type ProjectIllustration = "winland" | "winshell" | "sparras-dev";

export type Project = {
  title: string;
  description: string;
  href: Href;
  illustration: ProjectIllustration;
  illustrationAlt: string;
  stack: Skill[];
};

/** Strongest first: the homepage and the resume both keep this order. */
const projectSources: {
  title: string;
  description: Record<Locale, string>;
  href: Href;
  illustration: ProjectIllustration;
  illustrationAlt: Record<Locale, string>;
  /** Names from `skills.ts`, so the card can show each skill's icon. */
  stack: string[];
}[] = [
  {
    title: "Winland",
    description: {
      en: "Keyboard-driven tiling window manager for Windows 11, built in C#.",
      sv: "Tangentbordsstyrd fönsterhanterare för Windows 11, byggd i C#.",
    },
    href: "https://github.com/dante-sparras/winland",
    illustration: "winland",
    illustrationAlt: {
      en: "Illustration of a focused window tiled beside three others",
      sv: "Illustration av ett fönster i fokus ordnat bredvid tre andra",
    },
    stack: ["C#", ".NET"],
  },
  {
    title: "Winshell",
    description: {
      en: "Desktop shell toolkit for Windows 11, built in C# and configured in QML.",
      sv: "Verktyg för skrivbordsskal i Windows 11, byggt i C# och konfigurerat i QML.",
    },
    href: "https://github.com/dante-sparras/winshell",
    illustration: "winshell",
    illustrationAlt: {
      en: "Illustration of a custom desktop with a side bar and widgets, one of three very different desktops",
      sv: "Illustration av ett anpassat skrivbord med sidofält och widgetar, ett av tre väldigt olika skrivbord",
    },
    stack: ["C#", ".NET"],
  },
  {
    title: "sparras.dev",
    description: {
      en: "This site, built with Next.js and TypeScript, in English and Swedish.",
      sv: "Den här webbplatsen, byggd med Next.js och TypeScript, på engelska och svenska.",
    },
    href: "https://github.com/dante-sparras/sparras.dev",
    illustration: "sparras-dev",
    illustrationAlt: {
      en: "Illustration of this site, whose sparras.dev card shows the site again",
      sv: "Illustration av den här webbplatsen, vars sparras.dev-kort visar webbplatsen igen",
    },
    stack: ["Next.js", "TypeScript", "TailwindCSS", "shadcn/ui", "Bun"],
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
    illustration: project.illustration,
    illustrationAlt: project.illustrationAlt[locale],
    stack: project.stack.map(getSkill),
  }));
}
