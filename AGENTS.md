<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

## Tooling (Oxc)

- **Lint:** `bun run lint` / `bun run lint:fix` — [Oxlint](https://oxc.rs/docs/guide/usage/linter.html) (`.oxlintrc.json`)
- **Format:** `bun run fmt` / `bun run fmt:check` — [Oxfmt](https://oxc.rs/docs/guide/usage/formatter.html) (`.oxfmtrc.json`)
- **CI-style:** `bun run check` — format check then lint
- Editor: **Oxc** VS Code extension (`oxc.oxc-vscode`)

## UI (shadcn)

- **Preset:** **`base-sera`** (Base UI + **sera** style), **neutral** base, **RSC** + Tailwind v4 (`components.json`)
- **Primitives:** `@base-ui/react` — use **`render`** prop (not Radix `asChild`) on triggers
- **Add components:** `bunx shadcn@latest add <name>` → `@/components/ui`
- **Utils:** `cn()` in `@/lib/utils`
- **Fonts:** Geist Sans + Geist Mono only (`next/font` in `app/layout.tsx`)

## i18n

- **Locales:** `en`, `sv` under `app/[locale]/`; default **`en`**
- **Detection:** `proxy.ts` reads **`Accept-Language`** (first matching `en` or `sv`), redirects `/` → `/en` or `/sv`
- **Copy:** `dictionaries/en.ts` and `dictionaries/sv.ts` — shape in `dictionaries/types.ts`; `getDictionary(locale)` / `getSiteMetadata(locale)` in `lib/i18n/get-dictionary.ts`
- **Switcher:** `components/language-switcher.tsx` (shadcn **Button** + **DropdownMenu**); drop into navbar later

## Theme

- **`next-themes`** via `components/theme-provider.tsx` — `attribute="class"`, **`defaultTheme="system"`**, `enableSystem`
- **Switcher:** `components/theme-switcher.tsx` — **system** / **light** / **dark** (copy under `dictionary.theme` in each locale file)

## Git hooks (Lefthook)

**Why Lefthook (not custom `.mjs` / Git 2.54 config / Husky+lint-staged):** common minimal setup for Bun + formatters in 2026 — one `lefthook.yml`, fast Go binary, good on Windows, no `sh`. Oxfmt on **staged** files only; **oxlint** on the whole tree via `bun run check` (oxlint is fast).

| Hook       | `lefthook.yml`                                   |
| ---------- | ------------------------------------------------ |
| pre-commit | `oxfmt --write {staged_files}` → `bun run check` |
| pre-push   | `bun run build`                                  |

After clone: **`bun install`** runs **`prepare`** → `lefthook install`. Manual: `bunx lefthook install`. Skip: `LEFTHOOK=0 git commit` or `git commit --no-verify`.
