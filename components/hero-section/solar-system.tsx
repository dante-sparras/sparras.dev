import { cn } from "@/lib/utils";

/**
 * Banner-aware framing (reference composition, monochrome):
 * - Sun large on the LEFT, half cropped out of frame
 * - Orbits as nested ellipses (side-tilted, not top-down)
 * - Only roughly half the system reads inside the strip
 */
const SUN = { x: 4, y: 78 } as const;
/** ry / rx — lower = more edge-on. */
const TILT = 0.34;
const VIEW = { w: 280, h: 140 } as const;
const SUN_R = 36;

type Planet = {
  name: string;
  /** Semi-major axis (horizontal). */
  orbitR: number;
  bodyR: number;
  periodS: number;
  /**
   * Start phase along the orbit, degrees (0 = right of sun).
   * Negative ≈ above the major axis in SVG (Y-down).
   */
  startDeg: number;
  dim?: boolean;
  saturnRing?: boolean;
};

/**
 * Art-scaled radii (not real AU). Start angles biased to the visible
 * upper-right arc so the banner reads like the reference crop.
 */
const PLANETS: Planet[] = [
  {
    name: "mercury",
    orbitR: 52,
    bodyR: 1.8,
    periodS: 8,
    startDeg: -18,
    dim: true,
  },
  {
    name: "venus",
    orbitR: 70,
    bodyR: 2.4,
    periodS: 12,
    startDeg: -42,
  },
  {
    name: "earth",
    orbitR: 90,
    bodyR: 2.6,
    periodS: 16,
    startDeg: -28,
  },
  {
    name: "mars",
    orbitR: 110,
    bodyR: 2.1,
    periodS: 22,
    startDeg: -58,
    dim: true,
  },
  {
    name: "jupiter",
    orbitR: 138,
    bodyR: 5.0,
    periodS: 36,
    startDeg: -38,
  },
  {
    name: "saturn",
    orbitR: 168,
    bodyR: 4.0,
    periodS: 48,
    startDeg: -52,
    saturnRing: true,
  },
  {
    name: "uranus",
    orbitR: 198,
    bodyR: 3.0,
    periodS: 64,
    startDeg: -22,
    dim: true,
  },
  {
    name: "neptune",
    orbitR: 228,
    bodyR: 2.9,
    periodS: 80,
    startDeg: -68,
    dim: true,
  },
];

function ellipsePoint(rx: number, deg: number) {
  const a = (deg * Math.PI) / 180;
  const ry = rx * TILT;
  return {
    x: +(SUN.x + rx * Math.cos(a)).toFixed(3),
    y: +(SUN.y + ry * Math.sin(a)).toFixed(3),
  };
}

/** Full ellipse path starting at `startDeg` (for animateMotion). */
function motionPath(rx: number, startDeg: number): string {
  const a = ellipsePoint(rx, startDeg);
  const b = ellipsePoint(rx, startDeg + 180);
  const ry = +(rx * TILT).toFixed(3);
  return `M ${a.x} ${a.y} A ${rx} ${ry} 0 1 1 ${b.x} ${b.y} A ${rx} ${ry} 0 1 1 ${a.x} ${a.y}`;
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
 * Styles: `solar-system.css` (imported from `app/globals.css`).
 */
export function SolarSystem({ className }: SolarSystemProps) {
  return (
    <div
      className={cn(
        "solar-system pointer-events-none relative h-full w-full min-h-0 overflow-hidden",
        className,
      )}
      aria-hidden
    >
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox={`0 0 ${VIEW.w} ${VIEW.h}`}
        preserveAspectRatio="xMinYMid slice"
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

        <circle className="solar-system__sun" cx={SUN.x} cy={SUN.y} r={SUN_R} />

        {PLANETS.map((p) => {
          const start = ellipsePoint(p.orbitR, p.startDeg);
          const path = motionPath(p.orbitR, p.startDeg);
          return (
            <g key={p.name}>
              {/* Animated along absolute ellipse path (origin follows path). */}
              <g className="solar-system__body-motion">
                <animateMotion
                  className="solar-system__orbit-anim"
                  path={path}
                  dur={`${p.periodS}s`}
                  repeatCount="indefinite"
                  rotate="0"
                />
                <PlanetBody
                  dim={p.dim}
                  bodyR={p.bodyR}
                  saturnRing={p.saturnRing}
                />
              </g>
              {/* Static start pose when SMIL is disabled (reduced motion). */}
              <g
                className="solar-system__body-static"
                transform={`translate(${start.x} ${start.y})`}
              >
                <PlanetBody
                  dim={p.dim}
                  bodyR={p.bodyR}
                  saturnRing={p.saturnRing}
                />
              </g>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
