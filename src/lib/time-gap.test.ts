import { describe, expect, test } from "bun:test";
import { describeTimeGap } from "@/lib/time-gap";

const SUMMER = new Date("2026-07-01T12:00:00Z");
const WINTER = new Date("2026-01-15T12:00:00Z");
const STOCKHOLM = "Europe/Stockholm";

describe("describeTimeGap", () => {
  test("a visitor on the same offset sees the same time", () => {
    expect(describeTimeGap(SUMMER, STOCKHOLM, 120)).toBe("same time");
  });

  test("whole hours ahead of a visitor to the west", () => {
    expect(describeTimeGap(SUMMER, STOCKHOLM, -240)).toBe("6h ahead");
  });

  test("keeps the minutes for half-hour zones", () => {
    expect(describeTimeGap(SUMMER, STOCKHOLM, 330)).toBe("3h 30m behind");
  });

  test("keeps the minutes for quarter-hour zones", () => {
    expect(describeTimeGap(SUMMER, STOCKHOLM, 345)).toBe("3h 45m behind");
  });

  test("drops the hours when the gap is under one", () => {
    expect(describeTimeGap(SUMMER, STOCKHOLM, 150)).toBe("30m behind");
  });

  test("follows the zone's daylight saving time", () => {
    expect(describeTimeGap(SUMMER, STOCKHOLM, 0)).toBe("2h ahead");
    expect(describeTimeGap(WINTER, STOCKHOLM, 0)).toBe("1h ahead");
  });
});
