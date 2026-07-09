import Image from "next/image";
import type { ReactNode } from "react";
import {
  GraduationCap,
  Link2,
  Mail,
  MapPin,
  Phone,
  Sun,
  UserRound,
} from "lucide-react";
import type { Dictionary } from "@/lib/i18n/dictionaries/types";
import { siteProfile } from "@/lib/site/profile";

type HeroCopy = Dictionary["home"]["hero"];

export type ProfileHeroProps = {
  hero: HeroCopy;
  avatarSrc: string;
  /** Whole °C; omit weather row when null */
  temperatureC: number | null;
};

function MetaRow({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <li className="flex items-center gap-2.5 text-sm text-muted-foreground">
      <span className="text-muted-foreground/80 [&_svg]:size-4" aria-hidden>
        {icon}
      </span>
      <span className="min-w-0 leading-snug">{children}</span>
    </li>
  );
}

/**
 * Profile header aligned to the sparras reference: circular portrait,
 * name + role, two-column icon meta (education, location, weather, contact).
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
      {/* Identity: avatar | name + role */}
      <div className="flex items-center gap-4 border-b border-border px-4 py-5 sm:gap-6 sm:px-5 sm:py-6">
        <div className="relative size-28 shrink-0 overflow-hidden rounded-full bg-muted sm:size-36">
          <Image
            src={avatarSrc}
            alt={hero.avatarAlt}
            fill
            priority
            className="object-cover object-[center_18%]"
            sizes="(max-width: 640px) 112px, 144px"
          />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {hero.name}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            {hero.role}
          </p>
        </div>
      </div>

      {/* Meta grid */}
      <div className="grid sm:grid-cols-2">
        <ul className="flex flex-col gap-3 border-b border-border px-4 py-5 sm:border-r sm:border-b-0 sm:px-5 sm:py-6">
          <MetaRow icon={<GraduationCap />}>{hero.student}</MetaRow>
          <MetaRow icon={<MapPin />}>{hero.location}</MetaRow>
          {weatherLabel ? (
            <MetaRow icon={<Sun />}>{weatherLabel}</MetaRow>
          ) : null}
          <MetaRow icon={<Mail />}>
            <a
              href={`mailto:${siteProfile.email}`}
              className="hover:text-foreground transition-colors"
            >
              {siteProfile.email}
            </a>
          </MetaRow>
          <MetaRow icon={<Link2 />}>
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
          <MetaRow icon={<UserRound />}>{hero.pronouns}</MetaRow>
          <MetaRow icon={<Phone />}>
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
