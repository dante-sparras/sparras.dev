"use client";

import { ArrowUpRight, ChevronDown, ChevronUp } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { type PointerEvent, useState } from "react";
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

const INITIAL_COUNT = 3;

const scenes = {
  winland: WinlandIllustration,
  winshell: WinshellIllustration,
  "sparras-dev": SparrasDevIllustration,
};

function ProjectRow({ project }: { project: Project }) {
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
        className="group flex flex-col gap-4 px-6 py-5 outline-none transition-colors hover:bg-muted/20 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset sm:flex-row sm:items-center sm:gap-6"
      >
        <div className="relative aspect-[2/1] w-full shrink-0 overflow-hidden border sm:w-64">
          <Scene alt={project.illustrationAlt} isPlaying={isPlaying} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-pixel text-xl leading-none">{project.title}</h3>
          <p className="mt-2 text-pretty text-muted-foreground text-sm leading-6">
            {project.description}
          </p>
          {project.stack.length > 0 && (
            <ul className="mt-3 flex flex-wrap items-center gap-2.5">
              {project.stack.map((skill) => (
                <li key={skill.name} title={skill.name}>
                  <Image
                    src={skill.iconSrc}
                    alt={skill.name}
                    width={18}
                    height={18}
                    className="size-4.5 object-contain"
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
        <ArrowUpRight
          aria-hidden
          className="hidden size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground sm:block"
        />
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
      <ul className="divide-y">
        {visibleProjects.map((project) => (
          <ProjectRow key={project.title} project={project} />
        ))}
      </ul>
      {hiddenProjects.length > 0 && (
        <CollapsibleContent>
          <ul className="divide-y border-t">
            {hiddenProjects.map((project) => (
              <ProjectRow key={project.title} project={project} />
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
