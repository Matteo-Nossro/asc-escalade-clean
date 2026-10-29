// Relancer vite : `E2E_SKIP_BUILD=1 npx playwright test` réutilise le build `.output/` existant (Git Bash ; sans cross-env).
// Le build écrase `.nuxt`/`.output` : ne pas le lancer pendant un `nuxt dev`.
import { existsSync } from 'node:fs'
import { defineConfig, devices } from '@playwright/test'

// Tests e2e en lecture seule : build de production + `nuxt preview` en HTTP (port 3100).
// Pas de `nuxt dev` (HTTPS + mkcert). Les variables (.env) sont lues par nuxt.config.ts
// au build ; le preview recharge .env pour le runtime.
const PORT = 3100
const baseURL = `http://localhost:${PORT}`

const skipBuild = process.env.E2E_SKIP_BUILD === '1'
if (skipBuild && !existsSync('.output/server/index.mjs')) {
  throw new Error(
    'E2E_SKIP_BUILD=1 mais `.output/server/index.mjs` est absent : lancer d\'abord un `npm run test:e2e` complet (ou `npm run build`).',
  )
}
const previewCommand = `npx nuxt preview --port ${PORT}`

export default defineConfig({
  testDir: './e2e',
  workers: 1,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: skipBuild ? previewCommand : `npm run build && ${previewCommand}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 10 * 60_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
})
