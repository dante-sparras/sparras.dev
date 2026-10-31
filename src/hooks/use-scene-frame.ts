import { useEffect, useState } from "react";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

/**
 * Loops through `frames` while playing, staying on each for its `hold`.
 * Otherwise, and for visitors who prefer reduced motion, it stays on `rest`.
 */
export function useSceneFrame<Frame extends { hold: number }>(
  frames: readonly Frame[],
  rest: Frame,
  isPlaying: boolean,
) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const shouldPlay = isPlaying && !prefersReducedMotion;
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!shouldPlay) return;

    let current = 0;
    let timer = 0;
    const waitForNextFrame = () => {
      timer = window.setTimeout(() => {
        current = (current + 1) % frames.length;
        setIndex(current);
        waitForNextFrame();
      }, frames[current]?.hold);
    };
    waitForNextFrame();

    return () => {
      window.clearTimeout(timer);
      setIndex(0);
    };
  }, [shouldPlay, frames]);

  return shouldPlay ? (frames[index] ?? rest) : rest;
}
