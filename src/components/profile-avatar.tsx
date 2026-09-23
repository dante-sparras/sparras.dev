"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { RgbSplitFilter, useRgbSplitHover } from "@/components/rgb-split";
import { profile } from "@/content/profile";
import { cn } from "@/lib/utils";

const AVATAR_SIZE_PX = 152;
const SPLIT_PX = 5;
const GREEN_PX = 1;

type ProfileAvatarProps = {
  className?: string;
};

export function ProfileAvatar({ className }: ProfileAvatarProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const {
    filterId,
    filterStyle,
    offsetRefs,
    onPointerEnter,
    onPointerMove,
    onPointerLeave,
  } = useRgbSplitHover({ splitPx: SPLIT_PX, greenPx: GREEN_PX });

  useEffect(() => {
    const node = rootRef.current;
    if (!node) {
      return;
    }
    const blockScroll = (event: TouchEvent) => {
      event.preventDefault();
    };
    node.addEventListener("touchmove", blockScroll, { passive: false });
    return () => node.removeEventListener("touchmove", blockScroll);
  }, []);

  return (
    <div
      ref={rootRef}
      className={cn(
        "relative size-38 touch-none select-none overflow-hidden rounded-full border",
        className,
      )}
      onPointerEnter={onPointerEnter}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      <RgbSplitFilter id={filterId} offsetRefs={offsetRefs} />
      <Image
        src={profile.avatar.src}
        alt={profile.avatar.alt}
        fill
        sizes={`${AVATAR_SIZE_PX}px`}
        priority
        className="object-cover"
        style={filterStyle}
      />
    </div>
  );
}
