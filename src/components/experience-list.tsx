import type { LucideIcon } from "lucide-react";
import {
  ArrowUpRight,
  Award,
  Briefcase,
  ChevronDown,
  CodeXml,
  Gamepad2,
  GraduationCap,
  Handshake,
  Lightbulb,
  MapPin,
  Megaphone,
  School,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { SkillBadge } from "@/components/skill-badge";
import type {
  Experience,
  ExperienceIcon,
  ExperienceRole,
} from "@/content/experience";
import { allSkills } from "@/content/skills";

const icons = {
  briefcase: Briefcase,
  gamepad: Gamepad2,
  graduation: GraduationCap,
  school: School,
  code: CodeXml,
  megaphone: Megaphone,
  lightbulb: Lightbulb,
  award: Award,
} satisfies Record<ExperienceIcon, LucideIcon>;

const kindIcons = {
  education: GraduationCap,
  work: Briefcase,
  contribution: Handshake,
} satisfies Record<Experience["kind"], LucideIcon>;

/** The organizations with accomplishments to read, so they start open. */
const INITIAL_OPEN_COUNT = 3;

function OrganizationMark({ entry }: { entry: Experience }) {
  const Icon = icons[entry.icon];

  return entry.logoSrc ? (
    <Image
      src={entry.logoSrc}
      alt=""
      width={32}
      height={32}
      className="size-8 shrink-0 rounded-lg border bg-background object-cover"
    />
  ) : (
    <span className="grid size-8 shrink-0 place-items-center rounded-lg border text-muted-foreground">
      <Icon aria-hidden className="size-4" />
    </span>
  );
}

function KindBadge({ entry }: { entry: Experience }) {
  const Icon = kindIcons[entry.kind];

  return (
    <span className="inline-flex h-5 items-center gap-1 rounded-full border px-1.5 font-mono text-[10px] text-muted-foreground">
      <Icon aria-hidden className="size-3" />
      {entry.kindLabel}
    </span>
  );
}

function SkillBadges({ names }: { names: readonly string[] }) {
  return (
    <ul className="mt-2 flex flex-wrap gap-1.5">
      {names
        .flatMap((name) => allSkills.filter((skill) => skill.name === name))
        .map((skill) => (
          <SkillBadge key={skill.name} skill={skill} />
        ))}
    </ul>
  );
}

function RoleDescription({ role }: { role: ExperienceRole }) {
  return (
    <>
      {role.description.length === 1 ? (
        <p className="text-sm leading-6 text-pretty">{role.description[0]}</p>
      ) : role.description.length > 1 ? (
        <ul className="list-disc space-y-1.5 pl-4 text-sm leading-6 marker:text-muted-foreground">
          {role.description.map((line) => (
            <li key={line} className="pl-0.5 text-pretty">
              {line}
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}

function AdditionalRole({ role }: { role: ExperienceRole }) {
  const Icon = icons[role.icon];

  return (
    <li className="py-4 last:pb-0">
      <div className="flex items-start gap-2">
        <Icon
          aria-hidden
          className="mt-0.5 size-4 shrink-0 text-muted-foreground"
        />
        <div className="min-w-0">
          <h4 className="text-sm leading-5 font-medium text-pretty">
            {role.title}
          </h4>
          <p className="mt-1 font-mono text-[11px] leading-5 text-muted-foreground">
            {role.meta}
          </p>
        </div>
      </div>
      {role.description.length > 0 ? (
        <div className="mt-2 pl-6">
          <RoleDescription role={role} />
        </div>
      ) : null}
    </li>
  );
}

export function ExperienceList({
  entries,
  currentLabel,
  websiteLabel,
  additionalRolesLabel,
}: {
  entries: readonly Experience[];
  currentLabel: string;
  websiteLabel: string;
  additionalRolesLabel: (count: number) => string;
}) {
  return (
    <ul className="divide-y">
      {entries.map((entry, index) => {
        const primaryRole = entry.roles[0];
        const additionalRoles = entry.roles.slice(1);
        const skillNames = [
          ...new Set(entry.roles.flatMap((role) => role.skills)),
        ];

        return (
          <li key={entry.company}>
            <details
              className="group/experience transition-colors hover:bg-muted/20"
              open={index < INITIAL_OPEN_COUNT}
            >
              <summary className="group flex cursor-pointer list-none items-start gap-3 px-6 py-4 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset [&::-webkit-details-marker]:hidden">
                <OrganizationMark entry={entry} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <h3 className="text-sm font-medium">{entry.company}</h3>
                    <KindBadge entry={entry} />
                    {entry.isCurrent && (
                      <span className="inline-flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground">
                        <span
                          aria-hidden
                          className="size-1 rounded-full bg-foreground"
                        />
                        {currentLabel}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                    <span>{primaryRole?.title}</span>
                    {additionalRoles.length > 0 && (
                      <span className="rounded-full border px-1.5 font-mono text-[10px]">
                        <span aria-hidden>+{additionalRoles.length}</span>
                        <span className="sr-only">
                          {additionalRolesLabel(additionalRoles.length)}
                        </span>
                      </span>
                    )}
                  </div>
                  <p className="mt-1 font-mono text-[11px] leading-5 text-muted-foreground">
                    {primaryRole?.meta}
                  </p>
                  {skillNames.length > 0 && <SkillBadges names={skillNames} />}
                </div>
                <ChevronDown
                  aria-hidden
                  className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-open/experience:rotate-180 motion-reduce:transition-none"
                />
              </summary>
              <div className="pr-6 pb-5 pl-[4.25rem]">
                {primaryRole && <RoleDescription role={primaryRole} />}
                {additionalRoles.length > 0 && (
                  <ul className="mt-4 divide-y border-t">
                    {additionalRoles.map((role) => (
                      <AdditionalRole key={role.title} role={role} />
                    ))}
                  </ul>
                )}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t pt-3 text-xs text-muted-foreground">
                  <p className="flex items-start gap-1.5">
                    <MapPin aria-hidden className="mt-0.5 size-3 shrink-0" />
                    {entry.location}
                  </p>
                  {entry.href && (
                    <Link
                      href={entry.href}
                      aria-label={`${websiteLabel}: ${entry.company}`}
                      className="inline-flex items-center gap-1 underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:text-foreground focus-visible:underline"
                    >
                      {websiteLabel}
                      <ArrowUpRight aria-hidden className="size-3" />
                    </Link>
                  )}
                </div>
              </div>
            </details>
          </li>
        );
      })}
    </ul>
  );
}
