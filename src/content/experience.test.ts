import { describe, expect, test } from "bun:test";
import {
  formatExperiencePeriod,
  getExperience,
  inclusiveMonthCount,
} from "@/content/experience";

const october2026 = new Date(Date.UTC(2026, 9, 29));

describe("inclusiveMonthCount", () => {
  test("counts the start and end month", () => {
    expect(
      inclusiveMonthCount({ year: 2026, month: 1 }, { year: 2026, month: 10 }),
    ).toBe(10);
    expect(
      inclusiveMonthCount({ year: 2024, month: 3 }, { year: 2026, month: 10 }),
    ).toBe(32);
    expect(
      inclusiveMonthCount({ year: 2022, month: 10 }, { year: 2026, month: 1 }),
    ).toBe(40);
  });
});

describe("formatExperiencePeriod", () => {
  test("says Current and a compact duration for an open position", () => {
    expect(
      formatExperiencePeriod(
        { year: 2025, month: 12 },
        undefined,
        october2026,
        "en",
      ),
    ).toEqual({ range: "12.2025–Current", duration: "11m" });
  });

  test("drops a zero month or year part", () => {
    expect(
      formatExperiencePeriod(
        { year: 2020, month: 1 },
        { year: 2021, month: 12 },
        october2026,
        "en",
      ).duration,
    ).toBe("2y");
    expect(
      formatExperiencePeriod(
        { year: 2021, month: 8 },
        { year: 2022, month: 2 },
        october2026,
        "en",
      ).duration,
    ).toBe("7m");
  });

  test("says Current before a planned end and counts only the months so far", () => {
    expect(
      formatExperiencePeriod(
        { year: 2026, month: 1 },
        { year: 2027, month: 12 },
        october2026,
        "en",
      ),
    ).toEqual({ range: "01.2026–Current", duration: "10m" });
  });

  test("leaves out Current and the duration before the start", () => {
    expect(
      formatExperiencePeriod(
        { year: 2027, month: 1 },
        { year: 2027, month: 6 },
        october2026,
        "en",
      ),
    ).toEqual({ range: "01.2027–06.2027", duration: "" });
    expect(
      formatExperiencePeriod(
        { year: 2027, month: 1 },
        undefined,
        october2026,
        "en",
      ),
    ).toEqual({ range: "01.2027", duration: "" });
  });

  test("starts a new month at midnight in Stockholm, not UTC", () => {
    // 23:30 UTC on 31 October is already 1 November in Stockholm.
    const stockholmNovember = new Date(Date.UTC(2026, 9, 31, 23, 30));
    expect(
      formatExperiencePeriod(
        { year: 2026, month: 1 },
        { year: 2026, month: 10 },
        stockholmNovember,
        "en",
      ),
    ).toEqual({ range: "01.2026–10.2026", duration: "10m" });
  });

  test("spells the duration in Swedish", () => {
    expect(
      formatExperiencePeriod(
        { year: 2022, month: 7 },
        undefined,
        october2026,
        "sv",
      ),
    ).toEqual({ range: "07.2022–Pågående", duration: "4\u00a0år 4\u00a0mån" });
  });
});

describe("getExperience", () => {
  test("lists organizations newest first and marks the open ones", () => {
    const entries = getExperience("en", october2026);

    expect(entries.map((entry) => entry.company)).toEqual([
      "YH Akademin",
      "Casuology",
      "The Game Assembly",
      "NTI Gymnasiet",
    ]);
    expect(entries.map((entry) => entry.kind)).toEqual([
      "education",
      "contribution",
      "education",
      "education",
    ]);
    expect(entries[1]?.kindLabel).toBe("Contribution");
    expect(entries.map((entry) => entry.isCurrent)).toEqual([
      true,
      true,
      false,
      false,
    ]);
    expect(entries[0]?.roles[0]?.meta).toBe(
      "Full-time | 01.2026–Current | 10m",
    );
    expect(entries[1]?.roles[0]?.meta).toBe(
      "Contributor | 07.2022–Current | 4y 4m",
    );
    expect(entries[2]?.roles[0]?.meta).toBe("Full-time | 08.2021–02.2022 | 7m");
    expect(entries[3]?.roles.map((role) => role.meta)).toEqual([
      "Full-time | 08.2018–06.2021 | 2y 11m",
      "Volunteer | 12.2018–06.2021 | 2y 7m",
      "Volunteer | 12.2018–06.2021 | 2y 7m",
      "06.2021",
    ]);
    expect(entries[1]?.roles[0]?.skills).toEqual([
      "Unity",
      "C#",
      "Git",
      "GitHub",
    ]);
    expect(entries[3]?.roles.map((role) => role.title)).toEqual([
      "Technology Programme",
      "Student Ambassador",
      "Makerspace Coordinator",
      "Best Upper Secondary Thesis (voted by students)",
    ]);
  });

  test("translates the positions without changing the organizations", () => {
    const entries = getExperience("sv", october2026);

    expect(entries.map((entry) => entry.company)).toEqual(
      getExperience("en", october2026).map((entry) => entry.company),
    );
    expect(entries[0]?.roles[0]?.title).toBe("Systemutvecklare .NET");
    expect(entries[0]?.roles[0]?.meta).toBe(
      "Heltid | 01.2026–Pågående | 10\u00a0mån",
    );
    expect(entries[0]?.kindLabel).toBe("Utbildning");
    expect(entries[1]?.location).toBe("Åbo, Finland");
    expect(entries[1]?.roles[0]?.meta).toBe(
      "Medhjälpare | 07.2022–Pågående | 4\u00a0år 4\u00a0mån",
    );
    expect(entries[2]?.roles[0]?.meta).toBe(
      "Heltid | 08.2021–02.2022 | 7\u00a0mån",
    );
    expect(entries[3]?.roles[0]?.title).toBe("Teknikprogrammet");
    expect(entries[3]?.roles[0]?.meta).toBe(
      "Heltid | 08.2018–06.2021 | 2\u00a0år 11\u00a0mån",
    );
    expect(entries[3]?.roles[3]?.title).toBe(
      "Bästa gymnasiearbete (utsett av eleverna)",
    );
  });
});
