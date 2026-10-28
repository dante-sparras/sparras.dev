"use client";

import { ArrowUpRight, ChevronDown, ChevronUp } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { Project } from "@/content/projects";

const INITIAL_COUNT = 3;

function ProjectRow({ project }: { project: Project }) {
  return (
    <li>
      <Link
        href={project.href}
        className="group flex items-center gap-4 px-6 py-4 outline-none transition-colors hover:bg-muted/20 focus-visible:bg-muted/20 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <h4 className="font-medium text-base">{project.title}</h4>
            {project.stack.length > 0 && (
              <ul className="flex flex-wrap items-center gap-2">
                {project.stack.map((skill) => (
                  <li key={skill.name} title={skill.name}>
                    <Image
                      src={skill.iconSrc}
                      alt={skill.name}
                      width={14}
                      height={14}
                      className="size-3.5 object-contain opacity-70 transition-opacity group-hover:opacity-100"
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
          <p className="mt-1 text-pretty text-muted-foreground text-sm leading-5">
            {project.description}
          </p>
        </div>
        <ArrowUpRight
          aria-hidden
          className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"
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
