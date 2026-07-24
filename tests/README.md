# Tests

Root test suite for sparras.dev.

## Layout

```
tests/
  i18n/             Pure locale + path helpers
  tsconfig.json     Bun types for this folder (IntelliSense)
```

## Commands

```bash
bun test tests
# or
bun run test
```

## What belongs here

- Pure modules (no React / no Next request runtime) — e.g. `lib/i18n/locale-core`
- Prefer asserting external behaviour of a module interface, not internal structure

## `bun:test` IntelliSense

If the editor reports `Cannot find module 'bun:test'`:

1. Ensure `@types/bun` is installed: `bun add -d @types/bun`
2. Root has `bun-env.d.ts` with `/// <reference types="bun" />`
3. This folder has `tsconfig.json` with `"types": ["bun"]`
4. Reload the TS server (**TypeScript: Restart TS Server**)
