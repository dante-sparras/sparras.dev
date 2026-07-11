import Image from "next/image";
import type { LucideIcon } from "lucide-react";
import { GraduationCap, Link2, Mail, MapPin, Phone, Sun } from "lucide-react";
import { BlackHoleBanner } from "@/components/black-hole";
import { SITE_CONTACT } from "@/lib/constants";
import type { Dictionary } from "@/lib/i18n";

type HeroCopy = Dictionary["home"]["hero"];

export type ProfileHeroProps = {
  hero: HeroCopy;
  /** Whole °C; omit weather row when null */
  temperatureC: number | null;
};

function MetaRow({
  icon: Icon,
  glyph,
  children,
}: {
  icon?: LucideIcon;
  glyph?: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-2.5 text-sm text-muted-foreground">
      {Icon ? (
        <Icon className="size-4 shrink-0 opacity-80" aria-hidden />
      ) : (
        <span
          className="flex size-4 shrink-0 items-center justify-center text-[0.95rem] leading-none opacity-80"
          aria-hidden
        >
          {glyph}
        </span>
      )}
      <span className="min-w-0 leading-snug">{children}</span>
    </li>
  );
}

/**
 * Profile header:
 * - Avatar flush in left cell
 * - Right column matches avatar height
 * - Banner zone: WebGPU black hole (`<BlackHoleBanner />`)
 * - Title + role pinned to the bottom with tight borders
 */
export function ProfileHero({ hero, temperatureC }: ProfileHeroProps) {
  const weatherLabel =
    temperatureC === null ? null : `${temperatureC}°C (${hero.weatherPlace})`;

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
          <BlackHoleBanner />

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
          <MetaRow icon={GraduationCap}>{hero.student}</MetaRow>
          <MetaRow icon={MapPin}>{hero.location}</MetaRow>
          {weatherLabel ? <MetaRow icon={Sun}>{weatherLabel}</MetaRow> : null}
          <MetaRow icon={Mail}>
            <a
              href={`mailto:${SITE_CONTACT.email}`}
              className="hover:text-foreground transition-colors"
            >
              {SITE_CONTACT.email}
            </a>
          </MetaRow>
          <MetaRow icon={Link2}>
            <a
              href={SITE_CONTACT.websiteHref}
              className="hover:text-foreground transition-colors"
              rel="noopener noreferrer"
            >
              {SITE_CONTACT.websiteDisplay}
            </a>
          </MetaRow>
        </ul>

        <ul className="flex flex-col gap-3 px-4 py-5 sm:px-5 sm:py-6">
          <MetaRow glyph="♂">{hero.pronouns}</MetaRow>
          <MetaRow icon={Phone}>
            <a
              href={SITE_CONTACT.phoneHref}
              className="hover:text-foreground transition-colors"
            >
              {SITE_CONTACT.phoneDisplay}
            </a>
          </MetaRow>
        </ul>
      </div>
    </section>
  );
}
