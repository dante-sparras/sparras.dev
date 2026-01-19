import { cn } from "@/lib/utils";

export function H2({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <h2
      className={cn("scroll-m-20 font-sans font-semibold text-3xl", className)}
    >
      {children}
    </h2>
  );
}
