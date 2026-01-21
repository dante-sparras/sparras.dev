import { cn } from "@/lib/utils";

export function H4({
  children,
  className,
  ...props
}: React.ComponentProps<"h4">) {
  return (
    <h4
      className={cn(
        "scroll-m-20 font-semibold text-xl tracking-tight",
        className,
      )}
      {...props}
    >
      {children}
    </h4>
  );
}
