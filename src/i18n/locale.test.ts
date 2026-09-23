import { describe, expect, test } from "bun:test";
import { localeCookie, resolveLocale } from "@/i18n/locale";

describe("resolveLocale", () => {
  test("keeps a saved choice ahead of the browser language", () => {
    expect(
      resolveLocale({ cookie: "sv", acceptLanguage: "en-US,en;q=0.9" }),
    ).toBe("sv");
  });

  test("matches Swedish from a regional tag", () => {
    expect(
      resolveLocale({
        cookie: undefined,
        acceptLanguage: "sv-SE,sv;q=0.9,en-US;q=0.8,en;q=0.7",
      }),
    ).toBe("sv");
  });

  test("prefers the higher-quality supported language", () => {
    expect(
      resolveLocale({
        cookie: undefined,
        acceptLanguage: "fr-FR,en;q=0.8,sv;q=0.4",
      }),
    ).toBe("en");
  });

  test("falls back to English when nothing matches", () => {
    expect(
      resolveLocale({ cookie: undefined, acceptLanguage: "fr-FR,de;q=0.9" }),
    ).toBe("en");
  });

  test("falls back to English when the header is missing", () => {
    expect(resolveLocale({ cookie: undefined, acceptLanguage: null })).toBe(
      "en",
    );
  });

  test("ignores a saved choice that is not a supported language", () => {
    expect(resolveLocale({ cookie: "fr", acceptLanguage: "sv-SE" })).toBe("sv");
  });

  test("skips a language the browser rejected", () => {
    expect(
      resolveLocale({ cookie: undefined, acceptLanguage: "sv;q=0,fr;q=0.8" }),
    ).toBe("en");
  });
});

describe("localeCookie", () => {
  test("stores the choice for a year on every path", () => {
    expect(localeCookie("en")).toBe(
      "locale=en; Path=/; Max-Age=31536000; SameSite=Lax",
    );
  });
});
