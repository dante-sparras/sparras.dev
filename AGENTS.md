<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

## Tooling (Oxc)

- **Lint:** `bun run lint` / `bun run lint:fix` — [Oxlint](https://oxc.rs/docs/guide/usage/linter.html) (`.oxlintrc.json`)
- **Format:** `bun run fmt` / `bun run fmt:check` — [Oxfmt](https://oxc.rs/docs/guide/usage/formatter.html) (`.oxfmtrc.json`)
- **CI-style:** `bun run check` — format check + lint + `tsc --noEmit`
- Editor: **Oxc** VS Code extension (`oxc.oxc-vscode`)

## UI (shadcn)

- **Preset:** **`base-sera`** (Base UI + **sera** style), **neutral** base, **RSC** + Tailwind v4 (`components.json`)
- **Primitives:** `@base-ui/react` — use **`render`** prop (not Radix `asChild`) on triggers
- **Add components:** `bunx shadcn@latest add <name>` → `@/components/ui`
- **Utils:** `cn()`, hex helpers in `@/lib/utils`
- **Icons:** Lucide only (no SVG icon assets in `public/`)
- **Fonts:** Geist (`--font-geist`) + Geist Mono + Geist Pixel in `app/layout.tsx`; navbar logo uses `font-pixel`; typeset uses `app/typeset.css` + `.typeset-docs`
- **Page chrome:** `components/site-main.tsx` for the max-w-3xl bordered column

## i18n

- **Locales:** `en`, `sv` under `app/[locale]/`; default **`en`**
- **Detection:** `proxy.ts` + `Accept-Language` → `/en` or `/sv` (uses `pathnameHasLocale` / `localeFromAcceptLanguage` from `@/lib/i18n`)
- **Barrel:** import from `@/lib/i18n`
  - `locale.ts` — locale set, Accept-Language, path helpers, `requireLocale`, section page helpers
  - `dictionary.ts` — `getDictionary` / `getSiteMetadata`
  - `section-page.tsx` — `createSectionPage` (placeholder routes only)
  - `dictionaries/` — en/sv copy
- **Navbar chrome:** resolve copy in the **server** `Navbar`; pass labels/links as props into client switchers/menu (do **not** call `getDictionary` in client leaves)
- **Section pages:** `createSectionPage("about" | …)` for about/work/resume/contact
- **Site identity:** `lib/constants.ts` (`SITE_URL`, `SITE_AUTHOR`, `SITE_CONTACT`, …)

## Layout

- **`components/navbar/`** — header, mobile menu, theme + language switchers, `config.ts` routes; public export is **`Navbar` only** (`@/components/navbar`)
- **Navbar chrome (do not regress):** logo **alone** on the far left; nav links in a **right cluster immediately before** theme + language switchers, with a **vertical separator** between links and switchers — **never** place primary links beside the logo
- **Resume:** on-site page only — **not** a navbar download button
- **Naming:** short names (`Navbar`, `NavbarMenu`); theme/language triggers **icon-only**; logo initials in **Geist Pixel Square**
- **Mobile:** `navbar-menu.tsx` — shadcn **Sheet** (`md:hidden`)
- **Feature folders:** colocate (e.g. `components/black-hole/`, `components/navbar/`, `components/providers/`)

## Three.js / WebGPU (React Three Fiber)

- **Stack:** `three` (WebGPU + TSL) + `@react-three/fiber` + `@react-three/drei`
- **Shared kit** (`@/components/three` — 4 files):
  - `WebGPUCanvas` — official R3F async `WebGPURenderer(props)` + `init()`, `extend(THREE)`, error boundary, NoToneMapping/LinearSRGB
  - `Bloom` — TSL RenderPipeline bloom (re-entrancy / depth guard)
  - `CameraLookAt` + `IdleOrbit` — in `camera.tsx` (aim + OrbitControls idle spin)
- **Feature scenes** live under `components/<feature>/` as R3F children of `WebGPUCanvas`
- **Black hole** (`@/components/black-hole`):
  - Public: `BlackHole` / `BlackHoleBanner` + `overrides?: BlackHoleOverrides` (small stable knob set)
  - Private: `constants`, `mesh`, `config` (full bag internal), `shader/*` (noise · blackbody · stars · nebula · disk · march)
- **Next SSR:** Server Components import `BlackHoleBanner` only. Never use `dynamic(..., { ssr: false })` inside RSCs (Next 16).
- Never import `three` / R3F into Server Components. Site void hex via raw color path (`starBackgroundColor`).

## Theme

- **Provider:** `components/providers/theme-provider.tsx` — class strategy on `<html>`, system / light / dark (`defaultTheme`, `disableTransitionOnChange` only — no next-themes parity props)
- **FOUC script:** `THEME_INIT_SCRIPT` in `app/layout.tsx` `<head>` (server-rendered — not a client-component script)
- **Switcher:** system / light / dark; labels passed in from server Navbar (not `getDictionary` on the client)
- **React:** `useTheme()` from `@/components/providers` (`resolvedTheme`)
- **CSS tokens:** `useCssTokens` / `CSS_TOKENS` in `@/hooks` — mirrors every custom property on `:root` / `.dark` in `app/globals.css` (one `getComputedStyle` pass; re-reads on theme change). Keep the list in sync when globals change.
- **WebGPU colors:** pass full token bag into feature config (e.g. black hole picks what it needs) — config modules do not read the DOM
- Do **not** reintroduce `next-themes` (React 19 / Next 16 client `<script>` warning)

## Quality checks (no Lefthook / Husky / custom install scripts)

**How popular repos usually do it:**

1. **CI (GitHub Actions)** — hard guarantee on every push/PR (cannot skip without admin rights)
2. **Local git hooks** — convenience; always optional (`--no-verify`)
3. Or **no local hooks** and rely on CI only

This project uses (1) + (2):

| Layer                                    | What runs                         | Guarantee                      |
| ---------------------------------------- | --------------------------------- | ------------------------------ |
| **CI** (`.github/workflows/ci.yml`)      | `bun run check` + `bun run build` | **Hard** — blocks merge if red |
| Local pre-commit (`githooks/pre-commit`) | staged oxfmt → full check         | Soft — skippable               |
| Local pre-push (`githooks/pre-push`)     | build                             | Soft — skippable               |

### Making sure `core.hooksPath` is set

`prepare` alone is **not** enough (`--ignore-scripts`, partial clones, etc.).  
So **`hooks:enable`** re-applies `git config core.hooksPath githooks` whenever you run common scripts:

- `bun install` → `prepare` → `hooks:enable`
- `bun run dev` / `check` / `build` / `precommit` / `prepush` → all call `hooks:enable` first

So the first normal `bun run dev` or `bun run check` wires hooks even if `prepare` never ran.

Skip local hooks: `git commit --no-verify` / `git push --no-verify`.  
You still cannot skip **CI** without changing branch protection.
