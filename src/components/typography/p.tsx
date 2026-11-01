import { cn } from "@/lib/utils";

export function P({
  children,
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      className={cn(
        "font-sans text-sm leading-6 text-balance text-foreground",
        className,
      )}
      {...props}
    >
      {children}
    </p>
  );
}
