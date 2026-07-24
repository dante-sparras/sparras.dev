"use client";

import { useEffect, useId, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Banner-aware framing (reference composition, monochrome):
 * - Sun large on the RIGHT, half cropped out of frame
 * - Orbits as nested ellipses (side-tilted, not top-down)
 * - Asteroid belt between Mars and Jupiter (speckled band)
 * - Depth: continuous full orbits
 *   - upper/far half (orbits + bodies) drawn UNDER the sun
 *   - lower/near half (orbits + bodies) drawn OVER the sun
 *   - no pop: only z-order swaps at the left/right nodes
 * - Start phase: random per body on each page load
 */
const VIEW = { w: 280, h: 140 } as const;
/** Right edge, vertically centered on the banner strip / side border. */
const SUN = { x: VIEW.w - 4, y: VIEW.h / 2 } as const;
/** ry / rx — lower = more edge-on / side view. */
const TILT = 0.22;
const SUN_R = 36;

/** Belt sits between Mars (110) and Jupiter (138). */
const BELT = {
  rMin: 116,
  rMax: 132,
  count: 140,
  /** Mean period — between Mars (22s) and Jupiter (36s). */
  periodS: 28,
} as const;

type Planet = {
  name: string;
  orbitR: number;
  bodyR: number;
  periodS: number;
  dim?: boolean;
  saturnRing?: boolean;
  /** Great Red Spot — monochrome oval on the disk. */
  greatSpot?: boolean;
};

type Asteroid = {
  id: string;
  /** Semi-major radius within the belt band. */
  r: number;
  bodyR: number;
  /** Slight period jitter so the belt isn’t a rigid ring. */
  periodS: number;
};

/** Art-scaled radii (not real AU). Phase offsets are rolled on mount. */
const PLANETS: Planet[] = [
  { name: "mercury", orbitR: 52, bodyR: 1.8, periodS: 8, dim: true },
  { name: "venus", orbitR: 70, bodyR: 2.4, periodS: 12 },
  { name: "earth", orbitR: 90, bodyR: 2.6, periodS: 16 },
  { name: "mars", orbitR: 110, bodyR: 2.1, periodS: 22, dim: true },
  { name: "jupiter", orbitR: 138, bodyR: 5.0, periodS: 36, greatSpot: true },
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

/** Deterministic layout so SSR/client mark-up match; phases stay random. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ASTEROIDS: Asteroid[] = (() => {
  const rnd = mulberry32(0xa57e201d);
  const out: Asteroid[] = [];
  for (let i = 0; i < BELT.count; i++) {
    // Bias slightly toward the middle of the band.
    const u = (rnd() + rnd()) / 2;
    const r = BELT.rMin + u * (BELT.rMax - BELT.rMin);
    const bodyR = 0.28 + rnd() * 0.55;
    const periodS = BELT.periodS * (0.88 + rnd() * 0.28);
    out.push({
      id: `a${i}`,
      r,
      bodyR,
      periodS,
    });
  }
  return out;
})();

function ellipsePoint(rx: number, deg: number) {
  const a = (deg * Math.PI) / 180;
  const ry = rx * TILT;
  return {
    x: SUN.x + rx * Math.cos(a),
    y: SUN.y + ry * Math.sin(a),
  };
}

/**
 * Half-ellipse stroke path from the right apex to the left apex.
 * `near` = lower arc (in front of sun); `!near` = upper arc (behind sun).
 * SVG sweep: 1 → clockwise through bottom; 0 → through top (Y-down).
 */
function orbitHalfPath(rx: number, near: boolean): string {
  const ry = rx * TILT;
  const x0 = SUN.x + rx;
  const x1 = SUN.x - rx;
  const y = SUN.y;
  const sweep = near ? 1 : 0;
  return `M ${x0} ${y} A ${rx} ${ry} 0 0 ${sweep} ${x1} ${y}`;
}

/**
 * Near vs far side of the tilted orbit.
 * SVG Y-down: lower arc (sin > 0) = nearer / in front of the sun (drawn over);
 * upper arc (sin < 0) = farther / behind the sun (drawn under → occulted on disk).
 * Nodes (sin ≈ 0) count as near so bodies sit above orbit strokes at the apices.
 */
function isNearSide(deg: number): boolean {
  return Math.sin((deg * Math.PI) / 180) >= 0;
}

function PlanetBody({
  dim,
  bodyR,
  saturnRing,
  greatSpot,
}: {
  dim?: boolean;
  bodyR: number;
  saturnRing?: boolean;
  greatSpot?: boolean;
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
      {greatSpot ? (
        /* Slight SE offset — GRS mark on the disk. */
        <circle
          className="solar-system__great-spot"
          cx={bodyR * 0.28}
          cy={bodyR * 0.32}
          r={bodyR * 0.22}
        />
      ) : null}
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
  const sunClipId = useId().replace(/:/g, "");

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const farPlanets = PLANETS.map((_, i) =>
      svg.querySelector<SVGGElement>(`[data-planet-far="${i}"]`),
    );
    const nearPlanets = PLANETS.map((_, i) =>
      svg.querySelector<SVGGElement>(`[data-planet-near="${i}"]`),
    );
    const farRocks = ASTEROIDS.map((_, i) =>
      svg.querySelector<SVGGElement>(`[data-rock-far="${i}"]`),
    );
    const nearRocks = ASTEROIDS.map((_, i) =>
      svg.querySelector<SVGGElement>(`[data-rock-near="${i}"]`),
    );

    const planetPhase0 = PLANETS.map(() => Math.random() * 360);
    const rockPhase0 = ASTEROIDS.map(() => Math.random() * 360);

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const placeBody = (
      farEl: SVGGElement | null,
      nearEl: SVGGElement | null,
      rx: number,
      deg: number,
    ) => {
      const { x, y } = ellipsePoint(rx, deg);
      const tf = `translate(${x} ${y})`;
      const near = isNearSide(deg);
      if (farEl) {
        farEl.setAttribute("transform", tf);
        farEl.setAttribute("opacity", near ? "0" : "1");
      }
      if (nearEl) {
        nearEl.setAttribute("transform", tf);
        nearEl.setAttribute("opacity", near ? "1" : "0");
      }
    };

    const place = (elapsedS: number) => {
      for (let i = 0; i < PLANETS.length; i++) {
        const p = PLANETS[i]!;
        const deg = reduced
          ? planetPhase0[i]!
          : planetPhase0[i]! + (360 * elapsedS) / p.periodS;
        placeBody(farPlanets[i]!, nearPlanets[i]!, p.orbitR, deg);
      }
      for (let i = 0; i < ASTEROIDS.length; i++) {
        const a = ASTEROIDS[i]!;
        const deg = reduced
          ? rockPhase0[i]!
          : rockPhase0[i]! + (360 * elapsedS) / a.periodS;
        placeBody(farRocks[i]!, nearRocks[i]!, a.r, deg);
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
        <defs>
          {/* Near-side orbit strokes only composite over the sun face —
              not at the left/right apices where they were covering bodies. */}
          <clipPath id={sunClipId}>
            <circle cx={SUN.x} cy={SUN.y} r={SUN_R} />
          </clipPath>
        </defs>

        {/* Full rings under everything — bodies always paint above their orbit. */}
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

        {/* FAR planets — under the sun */}
        {PLANETS.map((p, i) => (
          <g key={`far-${p.name}`} data-planet-far={i} opacity={0}>
            <PlanetBody
              dim={p.dim}
              bodyR={p.bodyR}
              saturnRing={p.saturnRing}
              greatSpot={p.greatSpot}
            />
          </g>
        ))}

        {/* FAR asteroids — under the sun */}
        {ASTEROIDS.map((a, i) => (
          <g key={`far-${a.id}`} data-rock-far={i} opacity={0}>
            <circle
              className="solar-system__asteroid"
              cx={0}
              cy={0}
              r={a.bodyR}
            />
          </g>
        ))}

        <circle className="solar-system__sun" cx={SUN.x} cy={SUN.y} r={SUN_R} />

        {/* Near orbit arcs only where they cross the sun (in front of the disk). */}
        <g clipPath={`url(#${sunClipId})`}>
          {PLANETS.map((p) => (
            <path
              key={`orbit-near-${p.name}`}
              className="solar-system__orbit-ring"
              d={orbitHalfPath(p.orbitR, true)}
            />
          ))}
        </g>

        {/* NEAR planets — over the sun */}
        {PLANETS.map((p, i) => (
          <g key={`near-${p.name}`} data-planet-near={i} opacity={0}>
            <PlanetBody
              dim={p.dim}
              bodyR={p.bodyR}
              saturnRing={p.saturnRing}
              greatSpot={p.greatSpot}
            />
          </g>
        ))}

        {/* NEAR asteroids — over the sun */}
        {ASTEROIDS.map((a, i) => (
          <g key={`near-${a.id}`} data-rock-near={i} opacity={0}>
            <circle
              className="solar-system__asteroid"
              cx={0}
              cy={0}
              r={a.bodyR}
            />
          </g>
        ))}
      </svg>
    </div>
  );
}
