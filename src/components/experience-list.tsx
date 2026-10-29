"use client";

import type { LucideIcon } from "lucide-react";
import {
  Award,
  Briefcase,
  ChevronDown,
  ChevronUp,
  CodeXml,
  Gamepad2,
  GraduationCap,
  Lightbulb,
  Megaphone,
  School,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { Experience, ExperienceIcon } from "@/content/experience";
import { cn } from "@/lib/utils";

const INITIAL_COUNT = 3;

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

function ExperienceIconBadge({
  icon,
  large = false,
  className,
}: {
  icon: ExperienceIcon;
  large?: boolean;
  className?: string;
}) {
  const Icon = icons[icon];

  return (
    <span
      className={cn(
        "relative z-10 flex shrink-0 items-center justify-center border bg-background text-muted-foreground",
        large ? "size-8 rounded-lg" : "size-6 rounded-md",
        className,
      )}
    >
      <Icon aria-hidden className={large ? "size-4" : "size-3.5"} />
    </span>
  );
}

function RoleRow({
  role,
  defaultOpen,
}: {
  role: Experience["roles"][number];
  defaultOpen: boolean;
}) {
  const hasDetails = role.description.length > 0;

  return (
    <li className="relative pl-6">
      <ExperienceIconBadge
        className="absolute top-0 -left-3"
        icon={role.icon}
      />
      <Collapsible defaultOpen={defaultOpen}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h5 className="font-semibold text-sm">{role.title}</h5>
            <p className="mt-0.5 text-muted-foreground text-xs">{role.meta}</p>
          </div>
          {hasDetails ? (
            <CollapsibleTrigger
              aria-label={role.title}
              className="group -mr-1 flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <ChevronDown
                aria-hidden
                className="size-4 transition-transform group-data-panel-open:rotate-180 motion-reduce:transition-none"
              />
            </CollapsibleTrigger>
          ) : null}
        </div>
        {hasDetails ? (
          <CollapsibleContent>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-sm leading-5 marker:text-muted-foreground">
              {role.description.map((line) => (
                <li key={line} className="text-pretty">
                  {line}
                </li>
              ))}
            </ul>
          </CollapsibleContent>
        ) : null}
        {role.skills.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {role.skills.map((skill) => (
              <li key={skill}>
                <span className="inline-flex rounded-md border px-2 py-0.5 text-muted-foreground text-xs">
                  {skill}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Collapsible>
    </li>
  );
}

function ExperienceCompany({
  entry,
  defaultOpen,
  currentLabel,
}: {
  entry: Experience;
  defaultOpen: boolean;
  currentLabel: string;
}) {
  return (
    <li className="px-6 py-5">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <div className="flex min-w-0 items-center gap-3">
          {entry.logoSrc ? (
            <span className="relative size-8 shrink-0 overflow-hidden rounded-lg border">
              <Image
                alt=""
                className="size-8 object-cover"
                height={32}
                src={entry.logoSrc}
                width={32}
              />
            </span>
          ) : (
            <ExperienceIconBadge icon={entry.icon} large />
          )}
          <h4 className="font-semibold text-sm sm:text-base">
            {entry.href ? (
              <Link
                href={entry.href}
                className="underline-offset-4 hover:underline"
              >
                {entry.company}
              </Link>
            ) : (
              entry.company
            )}
          </h4>
        </div>
        <p className="flex items-center text-muted-foreground text-xs sm:text-sm">
          {entry.location}
          {entry.isCurrent ? (
            <span
              aria-label={currentLabel}
              className="ml-2 size-1.5 rounded-full bg-sky-400 shadow-[0_0_0_3px_color-mix(in_oklch,var(--color-sky-400)_35%,transparent)]"
              role="img"
            />
          ) : null}
        </p>
      </div>
      <ul className="relative mt-4 ml-4 space-y-5 border-l">
        {entry.roles.map((role, index) => (
          <RoleRow
            defaultOpen={defaultOpen && index === 0}
            key={role.title}
            role={role}
          />
        ))}
      </ul>
    </li>
  );
}

export function ExperienceList({
  entries,
  showMoreLabel,
  showLessLabel,
  currentLabel,
}: {
  entries: readonly Experience[];
  showMoreLabel: string;
  showLessLabel: string;
  currentLabel: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const visibleEntries = entries.slice(0, INITIAL_COUNT);
  const hiddenEntries = entries.slice(INITIAL_COUNT);

  return (
    <Collapsible onOpenChange={setIsOpen} open={isOpen}>
      <ul className="divide-y">
        {visibleEntries.map((entry, index) => (
          <ExperienceCompany
            currentLabel={currentLabel}
            defaultOpen={index === 0}
            entry={entry}
            key={entry.company}
          />
        ))}
      </ul>
      {hiddenEntries.length > 0 && (
        <CollapsibleContent>
          <ul className="divide-y border-t">
            {hiddenEntries.map((entry) => (
              <ExperienceCompany
                currentLabel={currentLabel}
                defaultOpen={false}
                entry={entry}
                key={entry.company}
              />
            ))}
          </ul>
        </CollapsibleContent>
      )}
      {hiddenEntries.length > 0 && (
        <div className="border-t">
          <CollapsibleTrigger
            render={
              <Button
                className="h-auto w-full cursor-pointer gap-2 rounded-none px-6 py-3 text-foreground text-sm aria-expanded:bg-transparent"
                variant="ghost"
              >
                {isOpen ? showLessLabel : showMoreLabel}
                {isOpen ? (
                  <ChevronUp aria-hidden className="size-4" />
                ) : (
                  <ChevronDown aria-hidden className="size-4" />
                )}
              </Button>
            }
          />
        </div>
      )}
    </Collapsible>
  );
}
