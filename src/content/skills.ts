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
    title: { en: "Programming Languages", sv: "Programspråk" },
    skills: [
      {
        name: "TypeScript",
        iconSrc: "/icons/typescript.svg",
        href: "https://www.typescriptlang.org/",
      },
      {
        name: "JavaScript",
        iconSrc: "/icons/javascript.svg",
        href: "https://developer.mozilla.org/en-US/docs/Web/JavaScript",
      },
      {
        name: "HTML",
        iconSrc: "/icons/html5.svg",
        href: "https://developer.mozilla.org/en-US/docs/Web/HTML",
      },
      {
        name: "CSS",
        iconSrc: "/icons/css.svg",
        href: "https://developer.mozilla.org/en-US/docs/Web/CSS",
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
    title: { en: "Workflow", sv: "Arbetsflöde" },
    skills: [
      {
        name: "T3 Code",
        iconSrc: "/icons/t3-code.svg",
        href: "https://t3.codes/",
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
    ],
  },
];

/** Real skills, but noise for an employer reading a one-page resume. */
const leftOffResume = new Set(["T3 Code", "Vercel", "Omarchy (Arch Linux)"]);

export function getResumeSkillCategories(locale: Locale) {
  return getSkillCategories(locale).map((category) => ({
    ...category,
    skills: category.skills.filter((skill) => !leftOffResume.has(skill.name)),
  }));
}

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

/** Shown as badges in Experience, but left out of the Skills section. */
const unlistedSkills: Skill[] = [
  {
    name: "Perforce",
    iconSrc: "/icons/perforce.svg",
    href: "https://www.perforce.com/products/p4",
  },
];

/** Every skill a badge can name, listed or not. */
export const allSkills: Skill[] = [...skills, ...unlistedSkills];
