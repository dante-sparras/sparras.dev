import Image from "next/image";

export type ProfileHeroProps = {
  name: string;
  handle: string;
  bannerSrc: string;
  avatarSrc: string;
  bannerAlt: string;
  avatarAlt: string;
};

/**
 * X/Twitter-style profile header: full-width banner, circular avatar
 * overlapping the bottom-left edge of the banner.
 */
export function ProfileHero({
  name,
  handle,
  bannerSrc,
  avatarSrc,
  bannerAlt,
  avatarAlt,
}: ProfileHeroProps) {
  return (
    <section className="w-full" aria-label={name}>
      <div className="relative">
        <div className="relative aspect-[3/1] w-full overflow-hidden bg-muted">
          <Image
            src={bannerSrc}
            alt={bannerAlt}
            fill
            priority
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 48rem"
          />
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

      {/* Space under the overlapping avatar — like X profile text block */}
      <div className="flex flex-col gap-0.5 px-3 pt-14 pb-6 sm:px-4 sm:pt-16">
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{name}</h1>
        <p className="text-muted-foreground text-sm sm:text-base">{handle}</p>
      </div>
    </section>
  );
}
