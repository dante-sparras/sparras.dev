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
  test("uses an infinity mark and a compact duration for an open position", () => {
    expect(
      formatExperiencePeriod(
        { year: 2025, month: 12 },
        undefined,
        october2026,
        "en",
      ),
    ).toEqual({ range: "12.2025–∞", duration: "11m" });
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

  test("keeps a planned end and counts only the months so far", () => {
    expect(
      formatExperiencePeriod(
        { year: 2026, month: 1 },
        { year: 2027, month: 12 },
        october2026,
        "en",
      ),
    ).toEqual({ range: "01.2026–12.2027", duration: "10m" });
  });

  test("spells the duration in Swedish", () => {
    expect(
      formatExperiencePeriod(
        { year: 2022, month: 7 },
        undefined,
        october2026,
        "sv",
      ),
    ).toEqual({ range: "07.2022–∞", duration: "4 år 4 mån" });
  });
});

describe("getExperience", () => {
  test("lists organizations newest first and marks the open ones", () => {
    const entries = getExperience("en", october2026);

    expect(entries.map((entry) => entry.company)).toEqual([
      "YH Akademin",
      "Stödpedagog",
      "Casuology",
      "The Game Assembly",
      "NTI Gymnasiet",
    ]);
    expect(entries.map((entry) => entry.isCurrent)).toEqual([
      true,
      true,
      true,
      false,
      false,
    ]);
    expect(entries[0]?.roles[0]?.meta).toBe(
      "Full-time | 01.2026–12.2027 | 10m",
    );
    expect(entries[1]?.roles[0]?.meta).toBe("Freelance | 12.2025–∞ | 11m");
    expect(entries[2]?.roles[0]?.meta).toBe("Part-time | 07.2022–∞ | 4y 4m");
    expect(entries[3]?.roles[0]?.meta).toBe("Full-time | 08.2021–02.2022 | 7m");
    expect(entries[4]?.roles.map((role) => role.meta)).toEqual([
      "Full-time | 08.2018–06.2021 | 2y 11m",
      "Part-time | 12.2018–06.2021 | 2y 7m",
      "Part-time | 12.2018–06.2021 | 2y 7m",
      "06.2021",
    ]);
    expect(entries[2]?.roles[0]?.skills).toEqual(["Unity", "C#"]);
    expect(entries[4]?.roles.map((role) => role.title)).toEqual([
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
      "Heltid | 01.2026–12.2027 | 10 mån",
    );
    expect(entries[1]?.roles[0]?.title).toBe("Fullstackutvecklare");
    expect(entries[1]?.roles[0]?.meta).toBe("Frilans | 12.2025–∞ | 11 mån");
    expect(entries[2]?.location).toBe("Åbo, Finland");
    expect(entries[2]?.roles[0]?.meta).toBe("Deltid | 07.2022–∞ | 4 år 4 mån");
    expect(entries[3]?.roles[0]?.meta).toBe("Heltid | 08.2021–02.2022 | 7 mån");
    expect(entries[4]?.roles[0]?.title).toBe("Teknikprogrammet");
    expect(entries[4]?.roles[0]?.meta).toBe(
      "Heltid | 08.2018–06.2021 | 2 år 11 mån",
    );
    expect(entries[4]?.roles[3]?.title).toBe(
      "Bästa gymnasiearbete (utsedd av eleverna)",
    );
  });
});
