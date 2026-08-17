# AGENTS.md

## Cursor Cloud specific instructions

This is a single Next.js 16 (App Router, Turbopack, React Compiler) personal website. **Bun** is the package manager and script runner (see `bun.lock`); do not use npm/yarn/pnpm.

- Bun is preinstalled in the environment at `~/.bun/bin/bun` and on `PATH` for login shells. If a non-login shell can't find `bun`, use the full path `~/.bun/bin/bun`.
- Dependencies are refreshed automatically on startup via the update script (`bun install --frozen-lockfile`). No manual install is normally needed.
- Run the dev server with `bun dev` (Next.js on `http://localhost:3000`). This is a long-running foreground process — run it in a dedicated tmux terminal, not in `install`/`start`.
- Standard scripts live in `package.json`:
  - `bun dev` — dev server (Turbopack, hot reload).
  - `bun run build` — production build. Note: `build` and `dev` both write to `.next`; stop the dev server before running `build` to avoid clobbering its state, then restart `bun dev`.
  - `bun start` — serve the production build.
  - `bun lint` — Biome check. The current codebase has pre-existing Biome lint errors/warnings (mostly in generated `src/components/ui/*` shadcn components), so a non-zero exit from `bun lint` is expected and is not caused by environment setup.
  - `bun format` — Biome format (writes changes).
- There is no test suite in this repo.
- The site is dark-mode only (`scheme-dark` is hardcoded in `src/app/layout.tsx`); there is intentionally no theme toggle.
