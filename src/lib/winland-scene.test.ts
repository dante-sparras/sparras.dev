import { describe, expect, test } from "bun:test";
import type { Rect } from "@/lib/scene";
import {
  restFrame,
  type SceneFrame,
  sceneFrames,
  workspaceWindows,
} from "@/lib/winland-scene";

function overlaps(first: Rect, second: Rect) {
  return (
    first.x < second.x + second.width &&
    second.x < first.x + first.width &&
    first.y < second.y + second.height &&
    second.y < first.y + first.height
  );
}

function slots(frame: SceneFrame, workspace: 0 | 1) {
  return workspaceWindows[workspace].flatMap((name) => {
    const rect = frame.layout[name];
    return rect ? [rect] : [];
  });
}

describe("the Winland scene", () => {
  test.each([...sceneFrames, restFrame].map((frame, index) => [index, frame]))(
    "tiles frame %i without overlapping or leaving the desktop",
    (_, frame) => {
      for (const workspace of [0, 1] as const) {
        const rects = slots(frame as SceneFrame, workspace);
        for (const [index, rect] of rects.entries()) {
          expect(rect.x + rect.width).toBeLessThanOrEqual(1200);
          expect(rect.y + rect.height).toBeLessThanOrEqual(600);
          for (const other of rects.slice(index + 1)) {
            expect(overlaps(rect, other)).toBe(false);
          }
        }
      }
    },
  );

  test("opens the windows one at a time", () => {
    const open = sceneFrames.slice(0, 5).map((frame) => slots(frame, 0).length);
    expect(open).toEqual([0, 1, 2, 3, 4]);
  });

  test("only focuses a window that is open on the visible workspace", () => {
    for (const frame of sceneFrames) {
      if (!frame.focused) continue;
      expect(frame.layout[frame.focused]).toBeDefined();
      expect(
        (workspaceWindows[frame.workspace] as readonly string[]).includes(
          frame.focused,
        ),
      ).toBe(true);
    }
  });

  test("moves the windows, then switches workspace", () => {
    const firstSwitch = sceneFrames.findIndex((frame) => frame.workspace === 1);
    const tiled = sceneFrames[4]?.layout;
    const beforeSwitch = sceneFrames[firstSwitch - 1]?.layout;
    expect(firstSwitch).toBeGreaterThan(4);
    expect(beforeSwitch?.a).not.toEqual(tiled?.a);
    expect(beforeSwitch?.b).not.toEqual(tiled?.b);
  });
});
