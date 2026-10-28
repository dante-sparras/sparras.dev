import { describe, expect, test } from "bun:test";
import { formatTemperature, weatherCondition } from "@/lib/weather";

describe("weatherCondition", () => {
  test.each([
    [0, "clear"],
    [1, "partlyCloudy"],
    [2, "partlyCloudy"],
    [3, "cloudy"],
    [45, "fog"],
    [48, "fog"],
    [51, "drizzle"],
    [57, "drizzle"],
    [61, "rain"],
    [67, "rain"],
    [80, "rain"],
    [82, "rain"],
    [71, "snow"],
    [77, "snow"],
    [85, "snow"],
    [86, "snow"],
    [95, "thunderstorm"],
    [99, "thunderstorm"],
  ] as const)("WMO code %i is %s", (code, condition) => {
    expect(weatherCondition(code)).toBe(condition);
  });

  test("an unknown code falls back to cloudy", () => {
    expect(weatherCondition(42)).toBe("cloudy");
  });
});

describe("formatTemperature", () => {
  test("rounds to whole degrees Celsius", () => {
    expect(formatTemperature(20.5)).toBe("21°C");
    expect(formatTemperature(-3.4)).toBe("-3°C");
  });

  test("never shows negative zero", () => {
    expect(formatTemperature(-0.3)).toBe("0°C");
  });

  test("converts to Fahrenheit", () => {
    expect(formatTemperature(0, "F")).toBe("32°F");
    expect(formatTemperature(20, "F")).toBe("68°F");
    expect(formatTemperature(-40, "F")).toBe("-40°F");
  });
});
