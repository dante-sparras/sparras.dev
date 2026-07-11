"use client";

/**
 * RSC-safe entry for the black-hole scene.
 * Next 16 only allows `dynamic(..., { ssr: false })` in Client Components.
 *
 * Outside `components/black-hole/` so the feature folder stays pure sim/WebGPU;
 * this file is only the Next dynamic boundary.
 */
import dynamic from "next/dynamic";
import type { BlackHoleProps } from "@/components/black-hole";
import { SHELL_CLASS } from "@/components/black-hole/constants";

const BlackHoleLazy = dynamic(
  () => import("@/components/black-hole").then((m) => m.BlackHole),
  {
    ssr: false,
    loading: () => <div className={SHELL_CLASS} aria-hidden />,
  },
);

export function BlackHoleBanner(props: BlackHoleProps) {
  return <BlackHoleLazy {...props} />;
}
