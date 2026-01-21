import { cn } from "@/lib/utils";

export function Muted({
  children,
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      className={cn("font-sans text-muted-foreground text-sm", className)}
      {...props}
    >
      {children}
    </p>
  );
}
