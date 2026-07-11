# sparras.dev

Personal site for **Dante Sparrås** — Next.js App Router, bilingual (EN/SV), dark/light theme, WebGPU black hole banner.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** + **shadcn** (`base-sera` / Base UI)
- **next-themes**, **Lucide**, **Three.js WebGPU** (black hole)
- **Bun**, **Oxfmt** / **Oxlint**, **Lefthook**

## Develop

```bash
bun install
bun dev
```

Open [http://localhost:3000](http://localhost:3000). Locale is chosen from `Accept-Language` (`en` / `sv`).

```bash
bun run check   # format + lint
bun run build   # production build
```

## Layout

| Path                     | Role                                     |
| ------------------------ | ---------------------------------------- |
| `app/`                   | Routes, layouts, `globals.css`           |
| `components/navbar/`     | Header, menu, theme + language switchers |
| `components/black-hole/` | WebGPU black hole island                 |
| `components/providers/`  | Theme provider                           |
| `components/ui/`         | shadcn primitives                        |
| `lib/i18n/`              | Locales, dictionaries, metadata          |
| `lib/weather/`           | Open-Meteo (Norrköping)                  |
| `lib/utils.ts`           | Shared pure helpers (`cn`, hex, …)       |
| `public/images/`         | Static media (e.g. portrait)             |

## Conventions

See **`AGENTS.md`** for agent/editor rules (navbar chrome, fonts, i18n, hooks).
