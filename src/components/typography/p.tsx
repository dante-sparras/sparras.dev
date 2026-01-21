import { cn } from "@/lib/utils";

export function P({
  children,
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      className={cn(
        "text-balance font-sans text-foreground text-sm leading-6",
        className,
      )}
      {...props}
    >
      {children}
    </p>
  );
}
