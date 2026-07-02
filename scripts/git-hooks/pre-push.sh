#!/usr/bin/env sh
# Pre-push: production build must pass before refs leave this machine.
set -eu

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

if [ -d "${HOME}/.bun/bin" ]; then
  PATH="${HOME}/.bun/bin:${PATH}"
  export PATH
fi

if ! command -v bun >/dev/null 2>&1; then
  echo "pre-push: bun is not on PATH" >&2
  exit 1
fi

echo "pre-push: next build" >&2
bun run build