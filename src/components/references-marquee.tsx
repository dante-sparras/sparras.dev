"use client";

import Image from "next/image";
import { useLayoutEffect, useRef } from "react";
import { P } from "@/components/typography/p";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CardDescription, CardTitle } from "@/components/ui/card";
import type { Reference } from "@/content/references";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";

const cardWidth = "w-80 shrink-0 border-x border-border p-4 [&+li]:-ml-px";

const scrollDuration = 40_000;

/** Survives the remount that a locale change triggers, so the loop does not snap back to the start. */
let savedScrollTime: number | null = null;

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
          <P className="text-pretty">{reference.quote}</P>
        ) : null}
      </div>
    </div>
  );
}

export function ReferencesMarquee({ references }: { references: Reference[] }) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const trackRef = useRef<HTMLUListElement>(null);

  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track || prefersReducedMotion) return;

    const animation = track.animate(
      [{ transform: "translateX(0)" }, { transform: "translateX(-50%)" }],
      { duration: scrollDuration, iterations: Infinity, easing: "linear" },
    );
    const now = document.timeline.currentTime;
    if (savedScrollTime !== null && typeof now === "number") {
      animation.startTime = now - savedScrollTime;
    }

    const root = track.parentElement;
    const pause = () => animation.pause();
    const play = () => animation.play();
    root?.addEventListener("pointerenter", pause);
    root?.addEventListener("pointerleave", play);

    let frame = 0;
    const sample = () => {
      frame = requestAnimationFrame(() => {
        if (typeof animation.currentTime === "number") {
          savedScrollTime = animation.currentTime;
        }
        sample();
      });
    };
    sample();

    return () => {
      cancelAnimationFrame(frame);
      root?.removeEventListener("pointerenter", pause);
      root?.removeEventListener("pointerleave", play);
      if (typeof animation.currentTime === "number") {
        savedScrollTime = animation.currentTime;
      }
      animation.cancel();
    };
  }, [prefersReducedMotion]);

  return (
    <div className="@container group/references overflow-hidden">
      <ul ref={trackRef} className="references-track flex w-max">
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
