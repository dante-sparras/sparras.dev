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

`config/hooks.gitconfig` points **`pre-commit`** / **`pre-push`** at **`bun run git:pre-commit`** and **`bun run git:pre-push`** (logic lives in `package.json`, not hook scripts).

| Script           | Behavior                                               |
| ---------------- | ------------------------------------------------------ |
| `git:pre-commit` | **lint-staged** (Oxfmt staged files) → `bun run check` |
| `git:pre-push`   | `bun run build`                                        |

Run **`bun run setup:git-hooks`** after clone (also runs on **`prepare`** via `scripts/setup-git-hooks.mjs`). Skip hooks: `git commit --no-verify` / `git push --no-verify`.
