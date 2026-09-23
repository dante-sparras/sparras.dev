import type { Href } from "@/content/types";

export type Project = {
  title: string;
  description: string;
  href: Href;
};

export const projects: Project[] = [
  {
    title: "sparras.dev",
    description:
      "My personal website built with Next.js, Tailwind CSS, and shadcn/ui.",
    href: "https://github.com/dante-sparras/sparras.dev",
  },
];
