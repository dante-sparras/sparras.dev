import type { Href } from "@/content/types";

export type Post = {
  title: string;
  description: string;
  href: Href;
};

export const posts: Post[] = [];
