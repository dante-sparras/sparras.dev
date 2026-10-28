"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { RgbSplit } from "@/components/rgb-split";
import type { ImageSrc } from "@/content/types";
import { cn } from "@/lib/utils";

const AVATAR_SIZE_PX = 152;

type ProfileAvatarProps = {
  alt: string;
  className?: string;
  src: ImageSrc;
};

export function ProfileAvatar({ alt, className, src }: ProfileAvatarProps) {
  const rootRef = useRef<HTMLDivElement>(null);

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
    <RgbSplit
      content={{ strength: 5, clip: true }}
      render={
        <div
          ref={rootRef}
          className={cn(
            "relative size-38 touch-none select-none rounded-full border",
            className,
          )}
        />
      }
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes={`${AVATAR_SIZE_PX}px`}
        priority
        className="object-cover"
      />
    </RgbSplit>
  );
}
