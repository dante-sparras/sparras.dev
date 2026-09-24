import type { LucideIcon } from "lucide-react";
import {
  ClockIcon,
  CodeXmlIcon,
  LightbulbIcon,
  MapPinIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { LocalTime } from "@/components/local-time";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getProfile, type SocialLink } from "@/content/profile";
import type { Href } from "@/content/types";
import type { Locale } from "@/i18n/locale";
import { getMessages } from "@/i18n/messages";
import { cn } from "@/lib/utils";

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

function FactLink({ href, children }: { href: Href; children: ReactNode }) {
  return (
    <Link href={href} className="underline-offset-4 hover:underline">
      {children}
    </Link>
  );
}

export function ProfileOverview({
  locale,
  className,
}: {
  locale: Locale;
  className?: string;
}) {
  const profile = getProfile(locale);
  const messages = getMessages(locale);
  const company = (
    <FactLink href={profile.company.href}>{profile.company.name}</FactLink>
  );

  return (
    <section
      aria-label={messages.profileDetails}
      className={cn("border-b", className)}
    >
      <nav aria-label={messages.socialLinks} className="border-b px-6 py-3">
        <ul className="flex items-center gap-2">
          {socialIcons(profile.socialLinks).map((link) => (
            <li key={link.platform}>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="outline"
                      size="icon-lg"
                      nativeButton={false}
                      render={
                        <Link href={link.href} aria-label={link.platform} />
                      }
                      className="before:hidden"
                    />
                  }
                >
                  <Image
                    src={link.iconSrc}
                    alt=""
                    width={16}
                    height={16}
                    className="size-4 object-contain brightness-0 invert"
                  />
                </TooltipTrigger>
                <TooltipContent>{link.platform}</TooltipContent>
              </Tooltip>
            </li>
          ))}
        </ul>
      </nav>
      <ul className="flex flex-col gap-2.5 px-6 py-5">
        <LucideRow icon={CodeXmlIcon}>
          {profile.role} @ {company}
        </LucideRow>
        <LucideRow icon={LightbulbIcon}>
          {profile.focus} @ {company}
        </LucideRow>
        <LucideRow icon={MapPinIcon}>{profile.location}</LucideRow>
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
      </ul>
    </section>
  );
}
