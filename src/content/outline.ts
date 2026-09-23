import { posts } from "@/content/posts";
import { getProjects } from "@/content/projects";
import { getReferences } from "@/content/references";
import { skills } from "@/content/skills";
import type { Locale } from "@/i18n/locale";
import { defaultLocale } from "@/i18n/locale";

export type SectionId = "references" | "skills" | "projects" | "blog";

export type OutlineEntry = {
  id: SectionId;
  title: string;
  items: readonly unknown[];
};

const sectionTitles: Record<SectionId, Record<Locale, string>> = {
  references: { en: "References", sv: "Referenser" },
  skills: { en: "Skills", sv: "Färdigheter" },
  projects: { en: "Projects", sv: "Projekt" },
  blog: { en: "Blog", sv: "Blogg" },
};

export function getHomepageOutline(locale: Locale): OutlineEntry[] {
  return [
    {
      id: "references",
      title: sectionTitles.references[locale],
      items: getReferences(locale),
    },
    { id: "skills", title: sectionTitles.skills[locale], items: skills },
    {
      id: "projects",
      title: sectionTitles.projects[locale],
      items: getProjects(locale),
    },
    { id: "blog", title: sectionTitles.blog[locale], items: posts },
  ];
}

export function visibleSections(outline: readonly OutlineEntry[]) {
  return outline.filter((entry) => entry.items.length > 0);
}

export function getSections(locale: Locale) {
  return visibleSections(getHomepageOutline(locale));
}

export const homepageOutline = getHomepageOutline(defaultLocale);
