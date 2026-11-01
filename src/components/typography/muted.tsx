import { cn } from "@/lib/utils";

export function Muted({
  children,
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      className={cn("font-sans text-sm text-muted-foreground", className)}
      {...props}
    >
      {children}
    </p>
  );
}
