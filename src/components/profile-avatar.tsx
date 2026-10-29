"use client";

import Image from "next/image";
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
  return (
    <RgbSplit
      content={{ strength: 5, clip: true }}
      render={
        <div
          className={cn(
            "relative size-38 touch-pan-y select-none rounded-full border",
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
        loading="eager"
        className="object-cover"
      />
    </RgbSplit>
  );
}
