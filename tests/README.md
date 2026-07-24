# Tests

Root test suite for sparras.dev.

## Layout

```
tests/
  tsconfig.json     Bun types for this folder (IntelliSense)
```

## Commands

```bash
bun test tests
# or
bun run test   # uses --pass-with-no-tests when the suite is empty
```

## `bun:test` IntelliSense

If the editor reports `Cannot find module 'bun:test'`:

1. Ensure `@types/bun` is installed: `bun add -d @types/bun`
2. Root has `bun-env.d.ts` with `/// <reference types="bun" />`
3. This folder has `tsconfig.json` with `"types": ["bun"]`
4. Reload the TS server (**TypeScript: Restart TS Server**)
