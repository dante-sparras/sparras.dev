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
import { Separator } from "@/components/ui/separator";
import { profile } from "@/content/profile";
import type { Href, ImageSrc } from "@/content/types";
import { cn } from "@/lib/utils";

function OverviewRow({
  icon,
  children,
}: {
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <li className="flex items-center gap-2.5 text-sm">
      <span className="flex size-4 shrink-0 items-center justify-center text-muted-foreground [&_img]:size-4 [&_svg]:size-4">
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

function BrandIcon({ src, alt }: { src: ImageSrc; alt: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={16}
      height={16}
      className="size-4 object-contain brightness-0 invert"
    />
  );
}

function FactLink({ href, children }: { href: Href; children: ReactNode }) {
  return (
    <Link href={href} className="underline-offset-4 hover:underline">
      {children}
    </Link>
  );
}

export function ProfileOverview({ className }: { className?: string }) {
  const company = (
    <FactLink href={profile.company.href}>{profile.company.name}</FactLink>
  );

  return (
    <section
      aria-label="Profile details"
      className={cn("border-b px-6 py-5", className)}
    >
      <div className="flex flex-col gap-2.5 sm:flex-row sm:gap-0">
        <ul className="flex flex-1 flex-col gap-2.5">
          <LucideRow icon={CodeXmlIcon}>
            {profile.role} @ {company}
          </LucideRow>
          <LucideRow icon={LightbulbIcon}>
            {profile.focus} @ {company}
          </LucideRow>
          <LucideRow icon={MapPinIcon}>{profile.location}</LucideRow>
          <LucideRow icon={ClockIcon}>
            <LocalTime timeZone={profile.timeZone} />
          </LucideRow>
        </ul>
        <Separator
          orientation="vertical"
          className="mx-6 hidden h-auto self-stretch sm:block"
        />
        <ul className="flex flex-1 flex-col gap-2.5">
          {profile.socialLinks.map((link) => (
            <OverviewRow
              key={link.platform}
              icon={<BrandIcon src={link.iconSrc} alt="" />}
            >
              <FactLink href={link.href}>{link.label}</FactLink>
            </OverviewRow>
          ))}
        </ul>
      </div>
    </section>
  );
}
