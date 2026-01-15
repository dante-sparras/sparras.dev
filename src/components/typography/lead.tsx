import { cn } from "@/lib/utils";

export function Lead({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <p className={cn("text-muted-foreground text-xl", className)}>{children}</p>
  );
}
