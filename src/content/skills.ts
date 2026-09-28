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
        name: "JavaScript",
        iconSrc: "/icons/javascript.svg",
        href: "https://developer.mozilla.org/en-US/docs/Web/JavaScript",
      },
      {
        name: "HTML5",
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
    ],
  },
  {
    id: "frameworks",
    title: { en: "Frameworks", sv: "Ramverk" },
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
        name: "Convex",
        iconSrc: "/icons/convex.svg",
        href: "https://www.convex.dev/",
      },
      {
        name: "Unity",
        iconSrc: "/icons/unity.svg",
        href: "https://unity.com/",
      },
    ],
  },
  {
    id: "tools",
    title: { en: "Tools", sv: "Verktyg" },
    skills: [
      {
        name: "Node.js",
        iconSrc: "/icons/nodejs.svg",
        href: "https://nodejs.org/en",
      },
      { name: "Bun", iconSrc: "/icons/bun.svg", href: "https://bun.com/" },
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
