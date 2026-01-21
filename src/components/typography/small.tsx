import { cn } from "@/lib/utils";

export function Small({
  children,
  className,
  ...props
}: React.ComponentProps<"small">) {
  return (
    <small
      className={cn("font-medium text-sm leading-none", className)}
      {...props}
    >
      {children}
    </small>
  );
}
