# Solar System Hero Banner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (or subagent-driven-development) to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the home hero banner strip with a minimal monochrome CSS/SVG solar system (Sun + 8 planets).

**Architecture:** `HeroBanner` owns frame size only; `SolarSystem` is a layout-agnostic decorative SVG with CSS orbit animations; `HeroSection` composes portrait + banner + titles. No new deps; theme via CSS tokens/`currentColor`.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind v4, pure SVG + CSS keyframes.

## Global Constraints

- No Canvas / Three / WebGPU / new runtime dependencies.
- Banner min-heights live only on `HeroBanner` frame, not inside `SolarSystem`.
- Decorative graphic: `aria-hidden="true"`.
- Monochrome theme tokens only; top-down concentric orbits; continuous CSS rotation.
- `prefers-reduced-motion: reduce` freezes animations.
- `bun run check` and `bun run build` must pass.
- Spec: `docs/superpowers/specs/2026-07-24-solar-system-hero-banner-design.md`

---

### Task 1: SolarSystem SVG scene + CSS motion

**Files:**

- Create: `components/hero-section/solar-system.tsx`
- Create: `components/hero-section/solar-system.css`
- Modify: `app/globals.css` — only if keyframes cannot be scoped; prefer colocated CSS import from the component

**Interfaces:**

- Produces: `export function SolarSystem({ className?: string }: { className?: string })`
- Fills parent (`h-full w-full`), no min-height of its own
- Root: decorative, `aria-hidden`

**Planet data (art-scaled, viewBox 0 0 200 200, center 100,100):**

| Body    | Orbit r | Planet r | Period (s) | Start angle (deg) |
| ------- | ------- | -------- | ---------- | ----------------- |
| Mercury | 18      | 1.2      | 8          | 20                |
| Venus   | 28      | 1.8      | 12         | 80                |
| Earth   | 38      | 2.0      | 16         | 140               |
| Mars    | 48      | 1.5      | 22         | 200               |
| Jupiter | 62      | 3.6      | 36         | 260               |
| Saturn  | 76      | 3.0      | 48         | 310               |
| Uranus  | 88      | 2.4      | 64         | 40                |
| Neptune | 98      | 2.3      | 80         | 100               |

Sun: circle r=6 at center, fill `currentColor`.

- [ ] **Step 1: Create `solar-system.css`**

```css
/* components/hero-section/solar-system.css */
.solar-system {
  color: var(--foreground);
}

.solar-system__orbit-ring {
  fill: none;
  stroke: var(--border);
  stroke-width: 0.6;
  opacity: 0.9;
}

.solar-system__sun {
  fill: currentColor;
}

.solar-system__planet {
  fill: currentColor;
}

.solar-system__planet--dim {
  fill: var(--muted-foreground);
  opacity: 0.85;
}

.solar-system__saturn-ring {
  fill: none;
  stroke: currentColor;
  stroke-width: 0.45;
  opacity: 0.7;
}

.solar-system__spin {
  transform-origin: 100px 100px;
  transform-box: view-box;
  animation-name: solar-system-spin;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
}

@keyframes solar-system-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .solar-system__spin {
    animation: none !important;
  }
}
```

- [ ] **Step 2: Create `solar-system.tsx`**

```tsx
import { cn } from "@/lib/utils";
import "./solar-system.css";

const CX = 100;
const CY = 100;

type Planet = {
  name: string;
  orbitR: number;
  bodyR: number;
  periodS: number;
  startDeg: number;
  dim?: boolean;
  saturnRing?: boolean;
};

const PLANETS: Planet[] = [
  {
    name: "mercury",
    orbitR: 18,
    bodyR: 1.2,
    periodS: 8,
    startDeg: 20,
    dim: true,
  },
  { name: "venus", orbitR: 28, bodyR: 1.8, periodS: 12, startDeg: 80 },
  { name: "earth", orbitR: 38, bodyR: 2.0, periodS: 16, startDeg: 140 },
  {
    name: "mars",
    orbitR: 48,
    bodyR: 1.5,
    periodS: 22,
    startDeg: 200,
    dim: true,
  },
  { name: "jupiter", orbitR: 62, bodyR: 3.6, periodS: 36, startDeg: 260 },
  {
    name: "saturn",
    orbitR: 76,
    bodyR: 3.0,
    periodS: 48,
    startDeg: 310,
    saturnRing: true,
  },
  {
    name: "uranus",
    orbitR: 88,
    bodyR: 2.4,
    periodS: 64,
    startDeg: 40,
    dim: true,
  },
  {
    name: "neptune",
    orbitR: 98,
    bodyR: 2.3,
    periodS: 80,
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
            <g
              key={p.name}
              className="solar-system__spin"
              style={{ animationDuration: `${p.periodS}s` }}
            >
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
```

Note: rotating the whole `<g>` around SVG center keeps the planet on its orbit. Static `cx/cy` is the start pose; rotation carries it around.

- [ ] **Step 3: Typecheck smoke**

Run: `bun run typecheck`  
Expected: pass (or only pre-existing errors unrelated to these files)

- [ ] **Step 4: Commit**

```bash
git add components/hero-section/solar-system.tsx components/hero-section/solar-system.css
git commit -m "feat(hero): add SolarSystem CSS/SVG scene"
```

---

### Task 2: HeroBanner frame + wire HeroSection

**Files:**

- Create: `components/hero-section/hero-banner.tsx`
- Modify: `components/hero-section/hero.tsx`
- Modify: `components/hero-section/index.ts`
- Modify: `AGENTS.md` (hero one-liner)
- Modify: `README.md` (hero one-liner)

**Interfaces:**

- Consumes: `SolarSystem` from `./solar-system`
- Produces: `export function HeroBanner({ className?: string })`

- [ ] **Step 1: Create `hero-banner.tsx`**

```tsx
import { cn } from "@/lib/utils";
import { SolarSystem } from "./solar-system";

/** Banner strip next to the portrait — size comes from here, not the scene. */
const BANNER_FRAME =
  "relative min-h-[7.5rem] h-full w-full flex-1 overflow-hidden bg-background sm:min-h-[9rem] md:min-h-[11rem]";

export type HeroBannerProps = {
  className?: string;
};

/**
 * Home-hero frame for the solar system scene.
 * Owns banner layout (flex grow + min heights). `SolarSystem` only fills its parent.
 */
export function HeroBanner({ className }: HeroBannerProps) {
  return (
    <div className={cn(BANNER_FRAME, className)}>
      <SolarSystem />
    </div>
  );
}
```

- [ ] **Step 2: Update `hero.tsx`**

```tsx
import Image from "next/image";
import type { Dictionary } from "@/lib/i18n";
import { HeroBanner } from "./hero-banner";

export type HeroSectionProps = {
  hero: Dictionary["home"]["hero"];
};

/**
 * Home hero: portrait · solar system banner · name + role.
 * Contact / bio facts live in `ProfileDetails`.
 */
export function HeroSection({ hero }: HeroSectionProps) {
  return (
    <section className="w-full" aria-label={hero.name}>
      <div className="flex items-stretch border-b border-border">
        <div className="shrink-0 border-r border-border p-0">
          <div className="relative size-40 overflow-hidden rounded-full border border-border bg-muted sm:size-48 md:size-56">
            <Image
              src="//images/portrait.webp"
              alt={hero.avatarAlt}
              fill
              priority
              className="object-cover object-[center_18%]"
              sizes="(max-width: 640px) 160px, (max-width: 768px) 192px, 224px"
            />
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <HeroBanner />

          <div className="shrink-0 border-t border-border p-0">
            <h1 className="border-b border-border px-2 py-1.5 text-2xl font-semibold tracking-tight sm:px-2.5 sm:text-3xl">
              {hero.name}
            </h1>
            <p className="text-muted-foreground px-2 py-1.5 text-sm leading-none sm:px-2.5 sm:text-base">
              {hero.role}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Update `index.ts`**

```ts
/**
 * Home hero — portrait, solar system banner, title + role.
 *
 * Public: `HeroSection`.
 */
export { HeroSection, type HeroSectionProps } from "./hero";
```

- [ ] **Step 4: Docs one-liners**

In `AGENTS.md` Layout section, hero bullet:

`- **Hero section** (\`@/components/hero-section\`): portrait + solar system banner + name/role; details = \`ProfileDetails\`.`

In `README.md` layout table hero row:

`| \`components/hero-section/\` | Home hero (\`HeroSection\`) — portrait / solar banner / title / role |`

- [ ] **Step 5: Verify**

Run:

```bash
bun run check
bun run build
```

Expected: both exit 0.

Manual: open `http://localhost:3000/en` — banner above name, 8 orbits + sun animating; toggle dark mode; check reduced-motion if available.

- [ ] **Step 6: Commit**

```bash
git add components/hero-section/hero-banner.tsx components/hero-section/hero.tsx components/hero-section/index.ts AGENTS.md README.md
git commit -m "feat(hero): wire solar system banner into HeroSection"
```

---

## Spec coverage

| Spec item                     | Task |
| ----------------------------- | ---- |
| CSS/SVG only, no 3D           | 1–2  |
| Banner slot + min-heights     | 2    |
| Sun + 8 planets, monochrome   | 1    |
| Top-down concentric           | 1    |
| Continuous orbits             | 1    |
| prefers-reduced-motion freeze | 1    |
| Parent owns size              | 1–2  |
| check + build                 | 2    |
| AGENTS/README                 | 2    |
