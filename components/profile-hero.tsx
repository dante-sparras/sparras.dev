import Image from "next/image";

export type ProfileHeroProps = {
  name: string;
  handle: string;
  avatarSrc: string;
  avatarAlt: string;
};

/**
 * X/Twitter-style profile header: full-width banner, circular avatar
 * overlapping the bottom-left edge of the banner.
 */
export function ProfileHero({
  name,
  handle,
  avatarSrc,
  avatarAlt,
}: ProfileHeroProps) {
  return (
    <section className="w-full" aria-label={name}>
      <div className="relative">
        {/* Minimalist gradient + soft grid (no image) */}
        <div
          className="relative aspect-[3/1] w-full overflow-hidden bg-muted"
          aria-hidden
        >
          <div className="absolute inset-0 bg-gradient-to-br from-muted via-secondary to-muted dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-950" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,color-mix(in_oklch,var(--foreground)_12%,transparent)_1px,transparent_0)] bg-[length:18px_18px] opacity-40 dark:opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/25 via-transparent to-transparent" />
        </div>

        <div className="absolute bottom-0 left-3 translate-y-1/2 sm:left-4">
          <div className="relative size-24 overflow-hidden rounded-full border-4 border-background bg-muted sm:size-28 md:size-32">
            <Image
              src={avatarSrc}
              alt={avatarAlt}
              fill
              priority
              className="object-cover"
              sizes="128px"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-0.5 px-3 pt-14 pb-6 sm:px-4 sm:pt-16">
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{name}</h1>
        <p className="text-muted-foreground text-sm sm:text-base">{handle}</p>
      </div>
    </section>
  );
}
