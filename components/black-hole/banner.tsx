"use client";

/**
 * RSC-safe entry. Next 16 only allows `dynamic(..., { ssr: false })` in Client Components.
 *
 * Does not value-import `./black-hole` — keeps the WebGPU/TSL graph in a separate chunk.
 */
import dynamic from "next/dynamic";
import type { BlackHoleProps } from "./black-hole";
import { SHELL_CLASS } from "./constants";

const BlackHoleLazy = dynamic(
  () => import("./black-hole").then((m) => m.BlackHole),
  {
    ssr: false,
    loading: () => <div className={SHELL_CLASS} aria-hidden />,
  },
);

export function BlackHoleBanner(props: BlackHoleProps) {
  return <BlackHoleLazy {...props} />;
}
