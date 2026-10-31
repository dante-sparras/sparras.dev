import { describe, expect, test } from "bun:test";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

const sourceRoot = resolve(import.meta.dir, "..");

function listFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    return statSync(path).isDirectory() ? listFiles(path) : [path];
  });
}

function resolveImport(specifier: string, importer: string) {
  const base = specifier.startsWith("@/")
    ? join(sourceRoot, specifier.slice(2))
    : specifier.startsWith(".")
      ? resolve(dirname(importer), specifier)
      : null;
  if (!base) return null;

  return [`${base}.ts`, `${base}.tsx`, join(base, "index.ts")].find(existsSync);
}

/** Every source file the routes in `src/app` can reach through imports. */
function findReachableFiles() {
  const pending = listFiles(join(sourceRoot, "app")).filter(
    (path) => /\.tsx?$/.test(path) && !path.endsWith(".test.ts"),
  );
  const reachable = new Set(pending);

  for (const file of pending) {
    const source = readFileSync(file, "utf8");
    for (const [, specifier] of source.matchAll(
      /(?:from|import\()\s*"([^"]+)"/g,
    )) {
      const imported = resolveImport(specifier, file);
      if (imported && !reachable.has(imported)) {
        reachable.add(imported);
        pending.push(imported);
      }
    }
  }

  return reachable;
}

function findExcludedComponents() {
  const stylesheet = readFileSync(join(sourceRoot, "app/globals.css"), "utf8");
  const names = stylesheet.match(/@source not "\.\.\/components\/ui\/\{(.+)\}/);
  return names?.[1].split(",") ?? [];
}

describe("Tailwind's list of unused components", () => {
  const reachable = findReachableFiles();
  const reachableComponents = [...reachable]
    .map((path) => relative(join(sourceRoot, "components/ui"), path))
    .filter((path) => !path.startsWith(".."))
    .map((path) => path.replace(/\.tsx$/, ""));

  test("leaves out no component the site uses", () => {
    const excluded = findExcludedComponents();

    expect(excluded.length).toBeGreaterThan(0);
    expect(
      excluded.filter((name) => reachableComponents.includes(name)),
    ).toEqual([]);
  });

  test("names real components", () => {
    const components = readdirSync(join(sourceRoot, "components/ui")).map(
      (name) => name.replace(/\.tsx$/, ""),
    );

    expect(
      findExcludedComponents().filter((name) => !components.includes(name)),
    ).toEqual([]);
  });
});
