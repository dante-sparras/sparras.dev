import { cn } from "@/lib/utils";

export function Large({
  children,
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={cn("font-semibold text-lg", className)} {...props}>
      {children}
    </div>
  );
}
