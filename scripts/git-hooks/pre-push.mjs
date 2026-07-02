/**
 * Pre-push: production build must pass.
 */
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

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

const ROOT = repoRoot();
process.chdir(ROOT);
withBunOnPath();

console.error("pre-push: next build");
const result = spawnSync("bun", ["run", "build"], {
  cwd: ROOT,
  stdio: "inherit",
  shell: process.platform === "win32",
});

process.exit(result.status === 0 ? 0 : (result.status ?? 1));
