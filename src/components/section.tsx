import type { ReactNode } from "react";
import type { OutlineEntry } from "@/content/outline";

export function Section({
  entry,
  children,
  action,
}: {
  entry: Pick<OutlineEntry, "id" | "title">;
  children: ReactNode;
  /** Shown at the end of the heading row. */
  action?: ReactNode;
}) {
  const headingId = `${entry.id}-heading`;

  return (
    <section
      id={entry.id}
      aria-labelledby={headingId}
      className="border-b-bleed"
    >
      <div className="flex items-center justify-between gap-4 border-b-bleed px-6 py-3">
        <h2 id={headingId} className="font-semibold text-2xl tracking-tight">
          {entry.title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}
