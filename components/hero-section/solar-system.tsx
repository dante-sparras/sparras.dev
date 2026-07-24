"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Banner-aware framing (reference composition, monochrome):
 * - Sun large on the RIGHT, half cropped out of frame
 * - Orbits as nested ellipses (side-tilted, not top-down)
 * - Depth: upper arc = in front of sun (visible, can transit);
 *   lower arc = behind sun (hidden)
 */
const VIEW = { w: 280, h: 140 } as const;
const SUN = { x: VIEW.w - 4, y: 78 } as const;
/** ry / rx — lower = more edge-on. */
const TILT = 0.34;
const SUN_R = 36;

type Planet = {
  name: string;
  /** Semi-major axis (horizontal). */
  orbitR: number;
  bodyR: number;
  periodS: number;
  /**
   * Start phase along the orbit, degrees (0 = right of sun).
   * ~180 ± offsets ≈ left of sun; negative sin ≈ above (SVG Y-down).
   */
  startDeg: number;
  dim?: boolean;
  saturnRing?: boolean;
};

/**
 * Art-scaled radii (not real AU). Start angles biased to the visible
 * upper-left arc (in front of the sun).
 */
const PLANETS: Planet[] = [
  {
    name: "mercury",
    orbitR: 52,
    bodyR: 1.8,
    periodS: 8,
    startDeg: 198,
    dim: true,
  },
  {
    name: "venus",
    orbitR: 70,
    bodyR: 2.4,
    periodS: 12,
    startDeg: 222,
  },
  {
    name: "earth",
    orbitR: 90,
    bodyR: 2.6,
    periodS: 16,
    startDeg: 208,
  },
  {
    name: "mars",
    orbitR: 110,
    bodyR: 2.1,
    periodS: 22,
    startDeg: 238,
    dim: true,
  },
  {
    name: "jupiter",
    orbitR: 138,
    bodyR: 5.0,
    periodS: 36,
    startDeg: 218,
  },
  {
    name: "saturn",
    orbitR: 168,
    bodyR: 4.0,
    periodS: 48,
    startDeg: 232,
    saturnRing: true,
  },
  {
    name: "uranus",
    orbitR: 198,
    bodyR: 3.0,
    periodS: 64,
    startDeg: 202,
    dim: true,
  },
  {
    name: "neptune",
    orbitR: 228,
    bodyR: 2.9,
    periodS: 80,
    startDeg: 248,
    dim: true,
  },
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
 * Upper arc (sin < 0 in SVG Y-down) = nearer / in front of the sun.
 * Lower arc = farther / behind the sun → hidden.
 */
function isInFront(deg: number): boolean {
  const a = (deg * Math.PI) / 180;
  return Math.sin(a) < 0;
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
 * Parent owns size; this fills `h-full w-full` and crops via viewBox.
 * Client: rAF orbit + depth so planets behind the sun stay hidden.
 * Styles: `solar-system.css` (imported from `app/globals.css`).
 */
export function SolarSystem({ className }: SolarSystemProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const nodes = PLANETS.map((_, i) =>
      svg.querySelector<SVGGElement>(`[data-planet="${i}"]`),
    );

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const place = (elapsedS: number) => {
      for (let i = 0; i < PLANETS.length; i++) {
        const p = PLANETS[i]!;
        const el = nodes[i];
        if (!el) continue;
        const deg = reduced
          ? p.startDeg
          : p.startDeg + (360 * elapsedS) / p.periodS;
        const { x, y } = ellipsePoint(p.orbitR, deg);
        el.setAttribute("transform", `translate(${x} ${y})`);
        // Only the near (front) half of each orbit is drawn — behind = gone.
        el.setAttribute("opacity", isInFront(deg) ? "1" : "0");
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

        {/* Sun under front-side planets so near-side transits stay readable. */}
        <circle className="solar-system__sun" cx={SUN.x} cy={SUN.y} r={SUN_R} />

        {PLANETS.map((p, i) => {
          const start = ellipsePoint(p.orbitR, p.startDeg);
          return (
            <g
              key={p.name}
              data-planet={i}
              transform={`translate(${start.x} ${start.y})`}
              opacity={isInFront(p.startDeg) ? 1 : 0}
            >
              <PlanetBody
                dim={p.dim}
                bodyR={p.bodyR}
                saturnRing={p.saturnRing}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
