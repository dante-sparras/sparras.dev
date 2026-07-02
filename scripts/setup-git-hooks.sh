#!/usr/bin/env sh
# Wire Git 2.54+ config-based hooks (see git-hook(1)).
set -eu

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "${ROOT}"

if ! git rev-parse --git-dir >/dev/null 2>&1; then
  echo "setup-git-hooks: not inside a git repository" >&2
  exit 1
fi

INCLUDE_PATH="../config/hooks.gitconfig"
CURRENT="$(git config --local --get-all include.path 2>/dev/null || true)"

if printf '%s\n' "${CURRENT}" | grep -Fxq "${INCLUDE_PATH}"; then
  exit 0
fi

git config --local --add include.path "${INCLUDE_PATH}"
echo "setup-git-hooks: registered ${INCLUDE_PATH} in .git/config"