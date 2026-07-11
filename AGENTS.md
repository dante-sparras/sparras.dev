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
- **Detection:** `proxy.ts` + `Accept-Language` → `/en` or `/sv`
- **Barrel:** import from `@/lib/i18n` (config, dictionary, locale helpers, section factory)
- **Copy:** `lib/i18n/dictionaries/`; `getDictionary` / `getSiteMetadata`
- **Section pages:** `createSectionPage("about" | …)` for about/work/resume/contact
- **Site identity:** `lib/constants.ts` (`SITE_URL`, `SITE_CONTACT`, …)
- **Switchers:** `components/navbar/language-switcher.tsx`, `theme-switcher.tsx`

## Layout

- **`components/navbar/`** — header, mobile menu, theme + language switchers, `config.ts` routes
- **Navbar chrome (do not regress):** logo **alone** on the far left; nav links in a **right cluster immediately before** theme + language switchers, with a **vertical separator** between links and switchers — **never** place primary links beside the logo
- **Resume:** on-site page only — **not** a navbar download button
- **Naming:** short names (`Navbar`, `NavbarMenu`); theme/language triggers **icon-only**; logo initials in **Geist Pixel Square**
- **Mobile:** `navbar-menu.tsx` — shadcn **Sheet** (`md:hidden`)
- **Feature folders:** colocate (e.g. `components/black-hole/`, `components/navbar/`, `components/providers/`)

## Theme

- **`next-themes`** via `components/providers/theme-provider.tsx` — `attribute="class"`, **`defaultTheme="system"`**, `enableSystem`
- **Switcher:** system / light / dark (copy under `dictionary.theme`)

## Quality checks (no Lefthook / Husky / custom install scripts)

**How popular repos usually do it:**

1. **CI (GitHub Actions)** — source of truth on every push/PR
2. **Optional local git hooks** — plain shell files in a tracked folder (`githooks/`), enabled with `git config core.hooksPath githooks`
3. Or **no local hooks** and rely on CI only

This project uses (1) + (2):

| Layer                                    | What runs                                      |
| ---------------------------------------- | ---------------------------------------------- |
| Local pre-commit (`githooks/pre-commit`) | `lint-staged` (oxfmt staged) → `bun run check` |
| Local pre-push (`githooks/pre-push`)     | `bun run build`                                |
| CI (`.github/workflows/ci.yml`)          | `bun run check` + `bun run build`              |

After clone: `bun install` runs `prepare` → `git config core.hooksPath githooks`.  
Skip local hooks: `git commit --no-verify` / `git push --no-verify`.
