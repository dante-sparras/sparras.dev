import type { ReactNode } from "react";
import type { OutlineEntry } from "@/content/outline";

export function Section({
  entry,
  children,
}: {
  entry: OutlineEntry;
  children: ReactNode;
}) {
  const headingId = `${entry.id}-heading`;

  return (
    <section id={entry.id} aria-labelledby={headingId} className="scroll-mt-14">
      <h3
        id={headingId}
        className="border-b px-6 py-3 font-semibold text-2xl tracking-tight"
      >
        {entry.title}
      </h3>
      {children}
    </section>
  );
}
