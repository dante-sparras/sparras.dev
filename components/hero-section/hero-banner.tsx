"use client";

/**
 * Home-hero frame for the black-hole scene.
 *
 * Owns banner layout (flex grow + min heights). The sim itself
 * (`BlackHole`) only fills its parent and knows nothing about the hero.
 *
 * Next 16: `dynamic(..., { ssr: false })` only in Client Components.
 *
 * ```tsx
 * <HeroBanner spin={0.8} inclination={135} />
 * ```
 */
import dynamic from "next/dynamic";
import type { BlackHoleProps } from "@/components/black-hole";
import { cn } from "@/lib/utils";

/** Banner strip next to the portrait — size comes from here, not the sim. */
const BANNER_FRAME =
  "relative min-h-[7.5rem] h-full w-full flex-1 bg-background sm:min-h-[9rem] md:min-h-[11rem]";

const BlackHoleLazy = dynamic(
  () => import("@/components/black-hole").then((m) => m.BlackHole),
  {
    ssr: false,
    loading: () => <div className={BANNER_FRAME} aria-hidden />,
  },
);

export function HeroBanner({ className, ...props }: BlackHoleProps) {
  return (
    <div className={cn(BANNER_FRAME, className)}>
      <BlackHoleLazy {...props} />
    </div>
  );
}
