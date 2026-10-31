import type { Rect } from "@/lib/scene";

export const workspaceWindows = [
  ["a", "b", "c", "d"],
  ["e", "f", "g"],
] as const;

export type SceneWindow = (typeof workspaceWindows)[number][number];

export type SceneFrame = {
  /** A window with no slot here is closed. */
  layout: Partial<Record<SceneWindow, Rect>>;
  focused: SceneWindow | null;
  workspace: 0 | 1;
  /** How long to stay on this frame, which includes its transitions. */
  hold: number;
};

const full: Rect = { x: 24, y: 24, width: 1152, height: 524 };
const left: Rect = { x: 24, y: 24, width: 560, height: 524 };
const leftTop: Rect = { x: 24, y: 24, width: 560, height: 254 };
const leftBottom: Rect = { x: 24, y: 294, width: 560, height: 254 };
const right: Rect = { x: 600, y: 24, width: 576, height: 524 };
const rightTop: Rect = { x: 600, y: 24, width: 576, height: 254 };
const rightBottom: Rect = { x: 600, y: 294, width: 576, height: 254 };
const cornerLeft: Rect = { x: 600, y: 294, width: 280, height: 254 };
const cornerRight: Rect = { x: 896, y: 294, width: 280, height: 254 };

/** Always laid out, so it is ready when the first workspace slides away. */
const secondWorkspace = { e: right, f: leftTop, g: leftBottom };

/** Where each window opens, and where it waits while it is closed. */
export const openingSlots: Record<SceneWindow, Rect> = {
  a: full,
  b: right,
  c: rightBottom,
  d: cornerRight,
  ...secondWorkspace,
};

const tiled = { a: left, b: rightTop, c: cornerLeft, d: cornerRight };

/** The still picture: four tiled windows with the largest in focus. */
export const restFrame: SceneFrame = {
  layout: { ...tiled, ...secondWorkspace },
  focused: "a",
  workspace: 0,
  hold: 0,
};

/** Windows open one by one, swap places, then the workspace changes. */
export const sceneFrames: readonly SceneFrame[] = [
  { layout: secondWorkspace, focused: null, workspace: 0, hold: 350 },
  {
    layout: { ...secondWorkspace, a: full },
    focused: "a",
    workspace: 0,
    hold: 550,
  },
  {
    layout: { ...secondWorkspace, a: left, b: right },
    focused: "b",
    workspace: 0,
    hold: 550,
  },
  {
    layout: { ...secondWorkspace, a: left, b: rightTop, c: rightBottom },
    focused: "c",
    workspace: 0,
    hold: 550,
  },
  {
    layout: { ...secondWorkspace, ...tiled },
    focused: "d",
    workspace: 0,
    hold: 700,
  },
  {
    layout: { ...secondWorkspace, ...tiled, c: cornerRight, d: cornerLeft },
    focused: "d",
    workspace: 0,
    hold: 600,
  },
  {
    layout: {
      ...secondWorkspace,
      ...tiled,
      a: cornerLeft,
      c: cornerRight,
      d: left,
    },
    focused: "d",
    workspace: 0,
    hold: 700,
  },
  {
    layout: {
      ...secondWorkspace,
      ...tiled,
      a: cornerLeft,
      c: cornerRight,
      d: left,
    },
    focused: "b",
    workspace: 0,
    hold: 400,
  },
  {
    layout: {
      ...secondWorkspace,
      a: cornerLeft,
      b: left,
      c: cornerRight,
      d: rightTop,
    },
    focused: "b",
    workspace: 0,
    hold: 750,
  },
  {
    layout: {
      ...secondWorkspace,
      a: cornerLeft,
      b: left,
      c: cornerRight,
      d: rightTop,
    },
    focused: "e",
    workspace: 1,
    hold: 1000,
  },
  {
    layout: { e: leftTop, f: right, g: leftBottom },
    focused: "e",
    workspace: 1,
    hold: 1100,
  },
];
