import { cn } from "@/lib/utils";

export function Small({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <small className={cn("text-sm leading-none font-medium", className)}>
      {children}
    </small>
  );
}
