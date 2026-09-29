import type { LucideIcon } from "lucide-react";
import {
  ClockIcon,
  CloudDrizzleIcon,
  CloudFogIcon,
  CloudIcon,
  CloudLightningIcon,
  CloudMoonIcon,
  CloudRainIcon,
  CloudSnowIcon,
  CloudSunIcon,
  CodeXmlIcon,
  GraduationCapIcon,
  LightbulbIcon,
  MailIcon,
  MapPinIcon,
  MoonIcon,
  SunIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { LocalTime } from "@/components/local-time";
import { getProfile, type SocialLink } from "@/content/profile";
import type { Href } from "@/content/types";
import type { Locale } from "@/i18n/locale";
import { getMessages } from "@/i18n/messages";
import { cn } from "@/lib/utils";
import {
  type CurrentWeather,
  formatTemperature,
  getCurrentWeather,
} from "@/lib/weather";

const socialIconOrder = ["X", "GitHub", "LinkedIn", "Discord"];

function socialIcons(links: SocialLink[]) {
  const byPlatform = new Map(links.map((link) => [link.platform, link]));
  const ordered = socialIconOrder.flatMap((platform) => {
    const link = byPlatform.get(platform);
    return link ? [link] : [];
  });
  const listed = new Set(socialIconOrder);

  return [...ordered, ...links.filter((link) => !listed.has(link.platform))];
}

function OverviewRow({
  icon,
  children,
}: {
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <li className="flex items-center gap-2.5 text-sm">
      <span className="flex size-4 shrink-0 items-center justify-center text-muted-foreground [&_svg]:size-4">
        {icon}
      </span>
      <span className="min-w-0">{children}</span>
    </li>
  );
}

function LucideRow({
  icon: Icon,
  children,
}: {
  icon: LucideIcon;
  children: ReactNode;
}) {
  return <OverviewRow icon={<Icon />}>{children}</OverviewRow>;
}

export function SocialLinkBadges({ locale }: { locale: Locale }) {
  const profile = getProfile(locale);
  const messages = getMessages(locale);

  return (
    <nav aria-label={messages.socialLinks} className="pointer-events-auto">
      <ul className="flex items-center gap-1.5">
        {socialIcons(profile.socialLinks).map((link) => (
          <li key={link.platform}>
            <Link
              href={link.href}
              aria-label={link.platform}
              className="flex size-5 shrink-0 items-center justify-center rounded-md outline-none transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <Image
                alt=""
                className="size-3 object-contain brightness-0 invert"
                height={12}
                src={link.iconSrc}
                width={12}
              />
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function weatherIcon({ condition, isDay }: CurrentWeather): LucideIcon {
  switch (condition) {
    case "clear":
      return isDay ? SunIcon : MoonIcon;
    case "partlyCloudy":
      return isDay ? CloudSunIcon : CloudMoonIcon;
    case "cloudy":
      return CloudIcon;
    case "fog":
      return CloudFogIcon;
    case "drizzle":
      return CloudDrizzleIcon;
    case "rain":
      return CloudRainIcon;
    case "snow":
      return CloudSnowIcon;
    case "thunderstorm":
      return CloudLightningIcon;
  }
}

function FactLink({ href, children }: { href: Href; children: ReactNode }) {
  return (
    <Link href={href} className="underline-offset-4 hover:underline">
      {children}
    </Link>
  );
}

export async function ProfileOverview({
  locale,
  className,
}: {
  locale: Locale;
  className?: string;
}) {
  const profile = getProfile(locale);
  const messages = getMessages(locale);
  const weather = await getCurrentWeather(profile.coordinates);
  const company = (
    <FactLink href={profile.company.href}>{profile.company.name}</FactLink>
  );

  return (
    <section
      aria-label={messages.profileDetails}
      className={cn("border-b", className)}
    >
      <ul className="flex flex-col gap-2.5 px-6 py-5 sm:relative sm:grid sm:auto-cols-fr sm:grid-flow-col sm:grid-rows-4 sm:gap-x-12 sm:before:absolute sm:before:inset-y-0 sm:before:left-1/2 sm:before:w-px sm:before:bg-border">
        <LucideRow icon={CodeXmlIcon}>
          {profile.role} @ {company}
        </LucideRow>
        <LucideRow icon={LightbulbIcon}>
          {profile.focus} @ {company}
        </LucideRow>
        <LucideRow icon={GraduationCapIcon}>
          {profile.studies} @ {profile.school}
        </LucideRow>
        <LucideRow icon={MapPinIcon}>{profile.location}</LucideRow>
        {weather && (
          <LucideRow icon={weatherIcon(weather)}>
            <span className="tabular-nums">
              {formatTemperature(weather.temperature)}
            </span>
            {` // ${messages.weather[weather.condition]}`}
          </LucideRow>
        )}
        <LucideRow icon={ClockIcon}>
          <LocalTime
            labels={{
              localTime: messages.localTime,
              same: messages.sameTime,
              ahead: messages.ahead,
              behind: messages.behind,
            }}
            locale={locale}
            timeZone={profile.timeZone}
          />
        </LucideRow>
        <LucideRow icon={MailIcon}>
          <FactLink href={`mailto:${profile.email}`}>{profile.email}</FactLink>
        </LucideRow>
      </ul>
    </section>
  );
}
