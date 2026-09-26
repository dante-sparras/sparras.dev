"use client";

import Image from "next/image";
import { useLayoutEffect, useRef } from "react";
import { P } from "@/components/typography/p";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CardDescription, CardTitle } from "@/components/ui/card";
import type { Reference } from "@/content/references";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";

const cardWidth =
  "w-[50cqw] min-w-80 shrink-0 border border-border border-y-transparent p-4 transition-colors duration-200 [&+li]:-ml-px hover:border-foreground [&:hover+li]:border-l-foreground";

const scrollDuration = 40_000;

/** Survives the remount that a locale change triggers, so the loop does not snap back to the start. */
let savedScrollLeft: number | null = null;

const mediaClassName =
  "grayscale transition duration-200 group-hover/reference:grayscale-0!";

function ReferenceCard({ reference }: { reference: Reference }) {
  return (
    <div className="group/reference flex h-full items-start gap-3">
      <Avatar size="lg">
        <AvatarImage
          alt=""
          className={mediaClassName}
          src={reference.avatarSrc}
        />
        <AvatarFallback>{reference.initials}</AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex min-w-0 items-center gap-1.5">
          <CardTitle className="truncate font-semibold">
            {reference.name}
          </CardTitle>
          <Image
            alt=""
            className={cn(
              "size-5 shrink-0 rounded-sm border border-border object-cover",
              mediaClassName,
            )}
            height={40}
            src={reference.companyLogoSrc}
            width={40}
          />
        </div>
        {reference.workplace ? (
          <CardDescription>{reference.workplace}</CardDescription>
        ) : null}
        {reference.quote ? (
          <P className="text-pretty leading-5">{reference.quote}</P>
        ) : null}
      </div>
    </div>
  );
}

export function ReferencesMarquee({ references }: { references: Reference[] }) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const scrollerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const loopDistance = () =>
      prefersReducedMotion ? scroller.scrollWidth : scroller.scrollWidth / 2;

    if (savedScrollLeft !== null) {
      const distance = loopDistance();
      scroller.scrollLeft = distance > 0 ? savedScrollLeft % distance : 0;
    }

    if (prefersReducedMotion) {
      return () => {
        savedScrollLeft = scroller.scrollLeft;
      };
    }

    let paused = false;
    let position = scroller.scrollLeft;
    let previous = performance.now();
    let frame = 0;

    const step = (now: number) => {
      frame = requestAnimationFrame(step);
      const delta = now - previous;
      previous = now;
      if (paused) return;

      const distance = scroller.scrollWidth / 2;
      if (distance <= 0) return;

      position = (position + (distance * delta) / scrollDuration) % distance;
      scroller.scrollLeft = position;
      savedScrollLeft = position;
    };
    frame = requestAnimationFrame(step);

    const pause = () => {
      paused = true;
      position = scroller.scrollLeft;
    };
    const play = () => {
      previous = performance.now();
      paused = false;
    };
    const followManualScroll = () => {
      if (!paused) return;
      position = scroller.scrollLeft;
      savedScrollLeft = position;
    };
    scroller.addEventListener("pointerenter", pause);
    scroller.addEventListener("pointerleave", play);
    scroller.addEventListener("scroll", followManualScroll);

    return () => {
      cancelAnimationFrame(frame);
      scroller.removeEventListener("pointerenter", pause);
      scroller.removeEventListener("pointerleave", play);
      scroller.removeEventListener("scroll", followManualScroll);
      savedScrollLeft = position;
    };
  }, [prefersReducedMotion]);

  return (
    <div
      ref={scrollerRef}
      className="@container group/references min-w-0 overflow-x-auto overscroll-x-contain scrollbar-none"
    >
      <ul className="flex w-max">
        {references.map((reference) => (
          <li key={reference.name} className={cardWidth}>
            <ReferenceCard reference={reference} />
          </li>
        ))}
        {prefersReducedMotion
          ? null
          : references.map((reference) => (
              <li
                key={`${reference.name}-loop`}
                aria-hidden
                className={cardWidth}
              >
                <ReferenceCard reference={reference} />
              </li>
            ))}
      </ul>
    </div>
  );
}
