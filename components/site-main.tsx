import { cn } from "@/lib/utils";

type SiteMainProps = {
  children: React.ReactNode;
  className?: string;
};

/**
 * Shared content column: max-w-3xl, side borders, horizontal page padding.
 * Matches navbar width so chrome and body align.
 */
export function SiteMain({ children, className }: SiteMainProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col px-6">
      <main
        className={cn(
          "mx-auto flex w-full max-w-3xl min-h-0 flex-1 flex-col border-x border-border",
          className,
        )}
      >
        {children}
      </main>
    </div>
  );
}
