import { cn } from "@/lib/utils";

export function H3({
  children,
  className,
  ...props
}: React.ComponentProps<"h3">) {
  return (
    <h3
      className={cn(
        "scroll-m-20 font-semibold text-2xl tracking-tight",
        className,
      )}
      {...props}
    >
      {children}
    </h3>
  );
}
