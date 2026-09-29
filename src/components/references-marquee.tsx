"use client";

import Image from "next/image";
import { useLayoutEffect, useRef, useState } from "react";
import { P } from "@/components/typography/p";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CardDescription, CardTitle } from "@/components/ui/card";
import type { Reference } from "@/content/references";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";

const slotClassName = "w-96 shrink-0 p-2";

const scrollDuration = 40_000;

type Direction = "left" | "right";

/** Survives the remount that a locale change triggers, so the loops do not snap back to the start. */
const savedScrollLeft: Partial<Record<Direction, number>> = {};

const mediaClassName =
  "grayscale transition duration-200 group-hover/reference:grayscale-0!";

function ReferenceCard({ reference }: { reference: Reference }) {
  return (
    <div className="group/reference flex h-full flex-col justify-between gap-4 rounded-2xl border border-border p-4 transition-colors duration-200 hover:border-foreground">
      {reference.quote ? (
        <P className="text-pretty leading-5">{reference.quote}</P>
      ) : (
        <span />
      )}
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarImage
            alt=""
            className={mediaClassName}
            src={reference.avatarSrc}
          />
          <AvatarFallback>{reference.initials}</AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <CardTitle className="truncate font-semibold text-[14px]">
            {reference.name}
          </CardTitle>
          {reference.workplace ? (
            <CardDescription className="line-clamp-2 text-[12px]">
              {reference.workplace}
            </CardDescription>
          ) : null}
        </div>
        <Image
          alt=""
          className={cn(
            "size-6 shrink-0 rounded-sm object-cover",
            mediaClassName,
          )}
          height={48}
          src={reference.companyLogoSrc}
          width={48}
        />
      </div>
    </div>
  );
}

function MarqueeRow({
  references,
  direction,
  className,
}: {
  references: Reference[];
  direction: Direction;
  className?: string;
}) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [copies, setCopies] = useState(1);

  // Repeat the set until one half of the track is at least as wide as the
  // viewport, so the loop never shows a gap however few references there are.
  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || prefersReducedMotion) return;

    const measure = () => {
      const card = scroller.querySelector("li");
      const setWidth = card ? card.offsetWidth * references.length : 0;
      if (setWidth <= 0) return;
      setCopies(Math.max(1, Math.ceil(scroller.clientWidth / setWidth)));
    };
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(scroller);
    return () => observer.disconnect();
  }, [prefersReducedMotion, references.length]);

  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const loopDistance = () =>
      prefersReducedMotion ? scroller.scrollWidth : scroller.scrollWidth / 2;

    const saved = savedScrollLeft[direction];
    if (saved !== undefined) {
      const distance = loopDistance();
      scroller.scrollLeft = distance > 0 ? saved % distance : 0;
    }

    if (prefersReducedMotion) {
      return () => {
        savedScrollLeft[direction] = scroller.scrollLeft;
      };
    }

    const sign = direction === "left" ? 1 : -1;
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

      const next = position + (sign * distance * delta) / scrollDuration;
      position = ((next % distance) + distance) % distance;
      scroller.scrollLeft = position;
      savedScrollLeft[direction] = position;
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
      savedScrollLeft[direction] = position;
    };
    scroller.addEventListener("pointerenter", pause);
    scroller.addEventListener("pointerleave", play);
    scroller.addEventListener("scroll", followManualScroll);

    return () => {
      cancelAnimationFrame(frame);
      scroller.removeEventListener("pointerenter", pause);
      scroller.removeEventListener("pointerleave", play);
      scroller.removeEventListener("scroll", followManualScroll);
      savedScrollLeft[direction] = position;
    };
  }, [prefersReducedMotion, direction]);

  const loops = prefersReducedMotion ? 1 : 2 * copies;
  const items = Array.from({ length: loops }).flatMap((_, loop) =>
    references.map((reference) => ({
      key: `${reference.name}-${loop}`,
      hidden: loop > 0,
      reference,
    })),
  );

  return (
    <div
      ref={scrollerRef}
      className={cn(
        "@container group/references scrollbar-none flex min-w-0 overflow-x-auto overscroll-x-contain",
        className,
      )}
    >
      <ul className="flex w-max shrink-0">
        {items.map(({ key, hidden, reference }) => (
          <li
            key={key}
            aria-hidden={hidden ? true : undefined}
            className={slotClassName}
          >
            <ReferenceCard reference={reference} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ReferencesMarquee({ references }: { references: Reference[] }) {
  const splitAt = Math.ceil(references.length / 2);
  const topRow = references.slice(0, splitAt);
  const bottomRow = references.slice(splitAt);

  return (
    // `auto-rows-fr` keeps both rows as tall as the tallest card. The `py-2`
    // adds to each slot's own `p-2`, so the outer edges get the same 16px as
    // the gap between the two rows.
    <div className="grid min-w-0 auto-rows-fr py-2">
      <MarqueeRow references={topRow} direction="left" />
      {bottomRow.length > 0 ? (
        <MarqueeRow references={bottomRow} direction="right" />
      ) : null}
    </div>
  );
}
