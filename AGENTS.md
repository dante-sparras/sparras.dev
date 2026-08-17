# AGENTS.md

Guidance for anyone (human or agent) working in this repository.

## Project overview

This is a single Next.js 16 (App Router, Turbopack, React Compiler) personal website. **Bun** is the package manager and script runner (see `bun.lock`); do not use npm/yarn/pnpm.

## Setup

```bash
bun install
```

## Common commands

Scripts live in `package.json`:

| Command | Purpose |
| --- | --- |
| `bun dev` | Dev server (Turbopack, hot reload) at `http://localhost:3000` |
| `bun run build` | Production build |
| `bun start` | Serve the production build |
| `bun lint` | Biome check |
| `bun format` | Biome format (writes changes) |

## Gotchas

- `build` and `dev` both write to `.next`. Stop the dev server before running `build` to avoid clobbering its state, then restart `bun dev` if you still need it.
- `bun lint` currently reports pre-existing Biome errors/warnings (mostly in generated `src/components/ui/*` shadcn components). A non-zero exit is expected and is not necessarily caused by your changes — check the diagnostics before treating it as a regression.
- There is no test suite in this repo.
- The site is dark-mode only (`scheme-dark` is hardcoded in `src/app/layout.tsx`); there is intentionally no theme toggle.
