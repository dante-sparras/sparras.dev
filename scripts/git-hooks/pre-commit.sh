#!/usr/bin/env sh
# Pre-commit: format staged sources with Oxfmt, then Oxlint (fail closed).
set -eu

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

if [ -d "${HOME}/.bun/bin" ]; then
  PATH="${HOME}/.bun/bin:${PATH}"
  export PATH
fi

if ! command -v bun >/dev/null 2>&1; then
  echo "pre-commit: bun is not on PATH (install bun or add ~/.bun/bin)" >&2
  exit 1
fi

STAGED="$(git diff --cached --name-only --diff-filter=ACMR | grep -E '\.(ts|tsx|js|jsx|mjs|cjs|json|jsonc|css|md|mdx)$' || true)"

if [ -n "${STAGED}" ]; then
  # Re-format staged files and re-stage so the commit includes fixes.
  printf '%s\n' "${STAGED}" | while IFS= read -r file; do
    [ -n "${file}" ] || continue
    [ -f "${file}" ] || continue
    bunx oxfmt --write "${file}"
    git add -- "${file}"
  done
fi

echo "pre-commit: oxfmt --check" >&2
bun run fmt:check

echo "pre-commit: oxlint" >&2
bun run lint