/// <reference types="bun" />
import { describe, expect, test } from "bun:test";
import {
  createPointerEffect,
  type FrameClock,
  hoverLens,
  type PointerEffect,
  rgbSplit,
  rgbSplitOffsets,
} from "@/lib/pointer-effect";

const FRAME_MS = 16;

/** How far one frame of `ms` moves a value toward its target at the tuned follow speed. */
function easedFraction(ms: number) {
  return 1 - Math.exp(-12 * (ms / 1000));
}

function fakeFrameClock() {
  let time = 0;
  let nextHandle = 1;
  const pending = new Map<number, (now: number) => void>();

  const clock: FrameClock = {
    now: () => time,
    requestFrame(callback) {
      const handle = nextHandle++;
      pending.set(handle, callback);
      return handle;
    },
    cancelFrame(handle) {
      pending.delete(handle);
    },
  };

  function runFrame(now: number) {
    const callbacks = [...pending.values()];
    pending.clear();
    for (const callback of callbacks) {
      callback(now);
    }
  }

  function frame(ms = FRAME_MS) {
    time += ms;
    runFrame(time);
  }

  function settle() {
    for (let i = 0; i < 1000 && pending.size > 0; i++) {
      frame();
    }
  }

  return {
    clock,
    runFrame,
    frame,
    settle,
    hasPendingFrame: () => pending.size > 0,
  };
}

function setup<V extends Record<string, number>>(
  effect: PointerEffect<V>,
  enterDelayMs?: number,
) {
  const time = fakeFrameClock();
  const frames: V[] = [];
  const controller = createPointerEffect(effect, {
    clock: time.clock,
    onFrame: (values) => frames.push({ ...values }),
    enterDelayMs,
  });

  function latest() {
    const values = frames.at(-1);
    if (!values) {
      throw new Error("no frame was delivered");
    }
    return values;
  }

  return { ...time, controller, frames, latest };
}

describe("easing", () => {
  test("eases toward the target, then snaps to it exactly and stops asking for frames", () => {
    const lens = setup(hoverLens);

    lens.controller.enter({ x: 0.8, y: 0.2 });
    lens.frame();

    expect(lens.latest().x).toBeCloseTo(0.5 + 0.3 * easedFraction(16), 10);
    expect(lens.latest().scale).toBeCloseTo(easedFraction(16), 10);

    lens.settle();

    expect(lens.latest()).toEqual({ x: 0.8, y: 0.2, scale: 1 });
    expect(lens.hasPendingFrame()).toBe(false);
  });

  test("caps a long frame gap at 50ms", () => {
    const lens = setup(hoverLens);

    lens.controller.enter({ x: 0.8, y: 0.5 });
    lens.frame(5000);

    expect(lens.latest().scale).toBeCloseTo(easedFraction(50), 10);
  });

  test("does not ease backwards when a frame is stamped before the loop started", () => {
    const lens = setup(hoverLens);

    lens.controller.enter({ x: 0.8, y: 0.5 });
    lens.runFrame(-4);

    expect(lens.latest().scale).toBe(0);
  });

  test("disposing cancels the pending frame", () => {
    const lens = setup(hoverLens);

    lens.controller.enter({ x: 0.8, y: 0.5 });
    expect(lens.hasPendingFrame()).toBe(true);

    lens.controller.dispose();
    expect(lens.hasPendingFrame()).toBe(false);
  });
});

describe("hover lens", () => {
  test("fades out in place on leave", () => {
    const lens = setup(hoverLens);

    lens.controller.enter({ x: 0.9, y: 0.1 });
    lens.frame();
    lens.frame();
    const { x, y } = lens.latest();

    lens.controller.leave();
    lens.settle();

    expect(lens.latest()).toEqual({ x, y, scale: 0 });
  });
});

describe("RGB split", () => {
  test("the axis jumps to the pointer on enter while the amount eases in", () => {
    const split = setup(rgbSplit);

    split.controller.enter({ x: 0.5, y: 1 });
    split.frame();

    expect(split.latest().angle).toBe(Math.PI / 2);
    expect(split.latest().amount).toBeCloseTo(easedFraction(16), 10);
  });

  test("a pointer in the center deadzone leaves the axis alone", () => {
    const split = setup(rgbSplit);

    split.controller.enter({ x: 1, y: 0.5 });
    split.settle();
    split.controller.move({ x: 0.53, y: 0.55 });

    expect(split.hasPendingFrame()).toBe(false);
    expect(split.latest().angle).toBe(0);
  });

  test("the axis crosses ±π the short way", () => {
    const split = setup(rgbSplit);

    split.controller.enter({ x: 0, y: 0.45 });
    split.settle();
    split.controller.move({ x: 0, y: 0.55 });
    split.frame();

    expect(Math.cos(split.latest().angle)).toBeLessThan(-0.99);

    split.settle();

    expect(split.latest().angle).toBe(Math.atan2(0.05, -0.5));
  });

  test("fades out on leave and keeps its axis", () => {
    const split = setup(rgbSplit);

    split.controller.enter({ x: 0.5, y: 1 });
    split.settle();
    split.controller.leave();
    split.settle();

    expect(split.latest()).toEqual({ amount: 0, angle: Math.PI / 2 });
  });
});

describe("RGB split offsets", () => {
  function expectOffset(
    offset: { x: number; y: number },
    expected: { x: number; y: number },
  ) {
    expect(offset.x).toBeCloseTo(expected.x, 10);
    expect(offset.y).toBeCloseTo(expected.y, 10);
  }

  test("red and blue pull apart along the axis while green drifts across it", () => {
    const offsets = rgbSplitOffsets(
      { amount: 1, angle: Math.PI / 2 },
      { splitPx: 4, greenPx: 1 },
    );

    expectOffset(offsets.red, { x: 0, y: 4 });
    expectOffset(offsets.blue, { x: 0, y: -4 });
    expectOffset(offsets.green, { x: -1, y: 0 });
  });

  test("every channel scales with the amount", () => {
    const offsets = rgbSplitOffsets(
      { amount: 0.5, angle: 0 },
      { splitPx: 4, greenPx: 1 },
    );

    expectOffset(offsets.red, { x: 2, y: 0 });
    expectOffset(offsets.blue, { x: -2, y: 0 });
    expectOffset(offsets.green, { x: 0, y: 0.5 });
  });

  test("at rest every channel sits in place", () => {
    const offsets = rgbSplitOffsets(rgbSplit.rest, { splitPx: 4, greenPx: 1 });

    for (const offset of Object.values(offsets)) {
      expectOffset(offset, { x: 0, y: 0 });
    }
  });
});

describe("enter delay", () => {
  test("holds the enter target back for the delay", () => {
    const border = setup(rgbSplit, 150);

    border.controller.enter({ x: 1, y: 0.5 });
    for (let elapsed = FRAME_MS; elapsed < 150; elapsed += FRAME_MS) {
      border.frame();
      expect(border.latest().amount).toBe(0);
    }

    border.frame();

    expect(border.latest().amount).toBeGreaterThan(0);
  });

  test("leaving inside the delay cancels it", () => {
    const border = setup(rgbSplit, 150);

    border.controller.enter({ x: 1, y: 0.5 });
    border.frame(100);
    border.controller.leave();
    border.settle();
    border.frame(200);

    expect(border.frames.every(({ amount }) => amount === 0)).toBe(true);
    expect(border.hasPendingFrame()).toBe(false);
  });
});

describe("reduced motion", () => {
  test("pointer input does nothing", () => {
    const lens = setup(hoverLens);

    lens.controller.setReducedMotion(true);
    lens.controller.enter({ x: 0.8, y: 0.2 });
    lens.controller.move({ x: 0.7, y: 0.3 });
    lens.controller.leave();

    expect(lens.hasPendingFrame()).toBe(false);
    expect(lens.frames).toEqual([hoverLens.rest]);
  });

  test("turning it on mid-hover snaps back to rest", () => {
    const split = setup(rgbSplit);

    split.controller.enter({ x: 1, y: 0.5 });
    split.frame();
    split.frame();
    split.controller.setReducedMotion(true);

    expect(split.latest()).toEqual(rgbSplit.rest);
    expect(split.hasPendingFrame()).toBe(false);
  });
});
