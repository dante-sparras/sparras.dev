import { cn } from "@/lib/utils";

/** Flag of Sweden (5:8), drawn as SVG so it looks the same on every platform. */
export function SwedenFlag({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={cn("h-2.5 w-4 rounded-[2px]", className)}
      viewBox="0 0 16 10"
    >
      <rect width="16" height="10" fill="#006AA7" />
      <rect x="5" width="2" height="10" fill="#FECC02" />
      <rect y="4" width="16" height="2" fill="#FECC02" />
    </svg>
  );
}
