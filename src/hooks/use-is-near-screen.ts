import { type RefObject, useEffect, useState } from "react";

/**
 * Whether `ref`'s element has come within half a screen of the viewport. It
 * stays true afterwards, so what it reveals isn't thrown away on the way back up.
 */
export function useIsNearScreen(ref: RefObject<Element | null>) {
  const [isNearScreen, setIsNearScreen] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsNearScreen(true);
          observer.disconnect();
        }
      },
      { rootMargin: "50% 0px" },
    );
    observer.observe(element);

    return () => observer.disconnect();
  }, [ref]);

  return isNearScreen;
}
