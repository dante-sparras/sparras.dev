import { cn } from "@/lib/utils";

export function H2({
  children,
  className,
  ...props
}: React.ComponentProps<"h2">) {
  return (
    <h2
      className={cn("scroll-m-20 font-sans font-semibold text-3xl", className)}
      {...props}
    >
      {children}
    </h2>
  );
}
