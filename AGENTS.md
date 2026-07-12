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
- **Utils:** `cn()` in `@/lib/utils` (shadcn class merge only)
- **Icons:** Lucide only (no SVG icon assets in `public/`)
- **Fonts:** Geist (`--font-geist`) + Geist Mono + Geist Pixel in `app/layout.tsx`; navbar logo uses `font-pixel`; typeset uses `app/typeset.css` + `.typeset-docs`
- **Page chrome:** max-w-3xl bordered content column lives in `app/[locale]/layout.tsx` (`<main>`), not a wrapper component

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
- **Feature folders:** colocate (e.g. `components/navbar/`, `components/providers/`, `components/hero-section/`)
- **Hero section** (`@/components/hero-section`): portrait + `HeroBanner` (binary black hole) + name/role; details = `ProfileDetails`. Black-hole knobs: `defaultPhysics` in `components/black-hole/config.ts` (JSDoc on types).

## Theme

- **Provider:** `components/providers/theme-provider.tsx` — thin `next-themes` wrapper (`attribute="class"`, system / light / dark)
- **Hook:** `import { useTheme } from "next-themes"` (do not reimplement)
- **Types:** `ThemeChoice` / `ResolvedTheme` / `THEME_CHOICES` from `@/components/providers`
- **Switcher:** system / light / dark; labels passed in from server Navbar (not `getDictionary` on the client)
- **CSS tokens:** `useCssTokens` / `CSS_TOKENS` in `@/hooks` (tokens only — not mode types). Mirrors every custom property on `:root` / `.dark` in `app/globals.css`. Keep the list in sync when globals change.

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
