import type { Href, ImageSrc } from "@/content/types";
import type { Locale } from "@/i18n/locale";

export type Skill = {
  name: string;
  iconSrc: ImageSrc;
  href: Href;
};

type SkillCategory = {
  id: string;
  title: Record<Locale, string>;
  skills: Skill[];
};

const skillCategories: SkillCategory[] = [
  {
    id: "languages",
    title: { en: "Languages", sv: "Språk" },
    skills: [
      {
        name: "TypeScript",
        iconSrc: "/icons/typescript.svg",
        href: "https://www.typescriptlang.org/",
      },
      {
        name: "C#",
        iconSrc: "/icons/c-sharp.svg",
        href: "https://learn.microsoft.com/en-us/dotnet/csharp/",
      },
      {
        name: "C++",
        iconSrc: "/icons/c-plus-plus.svg",
        href: "https://learn.microsoft.com/en-us/cpp/cpp/?view=msvc-170",
      },
      {
        name: "Python",
        iconSrc: "/icons/python.svg",
        href: "https://www.python.org/",
      },
    ],
  },
  {
    id: "frontend",
    title: { en: "Frontend", sv: "Frontend" },
    skills: [
      {
        name: "Next.js",
        iconSrc: "/icons/nextjs.svg",
        href: "https://nextjs.org/",
      },
      {
        name: "React",
        iconSrc: "/icons/react.svg",
        href: "https://react.dev/",
      },
      {
        name: "TailwindCSS",
        iconSrc: "/icons/tailwindcss.svg",
        href: "https://tailwindcss.com/",
      },
      {
        name: "shadcn/ui",
        iconSrc: "/icons/shadcn-ui.svg",
        href: "https://ui.shadcn.com/",
      },
      {
        name: "Base UI",
        iconSrc: "/icons/base-ui.svg",
        href: "https://base-ui.com/",
      },
      {
        name: "Expo",
        iconSrc: "/icons/expo.svg",
        href: "https://expo.dev/",
      },
    ],
  },
  {
    id: "backend",
    title: { en: "Backend & Cloud", sv: "Backend och moln" },
    skills: [
      { name: "Bun", iconSrc: "/icons/bun.svg", href: "https://bun.com/" },
      {
        name: "Node.js",
        iconSrc: "/icons/nodejs.svg",
        href: "https://nodejs.org/en",
      },
      {
        name: "PostgreSQL",
        iconSrc: "/icons/postgresql.svg",
        href: "https://www.postgresql.org/",
      },
      {
        name: "Convex",
        iconSrc: "/icons/convex.svg",
        href: "https://www.convex.dev/",
      },
      {
        name: "ASP.NET",
        iconSrc: "/icons/dotnet.svg",
        href: "https://dotnet.microsoft.com/en-us/apps/aspnet",
      },
      {
        name: "SQL Server",
        iconSrc: "/icons/sql-server.svg",
        href: "https://www.microsoft.com/en-us/sql-server",
      },
    ],
  },
  {
    id: "game-development",
    title: { en: "Game Development", sv: "Spelutveckling" },
    skills: [
      {
        name: "Unity",
        iconSrc: "/icons/unity.svg",
        href: "https://unity.com/",
      },
      {
        name: "Aseprite",
        iconSrc: "/icons/aseprite.svg",
        href: "https://www.aseprite.org/",
      },
      {
        name: "Blender",
        iconSrc: "/icons/blender.svg",
        href: "https://www.blender.org/",
      },
    ],
  },
  {
    id: "workflow",
    title: { en: "Workflow & AI", sv: "Arbetsflöde och AI" },
    skills: [
      {
        name: "Cursor",
        iconSrc: "/icons/cursor.svg",
        href: "https://cursor.com/",
      },
      { name: "Git", iconSrc: "/icons/git.svg", href: "https://git-scm.com/" },
      {
        name: "GitHub",
        iconSrc: "/icons/github.svg",
        href: "https://github.com/",
      },
      {
        name: "Docker",
        iconSrc: "/icons/docker.svg",
        href: "https://www.docker.com/",
      },
      {
        name: "Vercel",
        iconSrc: "/icons/vercel.svg",
        href: "https://vercel.com/",
      },
      {
        name: "Cloudflare",
        iconSrc: "/icons/cloudflare.svg",
        href: "https://www.cloudflare.com/",
      },
      {
        name: "Omarchy (Arch Linux)",
        iconSrc: "/icons/omarchy.svg",
        href: "https://omarchy.org/",
      },
      {
        name: "Hermes Agent",
        iconSrc: "/icons/hermes-agent.png",
        href: "https://hermes-agent.nousresearch.com/",
      },
      {
        name: "Grok Build",
        iconSrc: "/icons/grok-build.png",
        href: "https://docs.x.ai/build/overview",
      },
    ],
  },
];

export function getSkillCategories(locale: Locale) {
  return skillCategories.map(({ id, title, skills }) => ({
    id,
    title: title[locale],
    skills,
  }));
}

export const skills: Skill[] = skillCategories.flatMap(
  (category) => category.skills,
);
