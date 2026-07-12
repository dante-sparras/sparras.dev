# Black-hole code-smell / bugfix plan

> **For Hermes:** Implement task-by-task in order; verify with `bun run fmt && bun run check` after batches.

**Goal:** Fix every issue from the R3F+WebGPU binary black-hole review (bugs, perf, DRY, magic, SOLID, docs drift) without changing the locked visual brand (Interstellar peach, no stars, physics-only public knobs, pixel art).

**Architecture:** Keep `config.ts` (physics) / `shader.ts` (TSL) / `black-hole.tsx` (host) / shared `components/three/*`. Prefer CPU-side invariants + named GPU constants; prune dead uniforms; single pixel-art path (DPR only).

**Tech stack:** Next 16, R3F, Three WebGPU/TSL, bun, oxlint/oxfmt.

---

## Files

- Modify: `components/black-hole/config.ts`
- Modify: `components/black-hole/shader.ts`
- Modify: `components/black-hole/black-hole.tsx`
- Modify: `components/black-hole/index.ts` (exports only if needed)
- Modify: `components/three/webgpu-canvas.tsx` (frameloop/visibility)
- Modify: `components/three/bloom.tsx` (stale star comments only)
- Patch skill: `sparras-black-hole` SKILL.md + `references/pitfalls.md`

---

### Task 1: Skydome radius vs zoom `maxDistance`

**Objective:** Camera always stays inside the inverted raymarch sphere.

**Files:** `black-hole.tsx`

**Approach:**

- `orbitMaxDistance = cameraDistance * 2.8`
- `skyRadius = max(80, orbitMaxDistance * 1.2)`
- Pass dynamic `args={[skyRadius, 24, 24]}` (or memoized geo args)
- `orbitMinDistance = max(4, cameraDistance * 0.45)` unchanged

**Verify:** With large `cameraDistance` / separation, zoom-out still fills the frame (no blank).

---

### Task 2: Single pixel-art path (no double `pixelSize`)

**Objective:** `pixelSize` means one thing: framebuffer cell size via DPR.

**Files:** `black-hole.tsx`, `shader.ts`, comments in skill

**Approach:**

- Keep `dpr ≈ 1/pixelSize` (clamped)
- Shader grid snap uses **1** framebuffer pixel (or ignore `pixelSize` for UV snap)
- Keep `pixelSize` uniform only if still needed; else remove from `CONFIG_SCALAR_KEYS` and use constant 1 in shader for Bayer cell = fragment
- Bayer/quantize still run on disk

**Decision:** Remove `pixelSize` from GPU uniforms; host-only for DPR. Shader treats each fragment as one pixel cell (`cell = floor(screenUV * res) + 0.5`).

---

### Task 3: Drop unread spin uniforms; document Schwarzschild bend

**Objective:** No dead GPU uploads; docs match bend model.

**Files:** `shader.ts`, `config.ts` JSDoc, skill

**Approach:**

- Remove `"spin"`, `"spinParameter"` from `CONFIG_SCALAR_KEYS`
- Keep `spin` / `spinParameter` on `BlackHoleConfig` for CPU Kerr scales / public API
- Comment: light bend is superposed weak-field Schwarzschild; χ only affects r₊ / photon / ISCO

---

### Task 4: Imperative camera sync on observer change

**Objective:** Changing inclination / cameraDistance moves the live camera.

**Files:** `black-hole.tsx`

**Approach:**

- In `Scene` or small `ObserverCamera` component: `useLayoutEffect` on `[inclination, cameraDistance, camera]`
- `camera.position.set(...cameraPositionFromObserver(...))`
- `camera.lookAt(0,0,0)`; `updateMatrixWorld`
- Do not fight OrbitControls every frame—only when config observer knobs change

---

### Task 5: Soft capture for budget-exhausted rays

**Objective:** Near-horizon unfinished marches don’t flash as escape.

**Files:** `shader.ts` end of march

**Approach:**

```
If not captured:
  If min(minR1,minR2) < ~2 * max(photon1,photon2): captured soft / silhouette boost
  Else: escaped = 1
```

---

### Task 6: Perf — hide-tab pause + optional frameloop prop

**Objective:** Don’t spin the sim when the tab is hidden; allow non-always frameloop.

**Files:** `webgpu-canvas.tsx`, `black-hole.tsx`

**Approach:**

- `WebGPUCanvas`: accept `frameloop` prop (default `"always"` for back-compat)
- BH `useFrame`: if `document.hidden`, skip `time` advance (and optionally skip sync)
- Keep always-on while visible so idle auto-rotate works (demand + invalidate is a larger change—defer full demand unless easy)

---

### Task 7: Geometric silhouette AA (drop `fwidth(minR)`)

**Objective:** Stable silhouettes under pixel art.

**Files:** `shader.ts`

**Approach:**

- `aa ≈ max(horizon * 0.04, camDist * tanHalf * (2/res.y) * k)` or simpler `horizon * 0.06` + photon soft width
- Remove `fwidth` import if unused

---

### Task 8: DRY — dual disk composite, clamps, mergePhysics

**Objective:** One composite path; single clamp helpers.

**Files:** `shader.ts`, `config.ts`

**Approach:**

- TSL helper `compositeMiniDisk(...)` for front-to-back
- `mergePhysics`: `{ ...base, ...overrides }`
- Shared `clampInclination`, reuse `clampSpin` in `buildBlackHoleConfig`

---

### Task 9: Named march/disk/tonemap constants

**Objective:** Kill raw magic; keep visual close to current.

**Files:** `shader.ts` top-level `const MARCH = …`, `DISK = …`, `GRADE = …`

**Include:** loop max, escapeR, dwell, OD scales, palette stops, tonemap numbers.

**Tonemap:** clamp chroma mix factor to ≤ 1 (was 1.12).

---

### Task 10: Per-hole disk scale height

**Objective:** q≠1 binaries get correct Hᵢ.

**Files:** `config.ts`, `shader.ts`, `CONFIG_SCALAR_KEYS`

**Approach:**

- Replace single `diskScaleHeight` with `diskScaleHeightPrimary` + `diskScaleHeightSecondary`
  - Hᵢ = max(0.05, aspect _ 0.5 _ (iscoᵢ + diskOuterRadiusM \* Mᵢ))
- Shader samples each disk with its H

---

### Task 11: Prune dead surface + skill/docs drift

**Objective:** API and skill match code.

**Files:** `index.ts` (optional keep `keplerOmega` as pure helper), skill + pitfalls, bloom comment

**Approach:**

- Keep `keplerOmega` exported (valid Kerr circular Ω helper) but note binary uses Newtonian √(M/d³)
- Keep full `KerrScales` (inner horizon / retrograde ISCO) for completeness
- Update skill color model: geometric fire + T brightness (match code)
- pitfalls: current paths (`config.ts`, `shader.ts`, `black-hole.tsx`), no stars, no BANNER_OVERRIDES requirement
- Bloom comments: remove “stars additive”

---

### Task 12: Types — UniformNode without `any` bag

**Objective:** Safer uniform bag; keep `@ts-nocheck` only if TSL still requires it.

**Files:** `shader.ts`, `black-hole.tsx`

**Approach:**

- `UniformNode<T = number> = { value: T }`
- `BlackHoleUniforms` uses Vector2/3 for camera fields
- Avoid `as unknown as` if constructable cleanly
- Leave `// @ts-nocheck` on shader if TSL Fn bodies still break tsc (document why)

---

### Task 13: Misc cleanup

**Objective:** Style DRY, Mtot invariant, hydration.

**Files:** `black-hole.tsx`, `shader.ts`

**Approach:**

- Shell keeps `imageRendering: pixelated`; TransparentClear only clear color/alpha (don’t re-set pixelated if shell owns it)
- `Mtot = M1 + M2` (trust CPU); keep `max(..., eps)` only if needed for div
- Drop `ready` useEffect gate if `ssr:false` dynamic already client-only; theme from `resolvedTheme` directly
- Shared `CAMERA_FOV = 48` constant for host + uniform init

---

### Task 14: Verify

```bash
export PATH="$HOME/.bun/bin:$PATH"
bun run fmt && bun run check
```

Manual: hero banner loads, binary orbits, zoom stays filled, light/dark dim, pixelated look ~same chunkiness as before (DPR-only).

---

## Risks

- Visual delta from tonemap clamp and pixel path change — compare hard-refresh
- Per-hole H may brighten/dim secondary when q≠1 (correct physically)
- Removing pixelSize uniform requires host/shader key list sync

## Out of scope (YAGNI)

- Full Kerr geodesic integrator
- Real relativistic beaming
- Demand frameloop + invalidate plumbing for OrbitControls (partial only)
- Bloom re-integration into BH
