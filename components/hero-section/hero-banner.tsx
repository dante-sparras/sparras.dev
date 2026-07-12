/**
 * RSC-safe hero banner (WebGPU black hole).
 * Next 16 only allows `dynamic(..., { ssr: false })` in Client Components.
 *
 * ```tsx
 * <HeroBanner spin={0.8} inclination={135} />
 * ```
 */
import dynamic from "next/dynamic";
import type { BlackHoleProps } from "@/components/black-hole";
import { SHELL_CLASS } from "@/components/black-hole";

const BlackHoleLazy = dynamic(
  () => import("@/components/black-hole").then((m) => m.BlackHole),
  {
    ssr: false,
    loading: () => <div className={SHELL_CLASS} aria-hidden />,
  },
);

export function HeroBanner(props: BlackHoleProps) {
  return <BlackHoleLazy {...props} />;
}
