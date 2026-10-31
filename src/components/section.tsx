import type { ReactNode } from "react";
import type { OutlineEntry } from "@/content/outline";

export function Section({
  entry,
  children,
  showHeading = true,
  action,
}: {
  entry: OutlineEntry;
  children: ReactNode;
  showHeading?: boolean;
  /** Shown at the end of the heading row. */
  action?: ReactNode;
}) {
  const headingId = `${entry.id}-heading`;

  return (
    <section
      id={entry.id}
      aria-label={showHeading ? undefined : entry.title}
      aria-labelledby={showHeading ? headingId : undefined}
      className="scroll-mt-14 border-b-bleed"
    >
      {showHeading ? (
        <div className="flex items-center justify-between gap-4 border-b-bleed px-6 py-3">
          <h2 id={headingId} className="font-semibold text-2xl tracking-tight">
            {entry.title}
          </h2>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}
