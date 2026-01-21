import { cn } from "@/lib/utils";

export function H1({
  children,
  className,
  ...props
}: React.ComponentProps<"h1">) {
  return (
    <h1
      className={cn(
        "scroll-m-20 text-balance text-center font-extrabold text-4xl tracking-tight",
        className,
      )}
      {...props}
    >
      {children}
    </h1>
  );
}
