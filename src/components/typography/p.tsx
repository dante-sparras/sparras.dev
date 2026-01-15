import { cn } from "@/lib/utils";

export function P({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <p className={cn("leading-7 not-first:mt-6", className)}>{children}</p>
  );
}
