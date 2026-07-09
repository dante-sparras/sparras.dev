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
 * Profile header — tight grid borders flush to avatar / title / role text.
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
        ┌──────────┬─────────────────────┐  ← title top border
        │  Avatar  │  Name               │  ← no padding; borders hug content
        │  (flush) ├─────────────────────┤
        │          │  Role               │
        └──────────┴─────────────────────┘
      */}
      <div className="grid grid-cols-[auto_1fr] grid-rows-[1fr_auto] border-b border-border">
        <div className="row-span-2 flex items-center justify-center border-r border-border p-0">
          <div className="relative size-28 overflow-hidden rounded-full bg-muted sm:size-36">
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

        <div className="flex min-h-24 items-end border-t border-b border-border px-0 py-0 sm:min-h-32">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {hero.name}
          </h1>
        </div>

        <div className="flex items-center px-0 py-0">
          <p className="text-muted-foreground text-sm sm:text-base">
            {hero.role}
          </p>
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
