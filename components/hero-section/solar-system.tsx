"use client";

import { useEffect, useId, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Banner-aware framing (reference composition, monochrome):
 * - Sun large on the RIGHT, half cropped out of frame
 * - Orbits as nested ellipses (side-tilted, not top-down)
 * - Asteroid belt between Mars and Jupiter
 * - Earth moon on a tight local loop
 * - Depth: far under sun / near over sun
 * - Pause when tab hidden or banner off-screen
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
  periodS: 28,
} as const;

/** Tight companion around Earth (art-scaled). */
const MOON = {
  orbitR: 5.8,
  bodyR: 0.75,
  periodS: 2.6,
} as const;

type Planet = {
  name: string;
  orbitR: number;
  bodyR: number;
  periodS: number;
  dim?: boolean;
  saturnRing?: boolean;
  /** Great Red Spot — monochrome mark on the disk. */
  greatSpot?: boolean;
};

type Asteroid = {
  id: string;
  r: number;
  bodyR: number;
  periodS: number;
};

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

const EARTH_INDEX = PLANETS.findIndex((p) => p.name === "earth");

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
    const u = (rnd() + rnd()) / 2;
    const r = BELT.rMin + u * (BELT.rMax - BELT.rMin);
    const bodyR = 0.28 + rnd() * 0.55;
    const periodS = BELT.periodS * (0.88 + rnd() * 0.28);
    out.push({ id: `a${i}`, r, bodyR, periodS });
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

function orbitHalfPath(rx: number, near: boolean): string {
  const ry = rx * TILT;
  const x0 = SUN.x + rx;
  const x1 = SUN.x - rx;
  const y = SUN.y;
  const sweep = near ? 1 : 0;
  return `M ${x0} ${y} A ${rx} ${ry} 0 0 ${sweep} ${x1} ${y}`;
}

/** Lower arc + nodes = near (in front of sun). */
function isNearSide(deg: number): boolean {
  return Math.sin((deg * Math.PI) / 180) >= 0;
}

function setLayer(
  farEl: SVGGElement | null,
  nearEl: SVGGElement | null,
  x: number,
  y: number,
  near: boolean,
) {
  const tf = `translate(${x} ${y})`;
  if (farEl) {
    farEl.setAttribute("transform", tf);
    farEl.setAttribute("opacity", near ? "0" : "1");
  }
  if (nearEl) {
    nearEl.setAttribute("transform", tf);
    nearEl.setAttribute("opacity", near ? "1" : "0");
  }
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
        <circle
          className="solar-system__great-spot"
          cx={bodyR * 0.28}
          cy={bodyR * 0.32}
          r={bodyR * 0.22}
        />
      ) : null}
      {saturnRing ? (
        /* Slight view tilt; dual thin rings in the orbital plane. */
        <g className="solar-system__saturn-rings" transform="rotate(-12)">
          <ellipse
            className="solar-system__saturn-ring solar-system__saturn-ring--outer"
            cx={0}
            cy={0}
            rx={bodyR * 2.4}
            ry={bodyR * 0.34}
          />
          <ellipse
            className="solar-system__saturn-ring"
            cx={0}
            cy={0}
            rx={bodyR * 1.95}
            ry={bodyR * 0.28}
          />
        </g>
      ) : null}
    </>
  );
}

export type SolarSystemProps = {
  className?: string;
};

/**
 * Layout-agnostic solar system (decorative SVG).
 * Client rAF orbits + depth; pauses when hidden or off-screen.
 */
export function SolarSystem({ className }: SolarSystemProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const sunClipId = useId().replace(/:/g, "");
  const sunGradId = useId().replace(/:/g, "");

  useEffect(() => {
    const root = rootRef.current;
    const svg = svgRef.current;
    if (!root || !svg) return;

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
    const farMoon = svg.querySelector<SVGGElement>("[data-moon-far]");
    const nearMoon = svg.querySelector<SVGGElement>("[data-moon-near]");

    const planetPhase0 = PLANETS.map(() => Math.random() * 360);
    const rockPhase0 = ASTEROIDS.map(() => Math.random() * 360);
    const moonPhase0 = Math.random() * 360;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const place = (elapsedS: number) => {
      let earthX = 0;
      let earthY = 0;
      let earthNear = true;

      for (let i = 0; i < PLANETS.length; i++) {
        const p = PLANETS[i]!;
        const deg = reduced
          ? planetPhase0[i]!
          : planetPhase0[i]! + (360 * elapsedS) / p.periodS;
        const { x, y } = ellipsePoint(p.orbitR, deg);
        const near = isNearSide(deg);
        setLayer(farPlanets[i]!, nearPlanets[i]!, x, y, near);
        if (i === EARTH_INDEX) {
          earthX = x;
          earthY = y;
          earthNear = near;
        }
      }

      // Moon shares Earth's sun-depth so the pair doesn't split across layers.
      const moonDeg = reduced
        ? moonPhase0
        : moonPhase0 + (360 * elapsedS) / MOON.periodS;
      const ma = (moonDeg * Math.PI) / 180;
      const mx = earthX + MOON.orbitR * Math.cos(ma);
      const my = earthY + MOON.orbitR * TILT * Math.sin(ma);
      setLayer(farMoon, nearMoon, mx, my, earthNear);

      for (let i = 0; i < ASTEROIDS.length; i++) {
        const a = ASTEROIDS[i]!;
        const deg = reduced
          ? rockPhase0[i]!
          : rockPhase0[i]! + (360 * elapsedS) / a.periodS;
        const { x, y } = ellipsePoint(a.r, deg);
        setLayer(farRocks[i]!, nearRocks[i]!, x, y, isNearSide(deg));
      }
    };

    place(0);
    if (reduced) return;

    let raf = 0;
    let t0 = performance.now();
    let pausedAt = 0;
    let pauseTotal = 0;
    let visible = !document.hidden;
    let onScreen = true;

    const elapsed = (now: number) => (now - t0 - pauseTotal) / 1000;

    const stop = () => {
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
      if (!pausedAt) pausedAt = performance.now();
    };

    const start = () => {
      if (pausedAt) {
        pauseTotal += performance.now() - pausedAt;
        pausedAt = 0;
      }
      if (!raf && visible && onScreen) {
        raf = requestAnimationFrame(tick);
      }
    };

    const tick = (now: number) => {
      place(elapsed(now));
      if (visible && onScreen) {
        raf = requestAnimationFrame(tick);
      } else {
        raf = 0;
      }
    };

    const onVisibility = () => {
      visible = !document.hidden;
      if (visible) start();
      else stop();
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry?.isIntersecting ?? true;
        if (onScreen) start();
        else stop();
      },
      { threshold: 0.05, rootMargin: "32px" },
    );
    io.observe(root);
    document.addEventListener("visibilitychange", onVisibility);

    start();

    return () => {
      stop();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <div
      ref={rootRef}
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
          <clipPath id={sunClipId}>
            <circle cx={SUN.x} cy={SUN.y} r={SUN_R} />
          </clipPath>
          {/* Soft limb: core → mid fill → fade toward background at the edge. */}
          <radialGradient
            id={sunGradId}
            cx="50%"
            cy="50%"
            r="50%"
            fx="42%"
            fy="42%"
          >
            <stop
              offset="0%"
              stopColor="color-mix(in oklab, var(--border) 42%, var(--foreground))"
            />
            <stop
              offset="72%"
              stopColor="color-mix(in oklab, var(--border) 50%, var(--foreground))"
            />
            <stop
              offset="100%"
              stopColor="color-mix(in oklab, var(--border) 35%, var(--background))"
            />
          </radialGradient>
        </defs>

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

        <g data-moon-far opacity={0}>
          <circle className="solar-system__moon" cx={0} cy={0} r={MOON.bodyR} />
        </g>

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

        <circle
          className="solar-system__sun"
          cx={SUN.x}
          cy={SUN.y}
          r={SUN_R}
          fill={`url(#${sunGradId})`}
        />
        {/* Hairline limb so the crop against the banner edge feels intentional. */}
        <circle
          className="solar-system__sun-limb"
          cx={SUN.x}
          cy={SUN.y}
          r={SUN_R - 0.4}
        />

        <g clipPath={`url(#${sunClipId})`}>
          {PLANETS.map((p) => (
            <path
              key={`orbit-near-${p.name}`}
              className="solar-system__orbit-ring"
              d={orbitHalfPath(p.orbitR, true)}
            />
          ))}
        </g>

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

        <g data-moon-near opacity={0}>
          <circle className="solar-system__moon" cx={0} cy={0} r={MOON.bodyR} />
        </g>

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
