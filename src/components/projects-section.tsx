"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { H3 } from "@/components/typography/h3";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface Project {
  title: string;
  description: string;
  href: React.ComponentProps<typeof Link>["href"];
}

interface ProjectsSectionProps {
  projects: Project[];
}

export function ProjectsSection({ projects }: ProjectsSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const INITIAL_COUNT = 6;

  const visibleProjects = projects.slice(0, INITIAL_COUNT);
  const hiddenProjects = projects.slice(INITIAL_COUNT);

  return (
    <section aria-labelledby="projects-heading">
      <div className="flex items-center justify-between border-b px-6 py-3">
        <H3 id="projects">Projects</H3>
      </div>

      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="grid gap-4 px-6 py-6 sm:grid-cols-2 lg:grid-cols-3">
          {visibleProjects.map((project) => (
            <Link key={project.title} href={project.href}>
              <Card className="h-full transition-colors hover:bg-muted/50">
                <CardHeader>
                  <CardTitle>{project.title}</CardTitle>
                  <CardDescription>{project.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>

        <CollapsibleContent>
          <div className="grid gap-4 px-6 pb-6 sm:grid-cols-2 lg:grid-cols-3">
            {hiddenProjects.map((project) => (
              <Link key={project.title} href={project.href}>
                <Card className="h-full transition-colors hover:bg-muted/50">
                  <CardHeader>
                    <CardTitle>{project.title}</CardTitle>
                    <CardDescription>{project.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </CollapsibleContent>

        {hiddenProjects.length > 0 && (
          <div className="flex justify-center pb-6">
            <CollapsibleTrigger
              render={
                <Button
                  variant="outline"
                  size="lg"
                  className="cursor-pointer gap-2"
                >
                  {isOpen ? (
                    <>
                      Show Less <ChevronUp className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Show More <ChevronDown className="h-4 w-4" />
                    </>
                  )}
                </Button>
              }
            />
          </div>
        )}
      </Collapsible>
    </section>
  );
}
