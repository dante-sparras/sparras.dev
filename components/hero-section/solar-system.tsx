import { cn } from "@/lib/utils";

const CX = 100;
const CY = 100;

type PeriodClass =
  | "solar-system__spin--8s"
  | "solar-system__spin--12s"
  | "solar-system__spin--16s"
  | "solar-system__spin--22s"
  | "solar-system__spin--36s"
  | "solar-system__spin--48s"
  | "solar-system__spin--64s"
  | "solar-system__spin--80s";

type Planet = {
  name: string;
  orbitR: number;
  bodyR: number;
  spinClass: PeriodClass;
  startDeg: number;
  dim?: boolean;
  saturnRing?: boolean;
};

/** Art-scaled radii (not real AU). Inner faster, outer slower. */
const PLANETS: Planet[] = [
  {
    name: "mercury",
    orbitR: 18,
    bodyR: 1.2,
    spinClass: "solar-system__spin--8s",
    startDeg: 20,
    dim: true,
  },
  {
    name: "venus",
    orbitR: 28,
    bodyR: 1.8,
    spinClass: "solar-system__spin--12s",
    startDeg: 80,
  },
  {
    name: "earth",
    orbitR: 38,
    bodyR: 2.0,
    spinClass: "solar-system__spin--16s",
    startDeg: 140,
  },
  {
    name: "mars",
    orbitR: 48,
    bodyR: 1.5,
    spinClass: "solar-system__spin--22s",
    startDeg: 200,
    dim: true,
  },
  {
    name: "jupiter",
    orbitR: 62,
    bodyR: 3.6,
    spinClass: "solar-system__spin--36s",
    startDeg: 260,
  },
  {
    name: "saturn",
    orbitR: 76,
    bodyR: 3.0,
    spinClass: "solar-system__spin--48s",
    startDeg: 310,
    saturnRing: true,
  },
  {
    name: "uranus",
    orbitR: 88,
    bodyR: 2.4,
    spinClass: "solar-system__spin--64s",
    startDeg: 40,
    dim: true,
  },
  {
    name: "neptune",
    orbitR: 98,
    bodyR: 2.3,
    spinClass: "solar-system__spin--80s",
    startDeg: 100,
    dim: true,
  },
];

export type SolarSystemProps = {
  className?: string;
};

/**
 * Layout-agnostic top-down solar system (decorative SVG).
 * Parent owns size; this fills `h-full w-full`.
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
        className="absolute inset-0 m-auto h-full w-full max-h-full max-w-full"
        viewBox="0 0 200 200"
        preserveAspectRatio="xMidYMid meet"
        focusable="false"
      >
        {PLANETS.map((p) => (
          <circle
            key={`orbit-${p.name}`}
            className="solar-system__orbit-ring"
            cx={CX}
            cy={CY}
            r={p.orbitR}
          />
        ))}

        <circle className="solar-system__sun" cx={CX} cy={CY} r={6} />

        {PLANETS.map((p) => {
          const rad = (p.startDeg * Math.PI) / 180;
          const px = CX + p.orbitR * Math.cos(rad);
          const py = CY + p.orbitR * Math.sin(rad);
          return (
            <g key={p.name} className={cn("solar-system__spin", p.spinClass)}>
              <circle
                className={
                  p.dim
                    ? "solar-system__planet solar-system__planet--dim"
                    : "solar-system__planet"
                }
                cx={px}
                cy={py}
                r={p.bodyR}
              />
              {p.saturnRing ? (
                <ellipse
                  className="solar-system__saturn-ring"
                  cx={px}
                  cy={py}
                  rx={p.bodyR * 2.1}
                  ry={p.bodyR * 0.7}
                />
              ) : null}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
