import { describe, expect, test } from "bun:test";
import type { Rect } from "@/lib/scene";
import {
  dashboardRects,
  desktops,
  restFrame,
  sceneFrames,
} from "@/lib/winshell-scene";

function overlaps(first: Rect, second: Rect) {
  return (
    first.x < second.x + second.width &&
    second.x < first.x + first.width &&
    first.y < second.y + second.height &&
    second.y < first.y + first.height
  );
}

describe("the Winshell scene", () => {
  test("lays out the dashboard without overlaps, inside the picture", () => {
    const rects = Object.values(dashboardRects);
    for (const [index, rect] of rects.entries()) {
      expect(rect.x + rect.width).toBeLessThanOrEqual(1200);
      expect(rect.y + rect.height).toBeLessThanOrEqual(600);
      for (const other of rects.slice(index + 1)) {
        expect(overlaps(rect, other)).toBe(false);
      }
    }
  });

  test("shows every desktop", () => {
    const shown = new Set(sceneFrames.map((frame) => frame.desktop));
    expect([...shown].sort()).toEqual([...desktops].sort());
  });

  test("changes desktop as soon as it starts", () => {
    expect(sceneFrames[0]?.desktop).not.toBe(restFrame.desktop);
  });

  test("only moves the clock forward as the desktops take over", () => {
    const minutes = sceneFrames.map((frame) => frame.minute);
    expect(minutes).toEqual([...minutes].sort((a, b) => a - b));
    expect(new Set(minutes).size).toBe(minutes.length);
  });

  test("ends on the resting desktop, so the loop has no jump", () => {
    expect(sceneFrames.at(-1)?.desktop).toBe(restFrame.desktop);
  });
});
