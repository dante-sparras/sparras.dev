import type { ReactNode } from "react";
import type { OutlineEntry } from "@/content/outline";

export function Section({
  entry,
  children,
  showHeading = true,
}: {
  entry: OutlineEntry;
  children: ReactNode;
  showHeading?: boolean;
}) {
  const headingId = `${entry.id}-heading`;

  return (
    <section
      id={entry.id}
      aria-label={showHeading ? undefined : entry.title}
      aria-labelledby={showHeading ? headingId : undefined}
      className="scroll-mt-14"
    >
      {showHeading ? (
        <h3
          id={headingId}
          className="border-b px-6 py-3 font-semibold text-2xl tracking-tight"
        >
          {entry.title}
        </h3>
      ) : null}
      {children}
    </section>
  );
}
