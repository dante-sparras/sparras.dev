"use client";

import { useEffect, useId, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Banner-aware framing (reference composition, monochrome):
 * - Sun large on the RIGHT, half cropped out of frame
 * - Orbits as nested ellipses (side-tilted, not top-down)
 * - Asteroid belt · Earth moon · Saturn rings (Cassini gap) · rare comet
 * - Depth: far under sun / near over sun; moon local depth vs Earth
 * - Kepler-ish periods (T ∝ a^{3/2}); axial spin
 * - Phase seed: ?seed=N | ?seed=day | random each load
 * - Pause when tab hidden or banner off-screen
 * - prefers-reduced-motion: composed still “hero pose”
 */
const VIEW = { w: 280, h: 140 } as const;
const SUN = { x: VIEW.w - 4, y: VIEW.h / 2 } as const;
const TILT = 0.22;
const SUN_R = 36;

/**
 * Kepler scaling: T ∝ a^{3/2}, normalized so Earth (a=90) ≈ 16s.
 * Gives outer bodies a heavier feel than linear period picks.
 */
const KEPLER_K = 16 / 90 ** 1.5;
function keplerPeriodS(semiMajor: number): number {
  return KEPLER_K * semiMajor ** 1.5;
}

const BELT = {
  rMin: 116,
  rMax: 132,
  count: 140,
} as const;

const MOON = {
  orbitR: 5.8,
  bodyR: 0.75,
  periodS: 2.6,
} as const;

/**
 * Long-period eccentric comet — rare flyby feel via high e + slow period.
 * Tail points away from the sun; longer near perihelion.
 */
const COMET = {
  a: 158,
  e: 0.84,
  periodS: 68,
  bodyR: 1.05,
  tailMin: 10,
  tailMax: 26,
  /** Argument of periapsis (deg) — opens toward the left of the banner. */
  argPeriDeg: 200,
} as const;

/**
 * Reduced-motion still frame — fan on the open left, Jupiter readable,
 * moon slightly in front of Earth.
 */
const HERO_POSE: Record<string, number> = {
  mercury: 205,
  venus: 238,
  earth: 218,
  mars: 255,
  jupiter: 228,
  saturn: 248,
  uranus: 198,
  neptune: 262,
};
const HERO_MOON_DEG = 55;

type Planet = {
  name: string;
  orbitR: number;
  bodyR: number;
  periodS: number;
  /** Axial spin period (seconds). */
  spinS: number;
  dim?: boolean;
  saturnRing?: boolean;
};

type Asteroid = {
  id: string;
  r: number;
  bodyR: number;
  periodS: number;
};

const PLANETS: Planet[] = [
  {
    name: "mercury",
    orbitR: 52,
    bodyR: 1.8,
    periodS: keplerPeriodS(52),
    spinS: 18,
    dim: true,
  },
  {
    name: "venus",
    orbitR: 70,
    bodyR: 2.4,
    periodS: keplerPeriodS(70),
    spinS: 28,
  },
  {
    name: "earth",
    orbitR: 90,
    bodyR: 2.6,
    periodS: keplerPeriodS(90),
    spinS: 10,
  },
  {
    name: "mars",
    orbitR: 110,
    bodyR: 2.1,
    periodS: keplerPeriodS(110),
    spinS: 11,
    dim: true,
  },
  {
    name: "jupiter",
    orbitR: 138,
    bodyR: 5.0,
    periodS: keplerPeriodS(138),
    spinS: 5.5,
  },
  {
    name: "saturn",
    orbitR: 168,
    bodyR: 4.0,
    periodS: keplerPeriodS(168),
    spinS: 6.5,
    saturnRing: true,
  },
  {
    name: "uranus",
    orbitR: 198,
    bodyR: 3.0,
    periodS: keplerPeriodS(198),
    spinS: 9,
    dim: true,
  },
  {
    name: "neptune",
    orbitR: 228,
    bodyR: 2.9,
    periodS: keplerPeriodS(228),
    spinS: 8,
    dim: true,
  },
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

/** ?seed=123 stable · ?seed=day calendar · else fresh random. */
function resolvePhaseSeed(): number {
  try {
    const raw = new URLSearchParams(window.location.search).get("seed");
    if (raw === "day") {
      const d = new Date();
      return (
        (d.getUTCFullYear() * 10000 +
          (d.getUTCMonth() + 1) * 100 +
          d.getUTCDate()) >>>
        0
      );
    }
    if (raw != null && raw !== "" && Number.isFinite(Number(raw))) {
      return Number(raw) >>> 0;
    }
  } catch {
    /* ignore */
  }
  return (Math.random() * 0xffffffff) >>> 0;
}

const ASTEROIDS: Asteroid[] = (() => {
  const rnd = mulberry32(0xa57e201d);
  const out: Asteroid[] = [];
  for (let i = 0; i < BELT.count; i++) {
    const u = (rnd() + rnd()) / 2;
    const r = BELT.rMin + u * (BELT.rMax - BELT.rMin);
    const bodyR = 0.28 + rnd() * 0.55;
    const periodS = keplerPeriodS(r) * (0.92 + rnd() * 0.16);
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

function isNearSide(deg: number): boolean {
  return Math.sin((deg * Math.PI) / 180) >= 0;
}

/** Polar equation of ellipse with focus at sun: r = a(1−e²)/(1+e cos ν). */
function cometState(trueAnomalyDeg: number) {
  const nu = (trueAnomalyDeg * Math.PI) / 180;
  const a = COMET.a;
  const e = COMET.e;
  const r = (a * (1 - e * e)) / (1 + e * Math.cos(nu));
  const arg = ((trueAnomalyDeg + COMET.argPeriDeg) * Math.PI) / 180;
  const x = SUN.x + r * Math.cos(arg);
  const y = SUN.y + r * TILT * Math.sin(arg);
  // Longer tail near perihelion (small r).
  const rMin = a * (1 - e);
  const rMax = a * (1 + e);
  const nearSun = 1 - (r - rMin) / (rMax - rMin || 1);
  const tailLen = COMET.tailMin + (COMET.tailMax - COMET.tailMin) * nearSun;
  const awayDeg = (Math.atan2(y - SUN.y, x - SUN.x) * 180) / Math.PI;
  return {
    x,
    y,
    r,
    tailLen,
    awayDeg,
    near: isNearSide(trueAnomalyDeg + COMET.argPeriDeg),
  };
}

function setLayer(
  farEl: SVGGElement | null,
  nearEl: SVGGElement | null,
  x: number,
  y: number,
  near: boolean,
  spinDeg = 0,
) {
  // Outer group: position + depth; inner [data-spin] rotates the disc (GRS).
  const tf = `translate(${x} ${y})`;
  const apply = (el: SVGGElement | null, show: boolean) => {
    if (!el) return;
    el.setAttribute("transform", tf);
    el.setAttribute("opacity", show ? "1" : "0");
    const spin = el.querySelector<SVGGElement>("[data-spin]");
    if (spin) spin.setAttribute("transform", `rotate(${spinDeg})`);
  };
  apply(farEl, !near);
  apply(nearEl, near);
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
      {/* Disc spins; rings stay fixed in the orbital plane. */}
      <g data-spin>
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
      </g>
      {saturnRing ? (
        /* Dual rings with a clear Cassini-style gap between them. */
        <g className="solar-system__saturn-rings" transform="rotate(-12)">
          <ellipse
            className="solar-system__saturn-ring solar-system__saturn-ring--outer"
            cx={0}
            cy={0}
            rx={bodyR * 2.55}
            ry={bodyR * 0.36}
          />
          <ellipse
            className="solar-system__saturn-ring"
            cx={0}
            cy={0}
            rx={bodyR * 1.7}
            ry={bodyR * 0.24}
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
    const farMoonBehind = svg.querySelector<SVGGElement>(
      "[data-moon-far-behind]",
    );
    const farMoonFront = svg.querySelector<SVGGElement>(
      "[data-moon-far-front]",
    );
    const nearMoonBehind = svg.querySelector<SVGGElement>(
      "[data-moon-near-behind]",
    );
    const nearMoonFront = svg.querySelector<SVGGElement>(
      "[data-moon-near-front]",
    );
    const farComet = svg.querySelector<SVGGElement>("[data-comet-far]");
    const nearComet = svg.querySelector<SVGGElement>("[data-comet-near]");
    const farCometTail =
      farComet?.querySelector<SVGLineElement>("[data-comet-tail]");
    const nearCometTail =
      nearComet?.querySelector<SVGLineElement>("[data-comet-tail]");

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const seed = resolvePhaseSeed();
    const rnd = mulberry32(seed);

    const planetPhase0 = PLANETS.map((p) =>
      reduced ? (HERO_POSE[p.name] ?? 210) : rnd() * 360,
    );
    const rockPhase0 = ASTEROIDS.map(() =>
      reduced ? 200 + rnd() * 80 : rnd() * 360,
    );
    const moonPhase0 = reduced ? HERO_MOON_DEG : rnd() * 360;

    const planetSpin0 = PLANETS.map(() => (reduced ? 0 : rnd() * 360));
    /** Start far from perihelion so first flyby isn’t immediate noise. */
    const cometPhase0 = reduced ? 130 : 80 + rnd() * 200;

    // Expose seed for debugging / sharing (non-reactive).
    root.dataset.phaseSeed = String(seed);

    const placeComet = (trueAnomalyDeg: number) => {
      const { x, y, tailLen, awayDeg, near } = cometState(trueAnomalyDeg);
      const tf = `translate(${x} ${y}) rotate(${awayDeg})`;
      const apply = (
        el: SVGGElement | null,
        tail: SVGLineElement | null | undefined,
        show: boolean,
      ) => {
        if (!el) return;
        el.setAttribute("transform", tf);
        el.setAttribute("opacity", show ? "1" : "0");
        if (tail) tail.setAttribute("x2", String(tailLen));
      };
      apply(farComet, farCometTail, !near);
      apply(nearComet, nearCometTail, near);
    };

    const placeMoon = (
      x: number,
      y: number,
      earthNear: boolean,
      moonBehindEarth: boolean,
    ) => {
      const tf = `translate(${x} ${y})`;
      const nodes = [
        farMoonBehind,
        farMoonFront,
        nearMoonBehind,
        nearMoonFront,
      ];
      for (const el of nodes) {
        if (!el) continue;
        el.setAttribute("transform", tf);
        el.setAttribute("opacity", "0");
      }
      const active = earthNear
        ? moonBehindEarth
          ? nearMoonBehind
          : nearMoonFront
        : moonBehindEarth
          ? farMoonBehind
          : farMoonFront;
      if (active) active.setAttribute("opacity", "1");
    };

    const place = (elapsedS: number) => {
      let earthX = 0;
      let earthY = 0;
      let earthNear = true;

      for (let i = 0; i < PLANETS.length; i++) {
        const p = PLANETS[i]!;
        const deg = reduced
          ? planetPhase0[i]!
          : planetPhase0[i]! + (360 * elapsedS) / p.periodS;
        const spinDeg = reduced
          ? planetSpin0[i]!
          : planetSpin0[i]! + (360 * elapsedS) / p.spinS;
        const { x, y } = ellipsePoint(p.orbitR, deg);
        const near = isNearSide(deg);
        setLayer(farPlanets[i]!, nearPlanets[i]!, x, y, near, spinDeg);
        if (i === EARTH_INDEX) {
          earthX = x;
          earthY = y;
          earthNear = near;
        }
      }

      const moonDeg = reduced
        ? moonPhase0
        : moonPhase0 + (360 * elapsedS) / MOON.periodS;
      const ma = (moonDeg * Math.PI) / 180;
      const mx = earthX + MOON.orbitR * Math.cos(ma);
      const my = earthY + MOON.orbitR * TILT * Math.sin(ma);
      const moonBehindEarth = Math.sin(ma) < 0;
      placeMoon(mx, my, earthNear, moonBehindEarth);

      for (let i = 0; i < ASTEROIDS.length; i++) {
        const a = ASTEROIDS[i]!;
        const deg = reduced
          ? rockPhase0[i]!
          : rockPhase0[i]! + (360 * elapsedS) / a.periodS;
        const { x, y } = ellipsePoint(a.r, deg);
        setLayer(farRocks[i]!, nearRocks[i]!, x, y, isNearSide(deg));
      }

      const cometDeg = reduced
        ? cometPhase0
        : cometPhase0 + (360 * elapsedS) / COMET.periodS;
      placeComet(cometDeg);
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
    >
      <span className="sr-only">Decorative animated solar system</span>
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

        {/* Scene content (orbits, bodies, sun). */}
        <g>
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
            <g key={`far-wrap-${p.name}`}>
              {p.name === "earth" ? (
                <g data-moon-far-behind opacity={0}>
                  <circle
                    className="solar-system__moon"
                    cx={0}
                    cy={0}
                    r={MOON.bodyR}
                  />
                </g>
              ) : null}
              <g data-planet-far={i} opacity={0}>
                <PlanetBody
                  dim={p.dim}
                  bodyR={p.bodyR}
                  saturnRing={p.saturnRing}
                />
              </g>
              {p.name === "earth" ? (
                <g data-moon-far-front opacity={0}>
                  <circle
                    className="solar-system__moon"
                    cx={0}
                    cy={0}
                    r={MOON.bodyR}
                  />
                </g>
              ) : null}
            </g>
          ))}

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

          {/* Comet: head + tail (+x = away from sun after rotate). */}
          <g data-comet-far opacity={0}>
            <line
              data-comet-tail
              className="solar-system__comet-tail"
              x1={0}
              y1={0}
              x2={COMET.tailMin}
              y2={0}
            />
            <circle
              className="solar-system__comet-head"
              cx={0}
              cy={0}
              r={COMET.bodyR}
            />
          </g>

          <circle
            className="solar-system__sun"
            cx={SUN.x}
            cy={SUN.y}
            r={SUN_R}
            fill={`url(#${sunGradId})`}
          />
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
            <g key={`near-wrap-${p.name}`}>
              {p.name === "earth" ? (
                <g data-moon-near-behind opacity={0}>
                  <circle
                    className="solar-system__moon"
                    cx={0}
                    cy={0}
                    r={MOON.bodyR}
                  />
                </g>
              ) : null}
              <g data-planet-near={i} opacity={0}>
                <PlanetBody
                  dim={p.dim}
                  bodyR={p.bodyR}
                  saturnRing={p.saturnRing}
                />
              </g>
              {p.name === "earth" ? (
                <g data-moon-near-front opacity={0}>
                  <circle
                    className="solar-system__moon"
                    cx={0}
                    cy={0}
                    r={MOON.bodyR}
                  />
                </g>
              ) : null}
            </g>
          ))}

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

          <g data-comet-near opacity={0}>
            <line
              data-comet-tail
              className="solar-system__comet-tail"
              x1={0}
              y1={0}
              x2={COMET.tailMin}
              y2={0}
            />
            <circle
              className="solar-system__comet-head"
              cx={0}
              cy={0}
              r={COMET.bodyR}
            />
          </g>
        </g>
      </svg>
    </div>
  );
}
