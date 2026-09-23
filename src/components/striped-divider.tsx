import { cn } from "@/lib/utils";

export function StripedDivider({ className }: { className?: string }) {
  return <div className={cn("h-4 border-y bg-stripes", className)} />;
}
