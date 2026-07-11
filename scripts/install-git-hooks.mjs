/**
 * Install lightweight git hooks (no lefthook/husky).
 * pre-commit -> bun run precommit (lint-staged + check)
 * pre-push   -> bun run prepush (build)
 *
 * Skip: SKIP_GIT_HOOKS=1 git commit
 */
import { chmodSync, existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const hooksDir = join(process.cwd(), ".git", "hooks");
if (!existsSync(hooksDir)) {
  console.log("[hooks] no .git/hooks - skip install");
  process.exit(0);
}

const header = `#!/bin/sh
# Installed by scripts/install-git-hooks.mjs - do not edit by hand.
if [ "$SKIP_GIT_HOOKS" = "1" ]; then
  echo "[hooks] SKIP_GIT_HOOKS=1 - skipping"
  exit 0
fi
`;

const hooks = {
  "pre-commit": `${header}bun run precommit\n`,
  "pre-push": `${header}bun run prepush\n`,
};

for (const [name, body] of Object.entries(hooks)) {
  const path = join(hooksDir, name);
  writeFileSync(path, body, "utf8");
  try {
    chmodSync(path, 0o755);
  } catch {
    // Windows may ignore chmod; git still runs hooks
  }
  console.log(`[hooks] installed ${name}`);
}
