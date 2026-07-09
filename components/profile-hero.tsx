import Image from "next/image";
import type { LucideIcon } from "lucide-react";
import { GraduationCap, Link2, Mail, MapPin, Phone, Sun } from "lucide-react";
import type { Dictionary } from "@/lib/i18n/dictionaries/types";
import { siteProfile } from "@/lib/site/profile";

type HeroCopy = Dictionary["home"]["hero"];

export type ProfileHeroProps = {
  hero: HeroCopy;
  avatarSrc: string;
  /** Whole °C; omit weather row when null */
  temperatureC: number | null;
};

function MetaRow({
  Icon,
  children,
}: {
  Icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-2.5 text-sm text-muted-foreground">
      <Icon className="size-4 shrink-0 opacity-80" aria-hidden />
      <span className="min-w-0 leading-snug">{children}</span>
    </li>
  );
}

function MetaRowGlyph({
  glyph,
  children,
}: {
  glyph: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-2.5 text-sm text-muted-foreground">
      <span
        className="flex size-4 shrink-0 items-center justify-center text-[0.95rem] leading-none opacity-80"
        aria-hidden
      >
        {glyph}
      </span>
      <span className="min-w-0 leading-snug">{children}</span>
    </li>
  );
}

/**
 * Profile header:
 * - Avatar flush in left cell
 * - Right column matches avatar height
 * - Empty upper zone (future banner art)
 * - Title + role pinned to the bottom with tight borders
 */
export function ProfileHero({
  hero,
  avatarSrc,
  temperatureC,
}: ProfileHeroProps) {
  const weatherLabel =
    temperatureC === null ? null : `${temperatureC}°C (${hero.weatherPlace})`;

  return (
    <section className="w-full" aria-label={hero.name}>
      {/*
        ┌──────────┬─────────────────────┐
        │          │  (empty / banner)   │
        │  Avatar  ├─────────────────────┤
        │          │  Name               │  ← bottom of right column
        │          ├─────────────────────┤
        │          │  Role               │
        └──────────┴─────────────────────┘
      */}
      <div className="flex items-stretch border-b border-border">
        <div className="shrink-0 border-r border-border p-0">
          <div className="relative size-28 overflow-hidden rounded-full border border-border bg-muted sm:size-36">
            <Image
              src={avatarSrc}
              alt={hero.avatarAlt}
              fill
              priority
              className="object-cover object-[center_18%]"
              sizes="(max-width: 640px) 112px, 144px"
            />
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Reserved for future banner / art — stays empty for now */}
          <div className="min-h-0 flex-1" aria-hidden />

          <div className="shrink-0 border-t border-border p-0">
            <h1 className="border-b border-border px-2 py-0.5 text-2xl font-semibold tracking-tight leading-none sm:px-2.5 sm:text-3xl">
              {hero.name}
            </h1>
            <p className="text-muted-foreground px-2 py-0.5 text-sm leading-none sm:px-2.5 sm:text-base">
              {hero.role}
            </p>
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2">
        <ul className="flex flex-col gap-3 border-b border-border px-4 py-5 sm:border-r sm:border-b-0 sm:px-5 sm:py-6">
          <MetaRow Icon={GraduationCap}>{hero.student}</MetaRow>
          <MetaRow Icon={MapPin}>{hero.location}</MetaRow>
          {weatherLabel ? <MetaRow Icon={Sun}>{weatherLabel}</MetaRow> : null}
          <MetaRow Icon={Mail}>
            <a
              href={`mailto:${siteProfile.email}`}
              className="hover:text-foreground transition-colors"
            >
              {siteProfile.email}
            </a>
          </MetaRow>
          <MetaRow Icon={Link2}>
            <a
              href={siteProfile.websiteHref}
              className="hover:text-foreground transition-colors"
              rel="noopener noreferrer"
            >
              {siteProfile.websiteDisplay}
            </a>
          </MetaRow>
        </ul>

        <ul className="flex flex-col gap-3 px-4 py-5 sm:px-5 sm:py-6">
          <MetaRowGlyph glyph="♂">{hero.pronouns}</MetaRowGlyph>
          <MetaRow Icon={Phone}>
            <a
              href={siteProfile.phoneHref}
              className="hover:text-foreground transition-colors"
            >
              {siteProfile.phoneDisplay}
            </a>
          </MetaRow>
        </ul>
      </div>
    </section>
  );
}
