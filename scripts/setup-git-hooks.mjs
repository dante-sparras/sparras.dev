/**
 * Register Git 2.54+ config-based hooks via include.path (cross-platform).
 * @see config/hooks.gitconfig
 */
import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const INCLUDE_PATH = "../config/hooks.gitconfig";

function git(args) {
  return execFileSync("git", args, {
    cwd: ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

try {
  git(["rev-parse", "--git-dir"]);
} catch {
  console.error("setup-git-hooks: not inside a git repository");
  process.exit(1);
}

let current = "";
try {
  current = git(["config", "--local", "--get-all", "include.path"]);
} catch {
  current = "";
}

const lines = current.split(/\r?\n/).filter(Boolean);
if (lines.includes(INCLUDE_PATH)) {
  process.exit(0);
}

const result = spawnSync(
  "git",
  ["config", "--local", "--add", "include.path", INCLUDE_PATH],
  { cwd: ROOT, stdio: "inherit" },
);

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

console.log(`setup-git-hooks: registered ${INCLUDE_PATH} in .git/config`);
