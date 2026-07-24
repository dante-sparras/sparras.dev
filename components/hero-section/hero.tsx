import Image from "next/image";
import type { Dictionary } from "@/lib/i18n";
import { HeroBanner } from "./hero-banner";

export type HeroSectionProps = {
  hero: Dictionary["home"]["hero"];
};

/**
 * Home hero: portrait · solar system banner · name + role.
 * Contact / bio facts live in `ProfileDetails`.
 */
export function HeroSection({ hero }: HeroSectionProps) {
  return (
    <section className="w-full" aria-label={hero.name}>
      <div className="flex items-stretch border-b border-border">
        <div className="shrink-0 border-r border-border p-0">
          <div className="relative size-40 overflow-hidden rounded-full border border-border bg-muted sm:size-48 md:size-56">
            <Image
              src="/images/portrait.webp"
              alt={hero.avatarAlt}
              fill
              priority
              className="object-cover object-[center_18%]"
              sizes="(max-width: 640px) 160px, (max-width: 768px) 192px, 224px"
            />
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <HeroBanner />

          <div className="shrink-0 border-t border-border p-0">
            <h1 className="border-b border-border px-2 py-1.5 text-2xl font-semibold tracking-tight sm:px-2.5 sm:text-3xl">
              {hero.name}
            </h1>
            <p className="text-muted-foreground px-2 py-1.5 text-sm leading-none sm:px-2.5 sm:text-base">
              {hero.role}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
