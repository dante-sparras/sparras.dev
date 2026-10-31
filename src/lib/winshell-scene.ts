import type { Rect } from "@/lib/scene";

/** Three desktops with nothing in common but the toolkit that made them. */
export const desktops = ["dashboard", "island", "hud"] as const;

export type Desktop = (typeof desktops)[number];

export type WinshellFrame = {
  desktop: Desktop;
  /** Moves the details of a desktop on, so that it looks alive. */
  tick: number;
  /** The minutes on the clock, which the desktops share as they take over. */
  minute: number;
  hold: number;
};

export const dashboardRects = {
  bar: { x: 24, y: 24, width: 64, height: 552 },
  media: { x: 728, y: 120, width: 448, height: 176 },
  graph: { x: 728, y: 312, width: 448, height: 176 },
} satisfies Record<string, Rect>;

/** The still picture is the dashboard. */
export const restFrame: WinshellFrame = {
  desktop: "dashboard",
  tick: 0,
  minute: 34,
  hold: 0,
};

/** Starts on the next desktop at once, and ends where it started to loop. */
export const sceneFrames: readonly WinshellFrame[] = (
  ["island", "hud", "dashboard"] as const
).flatMap((desktop, order) => [
  { desktop, tick: 0, minute: restFrame.minute + order * 2, hold: 1100 },
  { desktop, tick: 1, minute: restFrame.minute + order * 2 + 1, hold: 1300 },
]);
