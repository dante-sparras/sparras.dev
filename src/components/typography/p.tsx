import { cn } from "@/lib/utils";

export function P({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <p
      className={cn(
        "text-balance font-sans text-foreground text-sm leading-6",
        className,
      )}
    >
      {children}
    </p>
  );
}
