"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type SkillTileProps = {
  href: React.ComponentProps<typeof Link>["href"];
  src: React.ComponentProps<typeof Image>["src"];
  label: string;
};

export function SkillTile({ href, src, label }: SkillTileProps) {
  return (
    <Button
      variant="outline"
      size="icon-lg"
      nativeButton={false}
      render={<Link href={href} />}
      className="mx-auto size-14"
      hoverEffect="rgb"
      rgbTarget="both"
      rgbSplitPx={2}
      rgbGreenPx={0.4}
    >
      <Image
        src={src}
        alt={`${label} Icon Logo`}
        width={32}
        height={32}
        className="size-8 object-contain"
      />
    </Button>
  );
}
