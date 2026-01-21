import { cn } from "@/lib/utils";

export function InlineCode({
  children,
  className,
  ...props
}: React.ComponentProps<"code">) {
  return (
    <code
      className={cn(
        "relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono font-semibold text-sm",
        className,
      )}
      {...props}
    >
      {children}
    </code>
  );
}
