import { describe, expect, test } from "bun:test";
import {
  getHomepageOutline,
  type OutlineEntry,
  visibleSections,
} from "@/content/outline";

describe("visibleSections", () => {
  test("leaves out Sections with nothing to show, keeping the order", () => {
    const outline: OutlineEntry[] = [
      { id: "references", title: "References", items: [1] },
      { id: "skills", title: "Skills", items: [] },
      { id: "projects", title: "Projects", items: [1, 2] },
      { id: "blog", title: "Blog", items: [] },
    ];

    expect(visibleSections(outline).map((entry) => entry.id)).toEqual([
      "references",
      "projects",
    ]);
  });
});

describe("getHomepageOutline", () => {
  test("gives every Section its own anchor", () => {
    const ids = getHomepageOutline("en").map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("translates section titles without changing their anchors", () => {
    expect(getHomepageOutline("sv").map((entry) => entry.title)).toEqual([
      "Referenser",
      "Erfarenhet",
      "Färdigheter",
      "Projekt",
      "Blogg",
    ]);
    expect(getHomepageOutline("sv").map((entry) => entry.id)).toEqual(
      getHomepageOutline("en").map((entry) => entry.id),
    );
  });
});
