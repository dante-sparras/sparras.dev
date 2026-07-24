"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Banner-aware framing (reference composition, monochrome):
 * - Sun large on the RIGHT, half cropped out of frame
 * - Orbits as nested ellipses (side-tilted, not top-down)
 * - Depth: continuous full orbits
 *   - upper/far half drawn UNDER the sun (hidden while crossing the disk)
 *   - lower/near half drawn OVER the sun (visible transit)
 *   - no pop: only z-order swaps at the left/right nodes
 * - Start phase: random per planet on each page load
 */
const VIEW = { w: 280, h: 140 } as const;
/** Right edge, vertically centered on the banner strip / side border. */
const SUN = { x: VIEW.w - 4, y: VIEW.h / 2 } as const;
/** ry / rx — lower = more edge-on / side view. */
const TILT = 0.22;
const SUN_R = 36;

type Planet = {
  name: string;
  orbitR: number;
  bodyR: number;
  periodS: number;
  dim?: boolean;
  saturnRing?: boolean;
};

/** Art-scaled radii (not real AU). Phase offsets are rolled on mount. */
const PLANETS: Planet[] = [
  { name: "mercury", orbitR: 52, bodyR: 1.8, periodS: 8, dim: true },
  { name: "venus", orbitR: 70, bodyR: 2.4, periodS: 12 },
  { name: "earth", orbitR: 90, bodyR: 2.6, periodS: 16 },
  { name: "mars", orbitR: 110, bodyR: 2.1, periodS: 22, dim: true },
  { name: "jupiter", orbitR: 138, bodyR: 5.0, periodS: 36 },
  {
    name: "saturn",
    orbitR: 168,
    bodyR: 4.0,
    periodS: 48,
    saturnRing: true,
  },
  { name: "uranus", orbitR: 198, bodyR: 3.0, periodS: 64, dim: true },
  { name: "neptune", orbitR: 228, bodyR: 2.9, periodS: 80, dim: true },
];

function ellipsePoint(rx: number, deg: number) {
  const a = (deg * Math.PI) / 180;
  const ry = rx * TILT;
  return {
    x: SUN.x + rx * Math.cos(a),
    y: SUN.y + ry * Math.sin(a),
  };
}

/**
 * Near vs far side of the tilted orbit.
 * SVG Y-down: lower arc (sin > 0) = nearer / in front of the sun (drawn over);
 * upper arc (sin < 0) = farther / behind the sun (drawn under → occulted on disk).
 */
function isNearSide(deg: number): boolean {
  return Math.sin((deg * Math.PI) / 180) > 0;
}

function PlanetBody({
  dim,
  bodyR,
  saturnRing,
}: {
  dim?: boolean;
  bodyR: number;
  saturnRing?: boolean;
}) {
  return (
    <>
      <circle
        className={
          dim
            ? "solar-system__planet solar-system__planet--dim"
            : "solar-system__planet"
        }
        cx={0}
        cy={0}
        r={bodyR}
      />
      {saturnRing ? (
        <ellipse
          className="solar-system__saturn-ring"
          cx={0}
          cy={0}
          rx={bodyR * 2.2}
          ry={bodyR * 0.65}
        />
      ) : null}
    </>
  );
}

export type SolarSystemProps = {
  className?: string;
};

/**
 * Layout-agnostic solar system (decorative SVG).
 * Client rAF: full continuous orbits with under/over sun depth layers.
 * Orbital start phases are randomized once per mount (each refresh).
 */
export function SolarSystem({ className }: SolarSystemProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const farNodes = PLANETS.map((_, i) =>
      svg.querySelector<SVGGElement>(`[data-planet-far="${i}"]`),
    );
    const nearNodes = PLANETS.map((_, i) =>
      svg.querySelector<SVGGElement>(`[data-planet-near="${i}"]`),
    );

    /** Independent random phase per planet, degrees ∈ [0, 360). */
    const phase0 = PLANETS.map(() => Math.random() * 360);

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const place = (elapsedS: number) => {
      for (let i = 0; i < PLANETS.length; i++) {
        const p = PLANETS[i]!;
        const deg = reduced
          ? phase0[i]!
          : phase0[i]! + (360 * elapsedS) / p.periodS;
        const { x, y } = ellipsePoint(p.orbitR, deg);
        const tf = `translate(${x} ${y})`;
        const near = isNearSide(deg);

        const farEl = farNodes[i];
        const nearEl = nearNodes[i];
        // Same position on both layers; only one is active.
        // Far sits under the sun → disk occludes it on the far pass.
        // Near sits over the sun → transit is visible on the near pass.
        if (farEl) {
          farEl.setAttribute("transform", tf);
          farEl.setAttribute("opacity", near ? "0" : "1");
        }
        if (nearEl) {
          nearEl.setAttribute("transform", tf);
          nearEl.setAttribute("opacity", near ? "1" : "0");
        }
      }
    };

    place(0);
    if (reduced) return;

    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      place((now - t0) / 1000);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      className={cn(
        "solar-system pointer-events-none relative h-full w-full min-h-0 overflow-hidden",
        className,
      )}
      aria-hidden
    >
      <svg
        ref={svgRef}
        className="absolute inset-0 h-full w-full"
        viewBox={`0 0 ${VIEW.w} ${VIEW.h}`}
        preserveAspectRatio="xMaxYMid slice"
        focusable="false"
      >
        {PLANETS.map((p) => (
          <ellipse
            key={`orbit-${p.name}`}
            className="solar-system__orbit-ring"
            cx={SUN.x}
            cy={SUN.y}
            rx={p.orbitR}
            ry={p.orbitR * TILT}
          />
        ))}

        {/* FAR layer — under the sun (occulted while crossing the disk). */}
        {PLANETS.map((p, i) => (
          <g
            key={`far-${p.name}`}
            data-planet-far={i}
            // Hidden until client effect rolls phases + place(0).
            opacity={0}
          >
            <PlanetBody dim={p.dim} bodyR={p.bodyR} saturnRing={p.saturnRing} />
          </g>
        ))}

        <circle className="solar-system__sun" cx={SUN.x} cy={SUN.y} r={SUN_R} />

        {/* NEAR layer — over the sun (visible transit). */}
        {PLANETS.map((p, i) => (
          <g key={`near-${p.name}`} data-planet-near={i} opacity={0}>
            <PlanetBody dim={p.dim} bodyR={p.bodyR} saturnRing={p.saturnRing} />
          </g>
        ))}
      </svg>
    </div>
  );
}
