import { describe, expect, test } from "bun:test";
import { getSkillCategories, type Skill, skills } from "@/content/skills";

const catalog: Skill[] = [
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
  { name: "React", iconSrc: "/icons/react.svg", href: "https://react.dev/" },
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
  { name: "Unity", iconSrc: "/icons/unity.svg", href: "https://unity.com/" },
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
  { name: "Git", iconSrc: "/icons/git.svg", href: "https://git-scm.com/" },
  { name: "GitHub", iconSrc: "/icons/github.svg", href: "https://github.com/" },
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
];

describe("getSkillCategories", () => {
  test("keeps every skill once, with its name, icon, and link", () => {
    const listed = getSkillCategories("en").flatMap(
      (category) => category.skills,
    );

    expect(listed).toEqual(catalog);
    expect(skills).toEqual(catalog);
    expect(new Set(listed.map((skill) => skill.name)).size).toBe(listed.length);
  });

  test("groups the stack into web, games, backend, and tools", () => {
    expect(
      getSkillCategories("en").map((category) => ({
        id: category.id,
        title: category.title,
        names: category.skills.map((skill) => skill.name),
      })),
    ).toEqual([
      {
        id: "web",
        title: "Web",
        names: [
          "Next.js",
          "shadcn/ui",
          "TailwindCSS",
          "React",
          "TypeScript",
          "JavaScript",
          "CSS",
          "HTML5",
        ],
      },
      {
        id: "game-development",
        title: "Game development",
        names: ["Unity", "C#", "C++"],
      },
      {
        id: "backend",
        title: "Backend",
        names: ["Convex", "Bun", "Node.js"],
      },
      {
        id: "tools",
        title: "Tools",
        names: ["Git", "GitHub", "Visual Studio Code", "Visual Studio"],
      },
    ]);
  });

  test("translates category titles without moving the skills", () => {
    const english = getSkillCategories("en");
    const swedish = getSkillCategories("sv");

    expect(swedish.map((category) => category.title)).toEqual([
      "Webb",
      "Spelutveckling",
      "Backend",
      "Verktyg",
    ]);
    expect(swedish.map((category) => category.id)).toEqual(
      english.map((category) => category.id),
    );
    expect(swedish.map((category) => category.skills)).toEqual(
      english.map((category) => category.skills),
    );
  });
});
