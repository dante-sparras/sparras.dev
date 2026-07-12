# Black-hole cleanup plan (remove, don’t deprecate)

Goal: cleanest single-app code. No library back-compat. Delete aliases and dead knobs.

## Principles

- One way to configure: **flat knobs** and optional **`physics` bag only**
- Pure domain free of React/theme; host applies presentation
- Shared numeric constants (CPU + TSL via `float(CONST)`)
- Small files, named stages, no dual public names

## Phases

### P1 — Single override API

- Remove `overrides` from `BuildBlackHoleConfigOptions` and `BlackHoleProps`
- Prefer flat: `buildBlackHoleConfig({ spin: 0.9 })` / `<BlackHole spin={0.9} />`
- Optional nested: `physics?: BlackHoleOverrides` only
- Update all tests to flat (or `physics`)

### P2 — Dead presentation knobs

- Remove `DISK.beamAmp` (unused)
- Remove `MARCH.softCapturePhotonMul` (only GRADE path lives)

### P3 — `PHYSICS_LIMITS` (+ light-theme scale)

- Named clamps currently hard-coded in `buildBlackHoleConfig` / orbit helpers
- Export `PHYSICS_LIMITS`, use everywhere (build, tests, clamp helpers)

### P4 — Stable React memo for flat knobs

- Don’t depend on `rest` object identity
- Depend on each `RAW_PHYSICS_KEYS` value (or serialize sorted keys)

### P5 — Theme out of pure build

- `buildBlackHoleConfig` never dims Ṁ
- Pure `applyLightThemeAccretion(config)` or host multiplies once
- Tests for theme stay on the presentation helper

### P6 — Orbit limits from geometry

- `min` from outer disk / horizons / separation (no tunnel through BHs)
- `max` from D + geometry so zoom-out still works
- `skyDomeRadius` still > max

### P7 — Shared physics presentation constants

- `DOPPLER_LIMITS`, palette Kelvin floors, spin open interval
- CPU modules import them; TSL uses `float(X)` from same module
- Align blackbody stops documentation (CPU is source of truth)

### P8 — Shader structure

- DRY `unitRange` once
- Split `create.ts` into stage helpers in same folder if readable (ray / march composite comments + extract pure TSL helpers where safe)
- Do **not** nest disk composite in Fn (keep inline)

### P9 — Slim host

- Extract `ObserverCamera` / scene pieces if it clarifies
- Single look-at path (avoid fighting CameraLookAt if redundant)
- Clear types for mesh props

### P10 — Config module split (if still huge after P1–P7)

- `physics-keys.ts` | `limits.ts` | `defaults.ts` | `build-config.ts` | re-export `config.ts`
- Only if it reduces noise without scatter

### P11 — Docs + public barrel

- Update `index.ts`, hero comments, skill if needed
- Export only what’s used

## Verification each phase

`bun test tests/black-hole` after each logical phase; `bun run check` before commit.

## Out of scope (document only)

- Full dual Kerr spacetime / EHT fidelity
- Visual golden-image CI (optional later)
- Full removal of `@ts-nocheck` (TSL types incomplete; reduce where possible)
