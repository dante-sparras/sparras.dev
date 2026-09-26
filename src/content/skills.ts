import type { Href, ImageSrc } from "@/content/types";
import type { Locale } from "@/i18n/locale";

export type Skill = {
  name: string;
  iconSrc: ImageSrc;
  href: Href;
};

export type SkillCategoryId = "web" | "game-development" | "backend" | "tools";

export type SkillCategory = {
  id: SkillCategoryId;
  title: string;
  skills: readonly Skill[];
};

const categoryTitles: Record<SkillCategoryId, Record<Locale, string>> = {
  web: { en: "Web", sv: "Webb" },
  "game-development": { en: "Game development", sv: "Spelutveckling" },
  backend: { en: "Backend", sv: "Backend" },
  tools: { en: "Tools", sv: "Verktyg" },
};

const skillGroups: { id: SkillCategoryId; skills: readonly Skill[] }[] = [
  {
    id: "web",
    skills: [
      {
        name: "Next.js",
        iconSrc: "/icons/nextjs.svg",
        href: "https://nextjs.org/",
      },
      {
        name: "shadcn/ui",
        iconSrc: "/icons/shadcn-ui.svg",
        href: "https://ui.shadcn.com/",
      },
      {
        name: "TailwindCSS",
        iconSrc: "/icons/tailwindcss.svg",
        href: "https://tailwindcss.com/",
      },
      {
        name: "React",
        iconSrc: "/icons/react.svg",
        href: "https://react.dev/",
      },
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
        name: "CSS",
        iconSrc: "/icons/css.svg",
        href: "https://developer.mozilla.org/en-US/docs/Web/CSS",
      },
      {
        name: "HTML5",
        iconSrc: "/icons/html5.svg",
        href: "https://developer.mozilla.org/en-US/docs/Web/HTML",
      },
    ],
  },
  {
    id: "game-development",
    skills: [
      {
        name: "Unity",
        iconSrc: "/icons/unity.svg",
        href: "https://unity.com/",
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
    ],
  },
  {
    id: "backend",
    skills: [
      {
        name: "Convex",
        iconSrc: "/icons/convex.svg",
        href: "https://www.convex.dev/",
      },
      { name: "Bun", iconSrc: "/icons/bun.svg", href: "https://bun.com/" },
      {
        name: "Node.js",
        iconSrc: "/icons/nodejs.svg",
        href: "https://nodejs.org/en",
      },
    ],
  },
  {
    id: "tools",
    skills: [
      { name: "Git", iconSrc: "/icons/git.svg", href: "https://git-scm.com/" },
      {
        name: "GitHub",
        iconSrc: "/icons/github.svg",
        href: "https://github.com/",
      },
      {
        name: "Visual Studio Code",
        iconSrc: "/icons/vscode.svg",
        href: "https://code.visualstudio.com/",
      },
      {
        name: "Visual Studio",
        iconSrc: "/icons/visual-studio.svg",
        href: "https://visualstudio.microsoft.com/",
      },
    ],
  },
];

export function getSkillCategories(locale: Locale): SkillCategory[] {
  return skillGroups
    .filter((group) => group.skills.length > 0)
    .map((group) => ({
      id: group.id,
      title: categoryTitles[group.id][locale],
      skills: group.skills,
    }));
}

export const skills: readonly Skill[] = skillGroups.flatMap(
  (group) => group.skills,
);
