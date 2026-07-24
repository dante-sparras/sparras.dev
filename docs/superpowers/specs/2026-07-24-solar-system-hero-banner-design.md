# Solar system hero banner — design

**Date:** 2026-07-24  
**Status:** approved (conversation)  
**Site:** sparras.dev  
**Branch:** `feat/redesign-and-modernize`

## Goal

Restore the home hero **banner strip** (right of portrait, above name/role) with a **minimal, modern, monochrome solar system** animation — pure CSS/SVG, no 3D stack.

## Context

- Black-hole / Three / WebGPU hero was removed (`a25a9e3`). Stack stays light.
- Prior banner frame sizes are the layout baseline.
- Hero today: portrait | name + role only.

## Decisions (locked)

| Topic          | Choice                                                            |
| -------------- | ----------------------------------------------------------------- |
| Tech           | Pure CSS/SVG (no Canvas, no Three)                                |
| Slot           | Right of portrait, above name/role; fills remaining column height |
| Bodies         | Sun + 8 planets (art-scaled radii, not real AU)                   |
| Color          | Theme-neutral monochrome (borders / foreground / muted)           |
| Composition    | Top-down plan view, centered Sun, concentric circular orbits      |
| Motion         | Continuous CSS orbit rotation; no IntersectionObserver pause      |
| Reduced motion | `prefers-reduced-motion: reduce` → freeze (static poses)          |

## Layout

```
┌────────────┬─────────────────────────────┐
│            │  Solar system banner        │
│  Portrait  │  (flex-1, min-heights)      │
│            ├─────────────────────────────┤
│            │  Name                       │
│            │  Role                       │
└────────────┴─────────────────────────────┘
```

**Banner frame classes (match prior strip):**

`relative min-h-[7.5rem] h-full w-full flex-1 bg-background sm:min-h-[9rem] md:min-h-[11rem]`

Name/role block keeps `border-t border-border` under the banner.

## Components

| Unit          | Responsibility                                                    |
| ------------- | ----------------------------------------------------------------- |
| `HeroSection` | Portrait + `HeroBanner` + titles; server-safe composition         |
| `HeroBanner`  | Banner frame only (size / background); does not own solar physics |
| `SolarSystem` | Presentational SVG scene; fills parent; layout-agnostic           |

Public barrel stays `@/components/hero-section` → primarily `HeroSection`.

### SolarSystem visual rules

- Decorative: root graphic `aria-hidden="true"` (section label remains person name).
- One SVG, `viewBox` square (or near-square), `preserveAspectRatio="xMidYMid meet"`, centered in frame.
- Concentric thin orbit strokes using theme border/muted strokes.
- Sun: larger filled disc (foreground).
- Planets: small filled discs; relative size hierarchy for readability (not mass-accurate).
- Saturn: minimal ring (thin ellipse or dual arc) so it reads as Saturn without hue.
- Monochrome only: `currentColor` and/or CSS variables tied to existing theme tokens — no hard-coded light/dark hex pairs unless derived from tokens.
- Eight orbit periods: inner faster, outer slower (Kepler-ish art ratios, not a physics engine).

### Motion

- CSS `@keyframes` rotate on each planet’s orbit group (`transform-box` / `transform-origin` center).
- Continuous loop; infinite.
- `@media (prefers-reduced-motion: reduce) { animation: none; }` (or equivalent) so planets sit at fixed angles.

## Files (expected)

- `components/hero-section/hero-banner.tsx` — frame
- `components/hero-section/solar-system.tsx` — SVG + motion (CSS module or Tailwind + global keyframes as needed)
- `components/hero-section/hero.tsx` — wire banner back into column
- `components/hero-section/index.ts` — exports if needed
- Touch `AGENTS.md` / `README.md` hero one-liners if stale

## Out of scope

- Planet labels, tooltips, click handlers
- Canvas / Three / WebGPU
- Asteroid belt, moons (except Saturn’s ring cue)
- True astronomical scale or ephemerides
- Pause when off-screen
- i18n copy for the diagram (decorative only)

## Acceptance

1. Home hero shows banner strip right of portrait, above name/role, at prior min-heights.
2. Top-down monochrome Sun + 8 orbits/planets animate continuously (CSS).
3. Light and dark themes remain legible (token-based strokes/fills).
4. `prefers-reduced-motion: reduce` freezes animation.
5. No new runtime dependencies.
6. `bun run check` and `bun run build` pass.

## Non-goals / anti-regression

- Do not reintroduce Three/R3F/WebGPU for this feature.
- Do not put banner min-heights inside `SolarSystem` (parent owns size — same rule as old black-hole host).
