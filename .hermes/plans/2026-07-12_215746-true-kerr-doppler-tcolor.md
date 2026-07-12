# True Kerr + Doppler + T-driven color (raw-only public knobs)

> **For Hermes:** Implement task-by-task. After each GPU-touching task: `bun run check` + hard-refresh hero. **Do not** reintroduce nested TSL `Fn` that `addAssign`s parent accumulators (disks go black). Keep Interstellar peach (no white plate, no stars).

**Goal:** Upgrade the binary banner from weak-field Schwarzschild fudge to **local Kerr null-geodesic raymarch**, **physical disk Doppler**, and **temperature-driven disk color**, while exposing only **raw** physics knobs publicly (derived scales are internal).

**Architecture:**

```
CPU (pure)
  kerr.ts          — Kerr scales (existing) + geodesic helpers / conserved quantities
  disk-physics.ts  — T(r), circular-orbit 4-velocity (Boyer–Lindquist), Doppler g-factor formulas (testable)
  config.ts        — BlackHoleOverrides = RAW only; build → derived + uniforms

GPU (TSL)
  shader/geodesic.ts   — Kerr null geodesic step (or local Kerr) in BL / Cartesian
  shader/disk.ts       — sample mini-disk: T → color, Doppler weight
  shader/create.ts     — march orchestration, capture, composite (inline addAssign)
  shader/blackbody.ts  — Kelvin → Interstellar-constrained RGB (no pure white)

Host
  uniforms.ts / black-hole.tsx — upload raw+derived; no new public fudge knobs
```

**Tech stack:** Next 16, R3F, Three WebGPU/TSL, bun, `tests/` (bun:test).

---

## Physics scope (honest constraints)

### What “true Kerr” means _here_

There is **no closed-form exact binary Kerr spacetime**. We will **not** claim global exact GR for two spinning holes.

**Target model (research-grade for a real-time hero):**

1. **Centers** of the two holes still orbit the CM with Newtonian Ω = √(M_tot / d³) (optionally upgrade later to 1PN).
2. **Near hole i**, light is integrated with **Kerr null geodesics** for mass Mᵢ and spin aᵢ = χ Mᵢ in that hole’s **instantaneous rest frame** (local Kerr / patched Kerr).
3. **Far from both**, superpose weak deflections or blend local Kerr charts with a simple switch by min(r₁, r₂).
4. **Capture** when inside outer horizon of either hole (in that hole’s chart).

This is the standard “as real as interactive binary Kerr gets” compromise used in educational Kerr tracers + binary visualizations.

### Doppler

For each mini-disk sample at cylindrical radius r around hole i:

- Assume **prograde circular equatorial** Kerr orbital velocity at r (Bardeen formulas for Ω_K(r), 4-velocity u^μ).
- Photon direction ≈ rayDir in local frame → approximate null k.
- Frequency shift **g = ν_obs / ν_em ≈ (−u_obs · k) / (−u_em · k)** with static-at-infinity observer approx for banner, or camera 4-velocity if cheap.
- Intensity transform: I_obs ∝ g³ I_em (or g⁴ for bolometric — pick one, document, stick to g³ for surface brightness of thermal disk).

### Temperature-driven color

- **T(r) = T_peak · (r_in / r)^α** remains the temperature law (r_in = prograde ISCO).
- Color from **absolute T** via a **blackbody → RGB** curve constrained to Interstellar peach (hot stop golden-peach, **never** (1,1,1)).
- **Remove** geometric r_in→r_out as the primary hue driver; optional ≤10% residual mix only if peach brand breaks (prefer pure T path first).

### Raw vs derived (public API rule)

| Raw (public `BlackHoleOverrides`)                | Derived (internal only — never overrides)             |
| ------------------------------------------------ | ----------------------------------------------------- |
| `primaryMass` M₁                                 | M₂ = q·M₁, M_tot                                      |
| `massRatio` q                                    | r₊, r₋, photon sphere, ISCO (both branches if needed) |
| `separation` d                                   | a = χM, spinParameter                                 |
| `spin` χ (both holes same unless Phase 2 split)  | Ω_orb, arm lengths r₁,r₂                              |
| `inclination` i                                  | diskScaleHeight from H/R · R_char                     |
| `cameraDistance` D (optional FOV-fit still auto) | march step hints if any                               |
| `diskOuterRadiusM`                               |                                                       |
| `diskAspectRatio` H/R                            |                                                       |
| `peakTemperature`                                |                                                       |
| `temperatureIndex` α                             |                                                       |
| `accretionRate` ∝ Ṁ                              |                                                       |

**Not public:** stepSize, pixelSize, dither, colorLevels stay `defaultRender` (presentation, not physics).  
**Not public:** spin bend fudge, beamAmp, geometric palette stops.

`BlackHoleConfig` may still _contain_ derived fields for uniforms; only **`BlackHoleOverrides` / `defaultPhysics`** are the editable surface.

---

## Risk ladder

| Phase                                  | Risk   | Notes                                  |
| -------------------------------------- | ------ | -------------------------------------- |
| P0 API hygiene (raw-only docs + types) | Low    | No visual change if uniforms unchanged |
| P1 T-driven color + tests              | Medium | Visual shift; brand risk (white plate) |
| P2 Disk Doppler + tests                | Medium | Edge-on asymmetry must look physical   |
| P3 Local Kerr geodesic march           | High   | Perf, blank frames, eye rings          |
| P4 Binary chart blending / polish      | High   | Stability near both holes              |
| P5 Skill/docs + verify                 | Low    |                                        |

---

### Task 0 — Baseline lock

**Objective:** Capture current behavior before physics rewrite.

**Files:** none (commands only)

**Steps:**

1. `bun run check && bun test tests`
2. Hard-refresh hero; note spin/separation/inclination look
3. Optional: screenshot to Discord for A/B later

**Verify:** green check + known-good visual.

---

### Task 1 — Document & enforce raw-only public API

**Objective:** `BlackHoleOverrides` / docs only list raw knobs; derived clearly internal.

**Files:**

- Modify: `components/black-hole/config.ts` (JSDoc on `BlackHoleOverrides`, module header)
- Modify: `components/black-hole/index.ts` if needed
- Modify: skill `sparras-black-hole` + `references/overrides.md`

**Steps:**

1. Add section in config module doc:

```ts
/**
 * Public knobs are **raw** only (M, q, d, χ, i, D, H/R, T_peak, α, Ṁ).
 * Derived (r₊, ISCO, Ω, H_abs, a, …) come only from {@link buildBlackHoleConfig}.
 */
```

2. Fix stale spin JSDoc (still says χ does not alter deflection — will after P3).
3. Ensure nothing in public type is purely derived except through `Partial` raw set.
4. Export type alias if useful: `export type RawBlackHolePhysics = Required<BlackHoleOverrides>`.

**Verify:** `bun run check`. No visual change.

---

### Task 2 — CPU disk physics module + unit tests

**Objective:** Pure functions for T(r), Kerr circular Ω, approximate Doppler g (flat-space / Schwarzschild first, Kerr BL next).

**Files:**

- Create: `components/black-hole/disk-physics.ts`
- Create: `tests/black-hole/disk-physics.test.ts`

**API sketch:**

```ts
/** T(r) = TpeakKelvin * (rin/r)^alpha, r >= rin */
export function diskTemperatureK(
  r: number,
  rIn: number,
  peakTemperatureUnits: number, // 1000 K units
  alpha: number,
): number;

/**
 * Prograde circular equatorial angular velocity in Kerr (geometric).
 * Ω = 1 / (r^{3/2}/√M + a)  — same as keplerOmega
 */
export function kerrCircularOmega(
  r: number,
  mass: number,
  spinChi: number,
): number;

/**
 * Line-of-sight Doppler factor for equatorial circular emitter.
 * v_phi ≈ Ω * r / sqrt(1 - rs/r) style or Kerr-safe formula.
 * Returns g = nu_obs/nu_em in (0, ~few].
 */
export function diskDopplerG(args: {
  r: number;
  mass: number;
  spinChi: number;
  /** Angle between (v × n_disk) and ray direction projected in plane */
  cosTheta: number; // line-of-sight component toward/away
  inclinationRad: number;
}): number;
```

**Tests:**

- T(r_in) = T_peak·1000
- T(2 r_in) = T_peak·1000 / 2^α
- Ω(χ=0, r=6M) matches 1/6^{1.5}
- g ≈ 1 face-on; approaching limb g > 1; receding g < 1 at edge-on

**Verify:** `bun test tests/black-hole`

---

### Task 3 — Temperature → Interstellar RGB (CPU + GPU)

**Objective:** Absolute Kelvin drives hue; ban pure white; drop geometric palette as primary.

**Files:**

- Create: `components/black-hole/blackbody.ts` (CPU reference + tests)
- Create: `components/black-hole/shader/blackbody.ts` (TSL port of same curve)
- Modify: `components/black-hole/shader/disk.ts` — `sampleMiniDisk` uses T→RGB
- Modify: `tests/black-hole/blackbody.test.ts`

**Color design (locked brand):**

- Map T∈[T_cool, T_hot] → stops: deep rust → fire → peach → golden-peach
- `T_hot` corresponding to max expected ISCO T (e.g. peak·1000)
- **Never** output RGB all > 0.95; cap hot stop at ~`(1.0, 0.58, 0.12)` family
- Optional soft log compress of luminance from T⁴-ish (Stefan–Boltzmann weight separate from hue)

**disk.ts change sketch:**

```ts
const localT = diskTemperatureAtRadius(...); // Kelvin
const color = temperatureToDiskColor(localT); // NEW — not diskColorAtRadius heat
// brightness still from accretionRate * f(localT/Tpeak) * g^3 (after Doppler task)
```

**Remove or demote:** `diskColorAtRadius` geometric heat curve (delete after parity or keep unused one release).

**Verify:** hard-refresh — outer cooler redder, inner hotter peach/gold; vary `peakTemperature` ±15 clearly shifts color; no white plate.

---

### Task 4 — Proper Doppler in the march

**Objective:** Replace fake `cos(azimuth−phase)` beaming with g from disk velocity.

**Files:**

- Modify: `components/black-hole/shader/disk.ts` / `create.ts`
- Optionally port helpers to `shader/doppler.ts`
- Extend: `tests/black-hole/disk-physics.test.ts`

**GPU steps (per disk sample at mid-point):**

1. Local cylindrical r, hole center, phase for orbital frame of binary (center motion) + local φ around hole.
2. Emitter speed from `kerrCircularOmega` (upload M, χ; compute Ω in TSL).
3. Build approximate line-of-sight unit vector from rayDir; project onto disk plane (y=0) to get approaching/receding sign.
4. `g = clamp(dopplerG(...), gMin, gMax)` e.g. [0.3, 2.5] for stability.
5. Scale segment intensity by `g^3` (document choice).
6. Optionally blueshift/redshift **hue** by evaluating color at T_eff = T \* g (physical for thermal spectrum under Doppler).

**Binary motion:** include hole’s orbital velocity of center (Ω_orb × arm) added to local orbital velocity (vector sum in inertial frame) for better edge-on binary asymmetry.

**Verify:** inclination ~80° shows clear left/right brightness asymmetry that **flips** with orbit phase; face-on ~symmetric; no disco strobing.

---

### Task 5 — Local Kerr geodesic integrator (single-hole chart)

**Objective:** Replace Δd̂ ∝ 2M/r² boost with a **null geodesic step** in Kerr for the **nearest** hole (or hole with strongest field).

**Files:**

- Create: `components/black-hole/shader/geodesic.ts` (TSL Fn: step Kerr null geodesic)
- Create: `components/black-hole/kerr-geodesic.ts` (CPU reference for unit tests — simplified)
- Modify: `components/black-hole/shader/create.ts` march loop
- Create: `tests/black-hole/kerr-geodesic.test.ts` (CPU)

**Recommended algorithm (real-time friendly):**

**Option A (prefer for banner):** Hamiltonian / RK2 on conserved E, L, Q in Boyer–Lindquist for Kerr, then convert to Cartesian for binary placement.

**Option B (simpler first slice):** Cartesian pseudo-Newtonian with Kerr-correct photon sphere + ISCO + spin-dependent deflection from known effective potential — weaker “true Kerr” claim.

**Plan default: Option A simplified:**

Per step near hole i (coordinates relative to hole center, z-axis = spin = world Y or disk normal — **align spin with +Y** to match disk plane XZ):

1. Transform rayPos/rayDir into hole-i centered frame (rotate if needed; spin along disk normal = Y).
2. Convert to BL (r, θ, φ) approximately (Cartesian→BL for Kerr equatorial-friendly).
3. Integrate null geodesic one adaptive step (ds or dλ).
4. Capture if r ≤ r₊ (1+ε).
5. Transform back to world frame; add binary hole position.

**Adaptive step:** keep existing near-plane / near-photon refinement; remove `spinBendBoost` fudge when geodesic works.

**Performance budget:** keep Loop ≤ 80–96; if too heavy, lower default dpr path already helps.

**Verify:** single-mass limit (q→ extreme or hide secondary by massRatio) shows classic Kerr shadow asymmetry with χ; χ=0 recovers more circular shadow; no freeze (always `rayPos.addAssign`).

---

### Task 6 — Binary local-Kerr blending

**Objective:** Two holes without double-counting deflection into garbage.

**Files:**

- Modify: `shader/create.ts`, `shader/geodesic.ts`

**Strategy:**

```
w1 = soft weight from r1 (e.g. 1/r1^p)
w2 = soft weight from r2
if r1 < r2 * k: integrate only hole 1 Kerr
else if r2 < r1 * k: only hole 2
else: weighted mix of two one-step Kerr deflections OR step in stronger chart only
```

**Avoid:** naive sum of full Kerr accelerations from both (unstable).

**Verify:** separation 8 vs 18 distinct; both silhouettes + both disks; no chaotic noise between holes.

---

### Task 7 — Strip geometric palette & spin fudge; uniforms hygiene

**Objective:** Dead code gone; GPU only needs raw+required derived.

**Files:**

- Modify: `shader/disk.ts`, `shader/constants.ts`, `shader/types.ts`, `uniforms.ts`
- Delete unused geometric color if fully replaced

**CONFIG_SCALAR_KEYS:** keep derived horizons/ISCO (needed for capture/disk bounds) — they are **computed**, not user-set.  
Remove: presentation-only if any leaked; remove `spinBendBoost` usage.

**Verify:** `bun run check`; visual peach still holds.

---

### Task 8 — Host/skill/docs alignment

**Objective:** Skill + pitfalls describe true model and raw API.

**Files:**

- skill `sparras-black-hole` SKILL.md, `references/pitfalls.md`, `references/overrides.md`
- memory: update BH bullet if still claiming geometric fire as primary

**Document:**

- Local Kerr, not global binary Kerr
- Doppler g³
- T-driven color
- Raw knobs table only

**Verify:** docs match code.

---

### Task 9 — Integration verification matrix

| Check                    | How                             |
| ------------------------ | ------------------------------- |
| χ=0 vs χ=0.9             | Shadow / disk asymmetry changes |
| inclination 10° vs 80°   | Doppler contrast                |
| peakTemperature 30 vs 70 | Color shift without white       |
| separation 8 vs 18       | Gap visible; camera not ∝ sep   |
| massRatio 0.3            | Secondary smaller disk + H      |
| Off-screen               | frameloop demand; no crash      |
| Tests                    | `bun test tests`                |
| CI                       | `bun run check`                 |

---

## Suggested implementation order (session plan)

1. Task 0 baseline
2. Task 1 raw API docs
3. Task 2 disk-physics + tests
4. Task 3 T-color (biggest visual brand risk — careful)
5. Task 4 Doppler
6. Task 5 geodesic single-chart
7. Task 6 binary blend
8. Task 7 cleanup
9. Task 8–9 docs + matrix

Do **not** ship Task 5+6 in one untested dump — geodesic regressions look like “black balls” again.

---

## Open decisions (defaults if implementing without re-ask)

| Question                              | Default                                                                       |
| ------------------------------------- | ----------------------------------------------------------------------------- |
| One χ for both holes or χ₁, χ₂?       | Keep **one** `spin` for both (raw simplicity); optional later `spinSecondary` |
| Spin axis                             | Fixed **+Y** (disk normal)                                                    |
| Intensity Doppler power               | **g³**                                                                        |
| Color Doppler                         | Evaluate BB at **T·g**                                                        |
| Exact BL integration vs semi-analytic | Start **semi-analytic Kerr equatorial-friendly step**; full 3D BL if stable   |
| Global binary GR                      | **Out of scope**                                                              |

---

## Out of scope (YAGNI)

- Full GRMHD / radiative transfer codes
- Exact double-Kerr metric
- Stars/nebula
- Making stepSize/pixelSize public
- User-editable r₊ / ISCO / Ω

---

## Success criteria

- [ ] Public overrides = raw knobs only (documented + type-enforced)
- [ ] Disk color primarily from T(r) (+ Doppler-shifted T); no geometric-only hue
- [ ] Edge-on Doppler asymmetry physical and phase-locked to orbit
- [ ] Light near each hole follows local Kerr null geodesics (not 2M/r² fudge)
- [ ] Interstellar peach preserved (no white plate)
- [ ] `bun run check` + `bun test tests` green
- [ ] Hero still real-time on WebGPU at current dpr

---

## Execution handoff

Plan complete. Implement in order Task 1 → 9 (after optional Task 0 baseline). Prefer **one physics slice per PR/session** with visual hard-refresh between Task 3, 4, and 5.
