<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

## Tooling (Oxc)

- **Lint:** `bun run lint` / `bun run lint:fix` — [Oxlint](https://oxc.rs/docs/guide/usage/linter.html) (`.oxlintrc.json`, React + Next.js plugins)
- **Format:** `bun run fmt` / `bun run fmt:check` — [Oxfmt](https://oxc.rs/docs/guide/usage/formatter.html) (`.oxfmtrc.json`)
- **CI-style:** `bun run check` — format check then lint
- No ESLint or Prettier in this repo; use the **Oxc** VS Code extension (`oxc.oxc-vscode`) for format-on-save + LSP.

## Git hooks (Git 2.54+ config hooks)

Hooks are declared in `config/hooks.gitconfig` (`hook.oxc-pre-commit` → `pre-commit`). After clone / `bun install`, run **`bun run setup:git-hooks`** once (also runs on **`prepare`**) to `include` that file from `.git/config`. Hook commands use **`bun`** (no `sh` required — works from PowerShell on Windows).

On each commit: **Oxfmt** on staged sources, then **fmt:check** + **oxlint**. On each push: **`bun run build`**. Skip with `git commit --no-verify` / `git push --no-verify`.

`bun run setup:git-hooks` and **`prepare`** both run `scripts/setup-git-hooks.mjs` on purpose: **`prepare`** runs automatically after `bun install`; **`setup:git-hooks`** is the same idempotent script when you re-wire hooks without reinstalling.
