"use client";

import Image from "next/image";
import Link from "next/link";
import { RgbSplit } from "@/components/rgb-split";
import { Button } from "@/components/ui/button";
import type { Href, ImageSrc } from "@/content/types";

type SkillTileProps = {
  href: Href;
  src: ImageSrc;
  label: string;
};

export function SkillTile({ href, src, label }: SkillTileProps) {
  return (
    <RgbSplit
      border={{ strength: 4, green: 0, delayMs: 150 }}
      render={
        <Button
          variant="outline"
          size="icon-lg"
          nativeButton={false}
          render={<Link href={href} />}
          className="mx-auto size-14 before:hidden"
        />
      }
    >
      <Image
        src={src}
        alt={`${label} Icon Logo`}
        width={32}
        height={32}
        className="size-8 object-contain"
      />
    </RgbSplit>
  );
}
