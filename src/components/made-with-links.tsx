import Link from "next/link";
import React from "react";
import { cn } from "@/lib/utils";
import { Muted } from "./typography/muted";

export interface MadeWithLink {
  href: React.ComponentProps<typeof Link>["href"];
  title: string;
}

export function MadeWithLinks({
  data,
  className,
}: {
  data: MadeWithLink[];
  className?: string;
}) {
  return (
    <Muted className={cn("text-center", className)}>
      Made with{" "}
      {data.map((link) => (
        <React.Fragment key={link.href.toString()}>
          <Link href={link.href} className="text-blue-400 hover:underline">
            {link.title}
          </Link>{" "}
        </React.Fragment>
      ))}
      ❤️
    </Muted>
  );
}
