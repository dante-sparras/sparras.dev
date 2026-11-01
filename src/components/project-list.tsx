"use client";

import { ArrowUpRight, ChevronDown, ChevronUp } from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { type PointerEvent, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { Project } from "@/content/projects";
import { useIsNearScreen } from "@/hooks/use-is-near-screen";

const INITIAL_COUNT = 3;

// The scenes are half the page's elements and start well below the first
// screen, so they stay out of the HTML and are only fetched on the way there.
const scenes = {
  winland: dynamic(
    () =>
      import("@/components/winland-illustration").then(
        (module) => module.WinlandIllustration,
      ),
    { ssr: false },
  ),
  winshell: dynamic(
    () =>
      import("@/components/winshell-illustration").then(
        (module) => module.WinshellIllustration,
      ),
    { ssr: false },
  ),
  "sparras-dev": dynamic(
    () =>
      import("@/components/sparras-dev-illustration").then(
        (module) => module.SparrasDevIllustration,
      ),
    { ssr: false },
  ),
};

function ProjectRow({ project }: { project: Project }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const sceneBox = useRef<HTMLDivElement>(null);
  const isNearScreen = useIsNearScreen(sceneBox);
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
        className="group flex flex-col gap-4 px-6 py-5 transition-colors outline-none hover:bg-muted/20 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset sm:flex-row sm:items-center sm:gap-6"
      >
        <div
          ref={sceneBox}
          className="relative aspect-[2/1] w-full shrink-0 overflow-hidden border sm:w-64"
        >
          {isNearScreen ? (
            <Scene alt={project.illustrationAlt} isPlaying={isPlaying} />
          ) : (
            <div
              role="img"
              aria-label={project.illustrationAlt}
              className="absolute inset-0"
            />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-pixel text-xl leading-none">{project.title}</h3>
          <p className="mt-2 text-sm leading-6 text-pretty text-muted-foreground">
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
                className="h-auto w-full cursor-pointer gap-2 rounded-none px-6 py-3 text-sm text-foreground aria-expanded:bg-transparent"
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
