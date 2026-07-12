# Black-hole refactoring plan (post bugfix phase)

> **For Hermes:** Implement **one step at a time**. After each step: `bun run check` + hard-refresh hero (fire disks + two silhouettes). Stop and fix if visuals break. **Do not** reintroduce nested TSL `Fn` that `addAssign`s parent accumulators (disks go black).

**Goal:** Improve structure, testability, and maintainability of the R3F+WebGPU binary black-hole stack without changing locked brand (Interstellar peach, no stars, physics-only public knobs, pixel-art via DPR).

**Architecture today:**

```
components/black-hole/
  config.ts       # Kerr math + overrides + buildBlackHoleConfig (~580 LOC)
  shader.ts       # TSL entire pipeline (~725 LOC, @ts-nocheck)
  black-hole.tsx  # R3F host + mesh + scene (~370 LOC)
  index.ts        # public barrel
components/three/ # WebGPUCanvas, IdleOrbit, Bloom
```

**Architecture target (end of plan):**

```
components/black-hole/
  kerr.ts           # pure Kerr / clamps / photon / ISCO
  config.ts         # defaults, overrides types, buildBlackHoleConfig
  uniforms.ts       # createUniforms / applyConfig / syncCamera (host)
  shader/
    constants.ts    # MARCH / DISK / GRADE
    disk.ts         # color + sampleMiniDisk Fns
    bayer.ts        # bayer4
    march.ts        # createBlackHoleShader body (or keep in index)
    index.ts        # re-exports + CONFIG_SCALAR_KEYS + types
  black-hole.tsx    # thin R3F composition
  index.ts
```

**Tech stack:** Next 16, R3F, Three WebGPU/TSL, bun, oxlint/oxfmt. Prefer bun test if already in package.json; otherwise vitest/node assert only if lightweight.

**Global safety rules:**

1. Visual baseline: two mini-disks with fire + two black holes + transparent void.
2. `CONFIG_SCALAR_KEYS` must stay in sync with what the shader reads.
3. TSL: `addAssign` only on outer `toVar` nodes; composite disks **inline**.
4. Pixel art = host DPR only (no double snap).
5. `skyDomeRadius` ≥ orbit max.

**Global verification:**

```bash
export PATH="$HOME/.bun/bin:$PATH"
bun run fmt && bun run check
# visual: hard-refresh localhost — disks orange, silhouettes, orbit works
```

---

## Risk ladder (summary)

| Step | Risk   | Effort | Theme                                                                        |
| ---- | ------ | ------ | ---------------------------------------------------------------------------- |
| R1   | Low    | S      | File split: Kerr pure math out of config                                     |
| R2   | Low    | S      | Host pure helpers → `uniforms.ts`                                            |
| R3   | Low    | M      | Unit tests for pure CPU physics                                              |
| R4   | Medium | L      | Shader module split (constants + disk + bayer)                               |
| R5   | Medium | M      | CPU dual-hole as structured pair; less Primary/Secondary spam                |
| R6   | Medium | M      | Pause when off-screen / tab hidden (perf)                                    |
| R7   | High   | L      | Optional: demand frameloop, effect graph, Kerr bend — **YAGNI until needed** |

---

### R1 — Extract pure Kerr math to `kerr.ts` (LOW)

**Change:** Move from `config.ts` into `components/black-hole/kerr.ts`:

- `clampSpin`, `clampInclinationDegrees` (or keep inclination clamp in config)
- `photonSphereRadius`, `iscoRadius`
- `kerrScales`, `keplerOmega`
- `KerrScales` type

`config.ts` re-exports what `index.ts` already exports (`kerrScales`, `keplerOmega`, `KerrScales`).

**Why:** Single Responsibility — GR length scales vs site knobs/build. Enables unit tests without loading theme/render defaults. Classic **module boundary** pattern.

**Safety:** Pure move; no behavior change if re-exports preserved. Break risk: forgotten re-export → import path break.

**Verify:**

- `bun run check`
- Grep that public API from `@/components/black-hole` still exports `kerrScales`, `keplerOmega`
- Visual optional (no GPU change)

**Patterns:** Extract module; pure functions; no DI needed.

---

### R2 — Extract host uniform/camera helpers to `uniforms.ts` (LOW)

**Change:** Move from `black-hole.tsx` to `components/black-hole/uniforms.ts`:

- `createUniforms`, `applyConfig`, `syncCamera`, `CameraAxes`
- Keep React components in `black-hole.tsx`

**Why:** Host file is composition + JSX; uniform plumbing is portable. Easier to test that every `CONFIG_SCALAR_KEYS` entry gets a uniform.

**Safety:** Must still run only under `"use client"` context (imports `three/webgpu` / `three/tsl`). File should start with `"use client"` or only be imported from client modules.

**Verify:** `bun run check` + visual (uniforms still update: orbit phase moves).

**Patterns:** Separate pure-ish host utilities from components (**hexagonal-ish** host adapter).

---

### R3 — Unit tests for pure config/Kerr (LOW)

**Change:** Add tests (detect existing runner first — `package.json` scripts):

- `kerrScales(1, 0)` → r₊=2, photon≈3, ISCO≈6
- `kerrScales(1, 0.998)` → r₊ ≈ M, ISCO ≪ 6M
- `buildBlackHoleConfig({ overrides: { separation: 20 }})` → cameraDistance ≥ sep×1.55+4, H1/H2 present
- `orbitDistanceLimits` / `skyDomeRadius` inequality: sky ≥ orbit max

**Why:** Locks physics clamps so refactors don’t silently desync r₊/ISCO.

**Safety:** Tests only pure functions — no WebGPU. Don’t mock Three.

**Verify:** `bun test` (or project’s test script) green + `bun run check`.

**Patterns:** TDD for next Kerr changes; table-driven cases for spin=0 vs high spin.

---

### R4 — Split `shader.ts` into `shader/` modules (MEDIUM)

**Change:**

```
shader/
  constants.ts   # MARCH, DISK, GRADE (plain JS const objects)
  disk.ts        # unitRange, cylindricalRadiusXZ, diskColor*, sampleMiniDisk
  bayer.ts       # bayer4
  types.ts       # UniformNode, CONFIG_SCALAR_KEYS, BlackHoleUniforms
  create.ts      # createBlackHoleShader (march loop — stays one Fn for TSL)
  index.ts       # public re-exports (what black-hole.tsx imports today)
```

Delete or thin root `shader.ts` → re-export from `./shader`.

**Why:** 725 LOC god-file; constants/disk helpers are independently reviewable. March loop stays monolithic (TSL control flow is fragile).

**Safety:** **Highest medium risk.** TSL graph build can break on import order / multiple `Fn` files.

- Keep `@ts-nocheck` on every TSL Fn file or one barrel with nocheck.
- Do **not** re-extract composite with `addAssign` on Fn params.
- Ship constants-only split first if full split is flaky.

**Verify:** Hard-refresh hero — disks must not go black. Compare to pre-split screenshot. `bun run check`.

**Patterns:** Facade (`shader/index.ts`); layered pipeline docs in comments; avoid premature TSL abstraction.

**Suggested sub-order:**

1. R4a: move `MARCH/DISK/GRADE` only
2. R4b: move disk Fns
3. R4c: move bayer + types + create

---

### R5 — Dual-hole as structured pair on CPU (MEDIUM)

**Change:** In `BlackHoleConfig` (or build intermediate):

```ts
type HoleScales = {
  mass: number;
  eventHorizon: number;
  photonSphere: number;
  isco: number;
  diskScaleHeight: number;
};
// holes: [HoleScales, HoleScales]
```

Still flatten into `CONFIG_SCALAR_KEYS` for the GPU (TSL wants named uniforms). Optional: generate keys from a list.

**Why:** DRY Primary/Secondary fields in `buildBlackHoleConfig`; less drift when adding a third quantity.

**Safety:** Renaming config fields breaks uniform keys — do carefully with single map `toScalarUniforms(config)`. Visual: unequal `massRatio` should still show two different disk sizes/thicknesses.

**Verify:** `massRatio: 0.4` vs `1` visual; unit test that both H fields set; `bun run check`.

**Patterns:** Value object for a hole; **adapter** from structured → flat uniform bag.

---

### R6 — Visibility / intersection pause (MEDIUM)

**Change:**

- Keep tab-hidden pause in `useFrame` (already done).
- Add `IntersectionObserver` on shell: when not intersecting, skip time advance and/or set Canvas `frameloop="demand"` / pause OrbitControls auto-rotate.
- Optionally expose `frameloop` from `BlackHole` for tests.

**Why:** Hero is always-on GPU today; off-screen still costs battery/heat.

**Safety:** Can freeze phase incorrectly if observer flips thrash; auto-rotate must resume when visible. Don’t break SSR dynamic boundary.

**Verify:** Scroll page so banner off-screen → GPU quieter (DevTools Performance); scroll back → animation resumes. Disks still correct.

**Patterns:** Observer + explicit pause flag; avoid demand frameloop until OrbitControls invalidate path is clear.

---

### R7 — Higher-risk / optional architecture (HIGH — do only with explicit go)

| Idea                                                     | Benefit       | Risk                           | Note                                  |
| -------------------------------------------------------- | ------------- | ------------------------------ | ------------------------------------- |
| Demand frameloop + `invalidate` each frame while visible | CPU when idle | Easy to freeze animation       | Needs careful OrbitControls wiring    |
| Kerr light-bending term from spin                        | More physical | Visual + numerical instability | Physics project, not pure refactor    |
| Post-process Bloom re-attach                             | Glow          | Premultiplied alpha bugs       | Already optional in three/            |
| Effect composition graph (disk/silhouette/grade nodes)   | Testability   | TSL graph explosion            | Only after R4 stable                  |
| DI for `buildBlackHoleConfig` clock/theme                | Testability   | Overkill                       | Prefer plain options object (already) |

**Default: skip R7 unless user asks.**

---

## Execution order (this session)

1. Write this plan ✓
2. **Implement R1**
3. **Implement R2**
4. **Implement R3** (if test runner exists / add minimal)
5. **Implement R4a → R4c** carefully with visual checks
6. R5, R6 if time and R4 green
7. Stop before R7 unless requested

## Done criteria

- [ ] Public imports unchanged for site consumers (`BlackHole`, `defaultPhysics`, `buildBlackHoleConfig`, …)
- [ ] `bun run check` green after every step
- [ ] Hero: fire disks + silhouettes + orbit
- [ ] Skill pitfalls mention module layout if paths change
- [ ] No nested TSL composite helper

## Out of scope (YAGNI)

- Full geodesic Kerr integrator
- Real relativistic beaming
- Stars/nebula
- Bloom default-on
- Changing public physics API shape for site knobs
