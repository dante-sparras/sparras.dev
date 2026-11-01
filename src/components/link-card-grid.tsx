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
import type { Skill } from "@/content/skills";
import type { Href, ImageSrc } from "@/content/types";
import { cn } from "@/lib/utils";

type LinkCardItem = {
  title: string;
  description: string;
  href: Href;
  imageSrc?: ImageSrc;
  stack?: readonly Pick<Skill, "name" | "iconSrc">[];
};

const INITIAL_COUNT = 6;

const gridClassName = "grid gap-4 px-6 sm:grid-cols-2";

/** `https://www.github.com/a/b` → `github.com`; `null` for internal links. */
function hostname(href: Href) {
  if (typeof href !== "string") return null;
  try {
    return new URL(href).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function LinkCardMedia({ item }: { item: LinkCardItem }) {
  return (
    <div className="relative aspect-[2/1] overflow-hidden border-b bg-muted/30">
      {item.imageSrc ? (
        <Image
          src={item.imageSrc}
          alt=""
          fill
          sizes="(min-width: 640px) 360px, 100vw"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(var(--color-border)_1px,transparent_1px)] bg-size-[14px_14px]">
          <span className="font-pixel text-5xl text-muted-foreground/60">
            {item.title.charAt(0)}
          </span>
        </div>
      )}
      <div
        aria-hidden
        className="absolute inset-0 bg-linear-to-t from-background/70 via-transparent to-transparent"
      />
    </div>
  );
}

function LinkCard({ item }: { item: LinkCardItem }) {
  const host = hostname(item.href);

  return (
    <Link
      href={item.href}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border bg-card/40 transition duration-300 outline-none hover:-translate-y-0.5 hover:border-foreground/40 focus-visible:border-foreground/60 focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <LinkCardMedia item={item} />
      <div className="flex flex-1 flex-col gap-2 p-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-pixel text-xl leading-none">{item.title}</h3>
          <span
            aria-hidden
            className="grid size-8 shrink-0 place-items-center rounded-full border text-muted-foreground transition duration-300 group-hover:border-foreground group-hover:bg-foreground group-hover:text-background"
          >
            <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:rotate-45" />
          </span>
        </div>
        <p className="text-sm leading-6 text-pretty text-muted-foreground">
          {item.description}
        </p>
        {item.stack?.length || host ? (
          <div className="mt-auto flex items-center justify-between gap-3 pt-3">
            {item.stack?.length ? (
              <ul className="flex">
                {item.stack.map((skill) => (
                  <li
                    key={skill.name}
                    title={skill.name}
                    className="grid size-7 place-items-center rounded-full border bg-background transition-[margin] duration-300 ease-out not-first:-ms-1.5 group-hover:not-first:ms-1"
                  >
                    <Image
                      src={skill.iconSrc}
                      alt={skill.name}
                      width={14}
                      height={14}
                      className="size-3.5 object-contain"
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <span />
            )}
            {host ? (
              <span className="font-mono text-xs text-muted-foreground">
                {host}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    </Link>
  );
}

export function LinkCardGrid({
  items,
  showLessLabel,
  showMoreLabel,
}: {
  items: readonly LinkCardItem[];
  showLessLabel: string;
  showMoreLabel: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const visibleItems = items.slice(0, INITIAL_COUNT);
  const hiddenItems = items.slice(INITIAL_COUNT);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className={cn(gridClassName, "py-6")}>
        {visibleItems.map((item) => (
          <LinkCard key={item.title} item={item} />
        ))}
      </div>

      <CollapsibleContent>
        <div className={cn(gridClassName, "pb-6")}>
          {hiddenItems.map((item) => (
            <LinkCard key={item.title} item={item} />
          ))}
        </div>
      </CollapsibleContent>

      {hiddenItems.length > 0 && (
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
                    {showLessLabel} <ChevronUp className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    {showMoreLabel} <ChevronDown className="h-4 w-4" />
                  </>
                )}
              </Button>
            }
          />
        </div>
      )}
    </Collapsible>
  );
}
