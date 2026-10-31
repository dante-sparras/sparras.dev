import { describe, expect, test } from "bun:test";
import { getProfile } from "@/content/profile";
import {
  getProfileStructuredData,
  serializeStructuredData,
} from "@/content/structured-data";

describe("getProfileStructuredData", () => {
  test("links the Person to every Social link", () => {
    const { mainEntity } = getProfileStructuredData("en");
    expect(mainEntity.sameAs).toEqual(
      getProfile("en").socialLinks.map((link) => link.href),
    );
  });

  test("uses the role and address of the page's language", () => {
    expect(getProfileStructuredData("sv").mainEntity.jobTitle).toBe(
      getProfile("sv").role,
    );
    expect(getProfileStructuredData("sv").url).toEndWith("/sv");
  });

  test("leaves out the phone number", () => {
    const serialized = serializeStructuredData(getProfileStructuredData("en"));
    expect(serialized).not.toContain("telephone");
    expect(serialized).not.toContain("+46");
  });
});

describe("serializeStructuredData", () => {
  test("cannot close the script tag it is written into", () => {
    const serialized = serializeStructuredData({ name: "</script>" });
    expect(serialized).not.toContain("<");
    expect(JSON.parse(serialized)).toEqual({ name: "</script>" });
  });
});
