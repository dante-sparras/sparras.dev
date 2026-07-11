# sparras.dev

Personal site for **Dante Sparrås** — Next.js App Router, bilingual (EN/SV), dark/light theme, WebGPU black hole banner.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** + **shadcn** (`base-sera` / Base UI)
- **class theme provider**, **Lucide**, **R3F + Three WebGPU** (black hole)
- **Bun**, **Oxfmt** / **Oxlint**, **lint-staged** + plain `githooks/` + GitHub Actions CI

## Develop

```bash
bun install
bun dev
```

Open [http://localhost:3000](http://localhost:3000). Locale is chosen from `Accept-Language` (`en` / `sv`).

```bash
bun run check   # format + lint + typecheck
bun run build   # production build
```

## Layout

| Path                     | Role                                                                 |
| ------------------------ | -------------------------------------------------------------------- |
| `app/`                   | Routes, layouts, `globals.css`                                       |
| `components/navbar/`     | Header, menu, theme + language switchers                             |
| `components/three/`      | Shared R3F + WebGPU kit (`WebGPUCanvas`, bloom, camera/orbit)        |
| `components/black-hole/` | Profile black hole (feature scene on the shared kit)                 |
| `components/providers/`  | Theme provider                                                       |
| `components/ui/`         | shadcn primitives                                                    |
| `lib/i18n/`              | Locale + paths (`locale.ts`), dictionaries/metadata, section factory |
| `lib/constants.ts`       | Site URL / author / contact                                          |
| `lib/theme.ts`           | Full shadcn/globals CSS tokens (`CSS_TOKENS`, `readCssTokens`)       |
| `hooks/`                 | Client hooks (`useCssTokens`)                                        |
| `lib/utils.ts`           | Shared pure helpers (`cn`, hex parse, …)                             |
| `app/typeset.css`        | shadcn/typeset (apply with `typeset typeset-docs` when needed)       |
| `public/images/`         | Static media (e.g. portrait)                                         |
| `githooks/`              | Local pre-commit / pre-push shell hooks                              |
| `.github/workflows/`     | CI                                                                   |

## Conventions

See **`AGENTS.md`** for agent/editor rules (navbar chrome, fonts, i18n, hooks).
