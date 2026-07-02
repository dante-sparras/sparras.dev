/**
 * Pre-commit: Oxfmt staged sources, then fmt:check + oxlint.
 */
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const EXT_RE = /\.(ts|tsx|js|jsx|mjs|cjs|json|jsonc|css|md|mdx)$/i;

function repoRoot() {
  return execFileSync("git", ["rev-parse", "--show-toplevel"], {
    encoding: "utf8",
  }).trim();
}

function withBunOnPath() {
  const home = os.homedir();
  const bunBin = path.join(home, ".bun", "bin");
  if (fs.existsSync(bunBin)) {
    const sep = process.platform === "win32" ? ";" : ":";
    process.env.PATH = `${bunBin}${sep}${process.env.PATH ?? ""}`;
  }
}

function run(cmd, args, label) {
  if (label) {
    console.error(label);
  }
  const result = spawnSync(cmd, args, {
    cwd: ROOT,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

const ROOT = repoRoot();
process.chdir(ROOT);
withBunOnPath();

const staged = execFileSync(
  "git",
  ["diff", "--cached", "--name-only", "--diff-filter=ACMR"],
  { encoding: "utf8", cwd: ROOT },
)
  .split(/\r?\n/)
  .map((f) => f.trim())
  .filter((f) => f && EXT_RE.test(f));

for (const file of staged) {
  const full = path.join(ROOT, file);
  if (!fs.existsSync(full)) {
    continue;
  }
  run("bunx", ["oxfmt", "--write", file], undefined);
  run("git", ["add", "--", file], undefined);
}

run("bun", ["run", "fmt:check"], "pre-commit: oxfmt --check");
run("bun", ["run", "lint"], "pre-commit: oxlint");
