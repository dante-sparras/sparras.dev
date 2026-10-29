"use client";

import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";

export function SiteLogo<T extends string>({
  href,
  alt,
}: {
  href: Route<T>;
  alt: string;
}) {
  return (
    <Link
      href={href}
      className="shrink-0"
      onClick={(event) => {
        if (window.location.pathname !== href) return;
        event.preventDefault();
        window.history.pushState(null, "", href);
        window.scrollTo(0, 0);
      }}
    >
      <Image
        src="/favicon.png"
        alt={alt}
        width={36}
        height={36}
        loading="eager"
        unoptimized
        className="size-9"
      />
    </Link>
  );
}
