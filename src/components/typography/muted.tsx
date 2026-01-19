import { cn } from "@/lib/utils";

export function Muted({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <p className={cn("font-sans text-muted-foreground text-sm", className)}>
      {children}
    </p>
  );
}
