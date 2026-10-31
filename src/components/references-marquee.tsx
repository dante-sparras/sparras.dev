"use client";

import { Pause, Play } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";
import { Section } from "@/components/section";
import { P } from "@/components/typography/p";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CardDescription, CardTitle } from "@/components/ui/card";
import type { OutlineEntry } from "@/content/outline";
import type { Reference } from "@/content/references";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";

/** Never wider than a phone screen, so one card is always readable whole. */
const slotClassName = "w-[min(24rem,100vw)] shrink-0 p-2";

const scrollDuration = 40_000;

/** How long a touch scroll must be quiet before the row moves again. */
const touchResumeDelay = 1_500;

type Direction = "left" | "right";

/** Survives the remount that a locale change triggers, so the loops do not snap back to the start. */
const savedScrollLeft: Partial<Record<Direction, number>> = {};

/**
 * The name is the link and stretches over the whole card, so the quote stays
 * readable text. `isLoopCopy` cards only fill the loop: they are hidden from
 * screen readers, so the keyboard must skip them too.
 */
function ReferenceCard({
  reference,
  isLoopCopy,
}: {
  reference: Reference;
  isLoopCopy: boolean;
}) {
  return (
    <div className="relative flex h-full flex-col justify-between gap-4 rounded-2xl border border-border p-4 transition-colors duration-200 hover:border-foreground has-focus-visible:border-foreground">
      {reference.quote ? (
        // The quotes are given in English on both language pages.
        <P lang="en" className="text-pretty leading-5">
          {reference.quote}
        </P>
      ) : (
        <span />
      )}
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarImage alt="" src={reference.avatarSrc} />
          <AvatarFallback>{reference.initials}</AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <CardTitle className="truncate font-semibold text-[14px]">
            <Link
              href={reference.linkedinHref}
              tabIndex={isLoopCopy ? -1 : undefined}
              className="outline-none after:absolute after:inset-0 after:rounded-2xl"
            >
              {reference.name}
            </Link>
          </CardTitle>
          {reference.workplace ? (
            <CardDescription className="line-clamp-2 text-[12px]">
              {reference.workplace}
            </CardDescription>
          ) : null}
        </div>
        <Image
          alt=""
          className="size-6 shrink-0 rounded-sm object-cover"
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
  isPaused,
  className,
}: {
  references: Reference[];
  direction: Direction;
  /** Holds the row still; it can still be scrolled by hand. */
  isPaused: boolean;
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
    let paused = isPaused;
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

    // Paused by the visitor, or while a mouse hovers the row, keyboard focus is
    // inside it, or a touch swipe (and its momentum) is still scrolling it.
    let hovered = false;
    let focused = false;
    let touching = false;
    let touchTimer = 0;

    const sync = () => {
      const shouldPause = isPaused || hovered || focused || touching;
      if (shouldPause === paused) return;
      paused = shouldPause;
      if (paused) {
        position = scroller.scrollLeft;
      } else {
        previous = performance.now();
      }
    };
    const releaseTouchSoon = () => {
      window.clearTimeout(touchTimer);
      touchTimer = window.setTimeout(() => {
        touching = false;
        sync();
      }, touchResumeDelay);
    };
    const onPointerEnter = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      hovered = true;
      sync();
    };
    const onPointerLeave = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      hovered = false;
      sync();
    };
    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === "mouse") return;
      window.clearTimeout(touchTimer);
      touching = true;
      sync();
    };
    // `pointercancel` fires as soon as the browser takes over a swipe, so the
    // hold is released only once scrolling has been quiet for a moment.
    const onPointerRelease = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" && touching) releaseTouchSoon();
    };
    const onFocusIn = () => {
      focused = true;
      sync();
    };
    const onFocusOut = (event: FocusEvent) => {
      focused = scroller.contains(event.relatedTarget as Node | null);
      sync();
    };
    const followManualScroll = () => {
      if (!paused) return;
      position = scroller.scrollLeft;
      savedScrollLeft[direction] = position;
      if (touching) releaseTouchSoon();
    };
    const listeners = {
      pointerenter: onPointerEnter,
      pointerleave: onPointerLeave,
      pointerdown: onPointerDown,
      pointerup: onPointerRelease,
      pointercancel: onPointerRelease,
      focusin: onFocusIn,
      focusout: onFocusOut,
      scroll: followManualScroll,
    } as const;
    for (const [type, listener] of Object.entries(listeners)) {
      scroller.addEventListener(type, listener as EventListener);
    }

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(touchTimer);
      for (const [type, listener] of Object.entries(listeners)) {
        scroller.removeEventListener(type, listener as EventListener);
      }
      savedScrollLeft[direction] = position;
    };
  }, [prefersReducedMotion, direction, isPaused]);

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
        "@container scrollbar-none mask-x-from-92% flex min-w-0 overflow-x-auto overscroll-x-contain",
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
            <ReferenceCard reference={reference} isLoopCopy={hidden} />
          </li>
        ))}
      </ul>
    </div>
  );
}

/** The References Section, which owns its pause button so the rows can obey it. */
export function ReferencesSection({
  entry,
  references,
  pauseLabel,
  playLabel,
}: {
  entry: Pick<OutlineEntry, "id" | "title">;
  references: Reference[];
  pauseLabel: string;
  playLabel: string;
}) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [isPaused, setIsPaused] = useState(false);
  const featured = references.filter((reference) => reference.isFeatured);
  const moving = references.filter((reference) => !reference.isFeatured);
  const toggleLabel = isPaused ? playLabel : pauseLabel;
  const ToggleIcon = isPaused ? Play : Pause;

  return (
    <Section
      entry={entry}
      action={
        prefersReducedMotion ? null : (
          <Button
            aria-label={toggleLabel}
            className="cursor-pointer"
            onClick={() => setIsPaused(!isPaused)}
            size="icon"
            title={toggleLabel}
            variant="outline"
          >
            <ToggleIcon aria-hidden />
          </Button>
        )
      }
    >
      <ul className="grid auto-rows-fr gap-4 px-6 pt-4 sm:grid-cols-2">
        {featured.map((reference) => (
          <li key={reference.name}>
            <ReferenceCard reference={reference} isLoopCopy={false} />
          </li>
        ))}
      </ul>
      {/* The `py-2` adds to each slot's own `p-2`, so the row is spaced from the
          cards above by the same 16px as the gap between them. */}
      <div className="grid min-w-0 py-2">
        <MarqueeRow direction="left" isPaused={isPaused} references={moving} />
      </div>
    </Section>
  );
}
