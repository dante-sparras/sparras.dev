# Tests

Root test suite for sparras.dev.

## Layout

```
tests/
  black-hole/       pure Kerr / disk / Doppler / config (no WebGPU)
  tsconfig.json     Bun types for this folder (IntelliSense)
```

## Commands

```bash
bun test tests
bun test tests/black-hole
# or
bun run test
```

After any physics change: **`bun test tests/black-hole`** first.

## `bun:test` IntelliSense

If the editor reports `Cannot find module 'bun:test'`:

1. Ensure `@types/bun` is installed: `bun add -d @types/bun`
2. Root has `bun-env.d.ts` with `/// <reference types="bun" />`
3. This folder has `tsconfig.json` with `"types": ["bun"]`
4. Reload the TS server (**TypeScript: Restart TS Server**)
