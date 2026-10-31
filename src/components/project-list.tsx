"use client";

import { ArrowUpRight, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { type PointerEvent, useState } from "react";
import { SkillBadge } from "@/components/skill-badge";
import { SparrasDevIllustration } from "@/components/sparras-dev-illustration";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { WinlandIllustration } from "@/components/winland-illustration";
import { WinshellIllustration } from "@/components/winshell-illustration";
import type { Project } from "@/content/projects";
import { cn } from "@/lib/utils";

const INITIAL_COUNT = 3;

/** `auto-rows-fr` keeps every card the same height, also when stacked. */
const gridClassName = "grid auto-rows-fr gap-4 px-6 sm:grid-cols-2";

const scenes = {
  winland: WinlandIllustration,
  winshell: WinshellIllustration,
  "sparras-dev": SparrasDevIllustration,
};

function ProjectCard({ project }: { project: Project }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const Scene = scenes[project.illustration];

  // A tap only follows the link, so the scene is for a mouse or the keyboard.
  const onPointerChange = (event: PointerEvent<HTMLAnchorElement>) => {
    if (event.pointerType === "mouse") {
      setIsPlaying(event.type === "pointerenter");
    }
  };

  return (
    <li>
      <Link
        href={project.href}
        onPointerEnter={onPointerChange}
        onPointerLeave={onPointerChange}
        onFocus={(event) =>
          setIsPlaying(event.currentTarget.matches(":focus-visible"))
        }
        onBlur={() => setIsPlaying(false)}
        className="group flex h-full flex-col overflow-hidden rounded-2xl border bg-card/40 outline-none transition duration-300 hover:border-foreground/40 focus-visible:border-foreground/60 focus-visible:ring-3 focus-visible:ring-ring/50 motion-safe:hover:-translate-y-0.5"
      >
        <div className="relative aspect-[2/1] overflow-hidden border-b">
          <Scene alt={project.illustrationAlt} isPlaying={isPlaying} />
        </div>
        <div className="flex flex-1 flex-col gap-2 p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-pixel text-xl leading-none">{project.title}</h3>
            <span
              aria-hidden
              className="grid size-8 shrink-0 place-items-center rounded-full border text-muted-foreground transition duration-300 group-hover:border-foreground group-hover:bg-foreground group-hover:text-background"
            >
              <ArrowUpRight className="size-4 transition-transform duration-300 motion-safe:group-hover:rotate-45" />
            </span>
          </div>
          <p className="text-pretty text-muted-foreground text-sm leading-6">
            {project.description}
          </p>
          {project.stack.length > 0 && (
            <ul className="mt-auto flex flex-wrap gap-1.5 pt-3">
              {project.stack.map((skill) => (
                <SkillBadge key={skill.name} skill={skill} />
              ))}
            </ul>
          )}
        </div>
      </Link>
    </li>
  );
}

export function ProjectList({
  projects,
  showAllLabel,
  showLessLabel,
}: {
  projects: readonly Project[];
  showAllLabel: string;
  showLessLabel: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const visibleProjects = projects.slice(0, INITIAL_COUNT);
  const hiddenProjects = projects.slice(INITIAL_COUNT);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <ul className={cn(gridClassName, "py-6")}>
        {visibleProjects.map((project) => (
          <ProjectCard key={project.title} project={project} />
        ))}
      </ul>
      {hiddenProjects.length > 0 && (
        <CollapsibleContent>
          <ul className={cn(gridClassName, "pb-6")}>
            {hiddenProjects.map((project) => (
              <ProjectCard key={project.title} project={project} />
            ))}
          </ul>
        </CollapsibleContent>
      )}
      {hiddenProjects.length > 0 && (
        <div className="border-t">
          <CollapsibleTrigger
            render={
              <Button
                variant="ghost"
                className="h-auto w-full cursor-pointer gap-2 rounded-none px-6 py-3 text-foreground text-sm aria-expanded:bg-transparent"
              >
                {isOpen ? showLessLabel : showAllLabel}
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
