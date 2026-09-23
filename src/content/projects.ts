import type { Href } from "@/content/types";
import type { Locale } from "@/i18n/locale";

export type Project = {
  title: string;
  description: string;
  href: Href;
};

const projectSources: {
  title: string;
  description: Record<Locale, string>;
  href: Href;
}[] = [
  {
    title: "sparras.dev",
    description: {
      en: "My personal website built with Next.js, Tailwind CSS, and shadcn/ui.",
      sv: "Min personliga webbplats byggd med Next.js, Tailwind CSS och shadcn/ui.",
    },
    href: "https://github.com/dante-sparras/sparras.dev",
  },
];

export function getProjects(locale: Locale): Project[] {
  return projectSources.map((project) => ({
    title: project.title,
    description: project.description[locale],
    href: project.href,
  }));
}
