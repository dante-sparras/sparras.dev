# Black-hole physics tests

All pure CPU calculations for the banner. No WebGPU.

```bash
bun test tests/black-hole
# or whole suite
bun test tests
```

| File                   | Coverage                                                                 |
| ---------------------- | ------------------------------------------------------------------------ |
| `kerr.test.ts`         | clampSpin, photon sphere, ISCO, kerrScales, keplerΩ                      |
| `binary.test.ts`       | Ω=√(M/d³), arms, phase positions                                         |
| `disk-physics.test.ts` | T(r), β, g_grav, g_SR, g_disk, g³ intensity                              |
| `blackbody.test.ts`    | temperatureHeat, T→peach RGB, no white plate                             |
| `geodesic.test.ts`     | local Kerr null step, chart weights                                      |
| `config.test.ts`       | buildBlackHoleConfig clamps/derived, camera, skydome, CONFIG_SCALAR_KEYS |

After any physics change, run `bun test tests/black-hole` before trusting visuals.
