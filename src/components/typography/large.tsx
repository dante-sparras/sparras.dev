import { cn } from "@/lib/utils";

export function Large({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("text-lg font-semibold", className)}>{children}</div>
  );
}
