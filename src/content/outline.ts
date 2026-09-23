import { posts } from "@/content/posts";
import { projects } from "@/content/projects";
import { references } from "@/content/references";
import { skills } from "@/content/skills";

export type SectionId = "references" | "skills" | "projects" | "blog";

export type OutlineEntry = {
  id: SectionId;
  title: string;
  items: readonly unknown[];
};

export const homepageOutline: OutlineEntry[] = [
  { id: "references", title: "References", items: references },
  { id: "skills", title: "Skills", items: skills },
  { id: "projects", title: "Projects", items: projects },
  { id: "blog", title: "Blog", items: posts },
];

export function visibleSections(outline: readonly OutlineEntry[]) {
  return outline.filter((entry) => entry.items.length > 0);
}

export const sections = visibleSections(homepageOutline);
