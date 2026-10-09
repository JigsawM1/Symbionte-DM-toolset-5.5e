import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

// Suite aislada de simulación, ejecutada junto a las regresiones unitarias en CI.
export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('../src', import.meta.url)) } },
  test: { include: ['scripts/simulacion-sync-6pj-20monstruos.ts'] },
});
