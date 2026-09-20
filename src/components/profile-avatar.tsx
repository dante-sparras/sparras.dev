"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "@/components/hover-lens";
import { cn } from "@/lib/utils";

const AVATAR_SIZE_PX = 152;
const SPLIT_DURATION_MS = 300;

/** Hover rest pose for each channel, in CSS pixels.
 *  +x is right, +y is down. Amount 0–1 eases from the origin. */
const CHANNEL_OFFSET = {
  red: { x: -3, y: 0 },
  green: { x: 0, y: 1 },
  blue: { x: 3, y: 0 },
} as const;

/** Tailwind `ease-out`: fast start, settle at the end. */
function easeOut(t: number) {
  return 1 - (1 - t) ** 3;
}

function writeOffset(
  node: SVGFEOffsetElement | null,
  offset: { x: number; y: number },
  amount: number,
) {
  if (!node) {
    return;
  }
  const x = offset.x * amount;
  const y = offset.y * amount;
  node.dx.baseVal = x;
  node.dy.baseVal = y;
  node.setAttribute("dx", String(x));
  node.setAttribute("dy", String(y));
}

type ProfileAvatarProps = {
  className?: string;
};

export function ProfileAvatar({ className }: ProfileAvatarProps) {
  const redOffsetRef = useRef<SVGFEOffsetElement>(null);
  const greenOffsetRef = useRef<SVGFEOffsetElement>(null);
  const blueOffsetRef = useRef<SVGFEOffsetElement>(null);
  const amountRef = useRef(0);
  const fromRef = useRef(0);
  const targetRef = useRef(0);
  const startTimeRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  const applyAmount = useCallback((amount: number) => {
    amountRef.current = amount;
    writeOffset(redOffsetRef.current, CHANNEL_OFFSET.red, amount);
    writeOffset(greenOffsetRef.current, CHANNEL_OFFSET.green, amount);
    writeOffset(blueOffsetRef.current, CHANNEL_OFFSET.blue, amount);
  }, []);

  const stop = useCallback(() => {
    if (rafRef.current == null) {
      return;
    }
    cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  }, []);

  const playTo = useCallback(
    (target: number) => {
      stop();
      fromRef.current = amountRef.current;
      targetRef.current = target;
      startTimeRef.current = performance.now();

      const tick = (now: number) => {
        const t = Math.min(1, (now - startTimeRef.current) / SPLIT_DURATION_MS);
        applyAmount(
          fromRef.current + (targetRef.current - fromRef.current) * easeOut(t),
        );
        if (t < 1) {
          rafRef.current = requestAnimationFrame(tick);
          return;
        }
        applyAmount(targetRef.current);
        rafRef.current = null;
      };

      rafRef.current = requestAnimationFrame(tick);
    },
    [applyAmount, stop],
  );

  useEffect(() => stop, [stop]);

  function handlePointerEnter() {
    if (prefersReducedMotion) {
      return;
    }
    playTo(1);
  }

  function handlePointerLeave() {
    if (prefersReducedMotion) {
      return;
    }
    playTo(0);
  }

  return (
    <div
      className={cn(
        "relative size-[152px] overflow-hidden rounded-full border",
        className,
      )}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
    >
      <svg aria-hidden className="absolute size-0">
        <filter
          id="avatar-rgb-split"
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
          colorInterpolationFilters="sRGB"
        >
          <feOffset
            ref={redOffsetRef}
            dx="0"
            dy="0"
            in="SourceGraphic"
            result="offR"
          />
          <feColorMatrix
            in="offR"
            result="r"
            type="matrix"
            values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
          />
          <feOffset
            ref={greenOffsetRef}
            dx="0"
            dy="0"
            in="SourceGraphic"
            result="offG"
          />
          <feColorMatrix
            in="offG"
            result="g"
            type="matrix"
            values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0"
          />
          <feOffset
            ref={blueOffsetRef}
            dx="0"
            dy="0"
            in="SourceGraphic"
            result="offB"
          />
          <feColorMatrix
            in="offB"
            result="b"
            type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"
          />
          <feBlend in="r" in2="g" mode="screen" result="rg" />
          <feBlend in="rg" in2="b" mode="screen" />
        </filter>
      </svg>
      <Image
        src="/avatar/profile.png"
        alt="Picture of Dante Sparrås"
        fill
        sizes={`${AVATAR_SIZE_PX}px`}
        priority
        className="object-cover [filter:url(#avatar-rgb-split)]"
      />
    </div>
  );
}
