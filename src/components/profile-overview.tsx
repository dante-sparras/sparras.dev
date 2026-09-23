import type { LucideIcon } from "lucide-react";
import {
  ClockIcon,
  CodeXmlIcon,
  LightbulbIcon,
  LinkIcon,
  MapPinIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { LocalTime } from "@/components/local-time";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type OverviewLink = {
  label: string;
  href: React.ComponentProps<typeof Link>["href"];
};

const company = {
  label: "Casuology",
  href: "https://casuology.com",
} as const satisfies OverviewLink;

const facts = {
  role: "Full-stack Developer",
  studio: "Building games",
  location: "Norrköping, Sweden",
  github: {
    label: "github.com/dante-sparras",
    href: "https://github.com/dante-sparras",
  },
  website: {
    label: "sparras.dev",
    href: "https://sparras.dev",
  },
  x: {
    label: "x.com/DanteSparras",
    href: "https://x.com/DanteSparras",
  },
  linkedin: {
    label: "linkedin.com/in/dante-sparras",
    href: "https://www.linkedin.com/in/dante-sparras/",
  },
} as const;

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

function BrandIcon({
  src,
  alt,
}: {
  src: React.ComponentProps<typeof Image>["src"];
  alt: string;
}) {
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

function FactLink({
  href,
  children,
}: {
  href: OverviewLink["href"];
  children: ReactNode;
}) {
  return (
    <Link href={href} className="underline-offset-4 hover:underline">
      {children}
    </Link>
  );
}

export function ProfileOverview({ className }: { className?: string }) {
  return (
    <section
      aria-label="Profile details"
      className={cn("border-b px-6 py-5", className)}
    >
      <div className="flex flex-col gap-2.5 sm:flex-row sm:gap-0">
        <ul className="flex flex-1 flex-col gap-2.5">
          <LucideRow icon={CodeXmlIcon}>
            {facts.role} @{" "}
            <FactLink href={company.href}>{company.label}</FactLink>
          </LucideRow>
          <LucideRow icon={LightbulbIcon}>
            {facts.studio} @{" "}
            <FactLink href={company.href}>{company.label}</FactLink>
          </LucideRow>
          <LucideRow icon={MapPinIcon}>{facts.location}</LucideRow>
          <OverviewRow icon={<BrandIcon src="/icons/github.svg" alt="" />}>
            <FactLink href={facts.github.href}>{facts.github.label}</FactLink>
          </OverviewRow>
          <LucideRow icon={LinkIcon}>
            <FactLink href={facts.website.href}>{facts.website.label}</FactLink>
          </LucideRow>
        </ul>
        <Separator
          orientation="vertical"
          className="mx-6 hidden h-auto self-stretch sm:block"
        />
        <ul className="flex flex-1 flex-col gap-2.5">
          <LucideRow icon={ClockIcon}>
            <LocalTime />
          </LucideRow>
          <OverviewRow icon={<BrandIcon src="/icons/x.svg" alt="" />}>
            <FactLink href={facts.x.href}>{facts.x.label}</FactLink>
          </OverviewRow>
          <OverviewRow icon={<BrandIcon src="/icons/linkedin.svg" alt="" />}>
            <FactLink href={facts.linkedin.href}>
              {facts.linkedin.label}
            </FactLink>
          </OverviewRow>
        </ul>
      </div>
    </section>
  );
}
