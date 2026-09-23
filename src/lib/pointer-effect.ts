/** Pointer position inside the hovered element: 0,0 is top-left, 1,1 is bottom-right. */
export type PointerPoint = { x: number; y: number };

type Values = Record<string, number>;

/** What a rule asks for: `snap` fields jump there now, `target` fields are eased toward. */
export type Aim<V extends Values> = {
  target?: Partial<V>;
  snap?: Partial<V>;
};

/**
 * A Pointer effect: the values it rests at and how the pointer moves them.
 * Fields listed in `angles` are radians and ease the short way round.
 */
export type PointerEffect<V extends Values> = {
  rest: V;
  angles?: readonly (keyof V & string)[];
  enter: (point: PointerPoint, current: Readonly<V>) => Aim<V>;
  /** Return `null` to leave the target alone. */
  move: (point: PointerPoint, current: Readonly<V>) => Aim<V> | null;
  leave: (current: Readonly<V>) => Aim<V>;
};

export type FrameClock = {
  now: () => number;
  requestFrame: (callback: (now: number) => void) => number;
  cancelFrame: (handle: number) => void;
};

export type PointerEffectOptions<V extends Values> = {
  clock: FrameClock;
  onFrame: (values: Readonly<V>) => void;
  /** Hold the enter target back this long; leaving inside the delay cancels it. */
  enterDelayMs?: number;
};

export type PointerEffectController = {
  enter: (point: PointerPoint) => void;
  move: (point: PointerPoint) => void;
  leave: () => void;
  /** While on, pointer input is ignored and the effect sits at rest. */
  setReducedMotion: (reducedMotion: boolean) => void;
  dispose: () => void;
};

/** Higher = values catch up to the target faster. */
const FOLLOW_SPEED = 12;

/** Cap dt so a long pause (tab backgrounded) does not jump the values. */
const MAX_FRAME_SECONDS = 0.05;

/** Close enough to the target that another frame would not be visible. */
const SETTLED_DISTANCE = 0.001;

/** Signed delta from `from` to `to` on the shortest arc, in (-π, π]. */
function shortestAngleDelta(from: number, to: number) {
  return Math.atan2(Math.sin(to - from), Math.cos(to - from));
}

/**
 * Fraction of the remaining distance to cover this frame. Unlike
 * `speed * dt`, it stays within 0–1 for late frames, so values never
 * overshoot the target.
 */
function exponentialEase(dt: number) {
  return 1 - Math.exp(-FOLLOW_SPEED * dt);
}

export function createPointerEffect<V extends Values>(
  effect: PointerEffect<V>,
  { clock, onFrame, enterDelayMs = 0 }: PointerEffectOptions<V>,
): PointerEffectController {
  const fields = Object.keys(effect.rest);
  const angles = new Set<string>(effect.angles ?? []);
  let current: Values = { ...effect.rest };
  let target: Values = { ...effect.rest };
  let delayed: { target: Partial<V>; dueAt: number } | null = null;
  let frame: number | null = null;
  let lastFrameAt = 0;
  let reducedMotion = false;

  function delta(field: string, from: number, to: number) {
    return angles.has(field) ? shortestAngleDelta(from, to) : to - from;
  }

  function isSettled() {
    return (
      delayed == null &&
      fields.every(
        (field) =>
          Math.abs(delta(field, current[field], target[field])) <
          SETTLED_DISTANCE,
      )
    );
  }

  function tick(now: number) {
    // rAF can stamp a frame slightly before the loop started.
    const elapsedSeconds = Math.max(0, (now - lastFrameAt) / 1000);
    const step = exponentialEase(Math.min(MAX_FRAME_SECONDS, elapsedSeconds));
    lastFrameAt = now;

    if (delayed && now >= delayed.dueAt) {
      target = { ...target, ...delayed.target };
      delayed = null;
    }

    const next: Values = {};
    for (const field of fields) {
      next[field] =
        current[field] + delta(field, current[field], target[field]) * step;
    }
    current = next;

    // Snap to the exact target and stop, so a still effect costs no frames.
    if (isSettled()) {
      current = { ...target };
      frame = null;
    } else {
      frame = clock.requestFrame(tick);
    }
    onFrame(current as V);
  }

  function start() {
    if (frame != null) {
      return;
    }
    lastFrameAt = clock.now();
    frame = clock.requestFrame(tick);
  }

  function stop() {
    if (frame == null) {
      return;
    }
    clock.cancelFrame(frame);
    frame = null;
  }

  function aim({ target: aimed, snap }: Aim<V>) {
    if (snap) {
      current = { ...current, ...snap };
      target = { ...target, ...snap };
    }
    if (aimed) {
      target = { ...target, ...aimed };
    }
    start();
  }

  return {
    enter(point) {
      if (reducedMotion) {
        return;
      }
      const { target: aimed, snap } = effect.enter(point, current as V);
      delayed = null;
      if (aimed && enterDelayMs > 0) {
        delayed = { target: aimed, dueAt: clock.now() + enterDelayMs };
        aim({ snap });
        return;
      }
      aim({ target: aimed, snap });
    },

    move(point) {
      if (reducedMotion) {
        return;
      }
      const aimed = effect.move(point, current as V);
      if (aimed) {
        aim(aimed);
      }
    },

    leave() {
      if (reducedMotion) {
        return;
      }
      delayed = null;
      aim(effect.leave(current as V));
    },

    setReducedMotion(next) {
      reducedMotion = next;
      if (!next) {
        return;
      }
      stop();
      delayed = null;
      current = { ...effect.rest };
      target = { ...effect.rest };
      onFrame(current as V);
    },

    dispose() {
      stop();
      delayed = null;
    },
  };
}

export type HoverLensValues = {
  x: number;
  y: number;
  /** 0 = hidden, 1 = fully visible and zoomed. */
  scale: number;
};

function followPointer(point: PointerPoint): Aim<HoverLensValues> {
  return { target: { x: point.x, y: point.y, scale: 1 } };
}

/**
 * Hover lens: follows the pointer, and on leave fades out where it is
 * rather than sliding back to the center while fading.
 */
export const hoverLens: PointerEffect<HoverLensValues> = {
  rest: { x: 0.5, y: 0.5, scale: 0 },
  enter: followPointer,
  move: followPointer,
  leave: (current) => ({ target: { x: current.x, y: current.y, scale: 0 } }),
};

export type RgbSplitValues = {
  /** 0 = no split, 1 = full split. */
  amount: number;
  /** Direction of the split in radians. */
  angle: number;
};

/** Ignore pointer positions this close to the center so the axis does not flip in place. */
const DIRECTION_DEADZONE = 0.08;

function angleFromCenter({ x, y }: PointerPoint) {
  const dx = x - 0.5;
  const dy = y - 0.5;
  return Math.hypot(dx, dy) < DIRECTION_DEADZONE ? null : Math.atan2(dy, dx);
}

/** RGB split: the axis jumps to the pointer on enter, then eases after it. */
export const rgbSplit: PointerEffect<RgbSplitValues> = {
  rest: { amount: 0, angle: 0 },
  angles: ["angle"],
  enter(point) {
    const angle = angleFromCenter(point);
    return {
      target: { amount: 1 },
      snap: angle == null ? undefined : { angle },
    };
  },
  move(point) {
    const angle = angleFromCenter(point);
    return angle == null ? null : { target: { angle } };
  },
  leave: () => ({ target: { amount: 0 } }),
};

type ChannelOffset = { x: number; y: number };

export type RgbSplitOffsets = {
  red: ChannelOffset;
  green: ChannelOffset;
  blue: ChannelOffset;
};

/**
 * Pixel offset of each channel: red and blue pull apart along the split
 * axis by `splitPx`, green drifts across it by `greenPx`.
 */
export function rgbSplitOffsets(
  { amount, angle }: RgbSplitValues,
  { splitPx, greenPx }: { splitPx: number; greenPx: number },
): RgbSplitOffsets {
  const x = Math.cos(angle);
  const y = Math.sin(angle);
  const split = splitPx * amount;
  const green = greenPx * amount;

  return {
    red: { x: x * split, y: y * split },
    green: { x: -y * green, y: x * green },
    blue: { x: -x * split, y: -y * split },
  };
}
