import { cn } from "@/lib/utils";
import { SolarSystem } from "./solar-system";

/** Banner strip next to the portrait — size comes from here, not the scene. */
const BANNER_FRAME =
  "relative min-h-[7.5rem] h-full w-full flex-1 overflow-hidden bg-background sm:min-h-[9rem] md:min-h-[11rem]";

export type HeroBannerProps = {
  className?: string;
};

/**
 * Home-hero frame for the solar system scene.
 * Owns banner layout (flex grow + min heights). `SolarSystem` only fills its parent.
 */
export function HeroBanner({ className }: HeroBannerProps) {
  return (
    <div className={cn(BANNER_FRAME, className)}>
      <SolarSystem />
    </div>
  );
}
