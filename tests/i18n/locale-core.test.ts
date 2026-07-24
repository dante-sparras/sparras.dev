import { describe, expect, test } from "bun:test";
import {
  defaultLocale,
  isLocale,
  localeFromAcceptLanguage,
  locales,
  localizedPath,
  pathnameHasLocale,
  pathnameWithoutLocale,
} from "@/lib/i18n/locale-core";

describe("locales", () => {
  test("default is en and set is en/sv", () => {
    expect(defaultLocale).toBe("en");
    expect([...locales]).toEqual(["en", "sv"]);
  });

  test("isLocale", () => {
    expect(isLocale("en")).toBe(true);
    expect(isLocale("sv")).toBe(true);
    expect(isLocale("EN")).toBe(false);
    expect(isLocale("de")).toBe(false);
    expect(isLocale("")).toBe(false);
  });
});

describe("localeFromAcceptLanguage", () => {
  test("null/empty → default", () => {
    expect(localeFromAcceptLanguage(null)).toBe("en");
    expect(localeFromAcceptLanguage(undefined)).toBe("en");
    expect(localeFromAcceptLanguage("")).toBe("en");
  });

  test("prefers Swedish when listed", () => {
    expect(localeFromAcceptLanguage("sv")).toBe("sv");
    expect(localeFromAcceptLanguage("sv-SE")).toBe("sv");
    expect(localeFromAcceptLanguage("sv,en;q=0.8")).toBe("sv");
  });

  test("English and region tags", () => {
    expect(localeFromAcceptLanguage("en")).toBe("en");
    expect(localeFromAcceptLanguage("en-US,en;q=0.9")).toBe("en");
  });

  test("q-value order — highest supported wins", () => {
    expect(localeFromAcceptLanguage("de;q=0.9,sv;q=0.8,en;q=0.7")).toBe("sv");
    expect(localeFromAcceptLanguage("fr;q=1,en;q=0.5")).toBe("en");
    expect(localeFromAcceptLanguage("de,fr")).toBe("en");
  });

  test("whitespace and malformed q", () => {
    expect(localeFromAcceptLanguage(" sv-SE ; q=0.9 , en ; q=0.1 ")).toBe("sv");
    expect(localeFromAcceptLanguage("en;q=nope")).toBe("en");
  });
});

describe("pathnameHasLocale", () => {
  test("home and nested", () => {
    expect(pathnameHasLocale("/en")).toBe(true);
    expect(pathnameHasLocale("/sv")).toBe(true);
    expect(pathnameHasLocale("/en/about")).toBe(true);
    expect(pathnameHasLocale("/sv/work")).toBe(true);
  });

  test("missing or unknown", () => {
    expect(pathnameHasLocale("/")).toBe(false);
    expect(pathnameHasLocale("/about")).toBe(false);
    expect(pathnameHasLocale("/de/about")).toBe(false);
    expect(pathnameHasLocale("/english")).toBe(false);
  });
});

describe("pathnameWithoutLocale", () => {
  test("strips known locale", () => {
    expect(pathnameWithoutLocale("/en")).toBe("/");
    expect(pathnameWithoutLocale("/sv")).toBe("/");
    expect(pathnameWithoutLocale("/en/about")).toBe("/about");
    expect(pathnameWithoutLocale("/sv/work/foo")).toBe("/work/foo");
  });

  test("leaves non-locale paths", () => {
    expect(pathnameWithoutLocale("/")).toBe("/");
    expect(pathnameWithoutLocale("/about")).toBe("/about");
    expect(pathnameWithoutLocale("")).toBe("/");
  });
});

describe("localizedPath", () => {
  test("home", () => {
    expect(localizedPath("en", "/")).toBe("/en");
    expect(localizedPath("sv", "/")).toBe("/sv");
  });

  test("rewrites existing locale segment", () => {
    expect(localizedPath("sv", "/en/about")).toBe("/sv/about");
    expect(localizedPath("en", "/sv/contact")).toBe("/en/contact");
  });

  test("prefixes bare paths", () => {
    expect(localizedPath("en", "/about")).toBe("/en/about");
    expect(localizedPath("sv", "/work")).toBe("/sv/work");
  });
});
