import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.test' })

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 15_000,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { outputFolder: 'playwright-report' }], ['list']],

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    // Setup global : connexion admin (runs once before all tests)
    {
      name: 'setup',
      testMatch: '**/setup/global.setup.ts',
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Réutiliser la session admin sauvegardée par global.setup
        storageState: '.auth/admin.json',
      },
      dependencies: ['setup'],
    },
  ],

  // Nuxt démarré automatiquement par Playwright avec les variables du Docker local.
  // Le serveur est réutilisé s'il tourne déjà (reuseExistingServer).
  // Nuxt démarré par Playwright. Les env vars ci-dessous sont injectées dans
  // le process Nuxt AVANT que Nuxt charge son .env — dotenv ne surcharge pas
  // ce qui est déjà dans process.env, donc le cloud Supabase du .env est ignoré.
  webServer: {
    command: 'npx nuxt dev',
    url: 'http://localhost:3000',
    reuseExistingServer: false,
    timeout: 60_000,
    env: {
      E2E: 'true',
      SUPABASE_URL: process.env.SUPABASE_URL!,
      SUPABASE_KEY: process.env.SUPABASE_KEY!,
      STORYBLOK_TOKEN: process.env.STORYBLOK_TOKEN!,
      STORYBLOK_PUBLIC_TOKEN: process.env.STORYBLOK_PUBLIC_TOKEN!,
      STORYBLOK_VERSION: process.env.STORYBLOK_VERSION!,
      STORYBLOK_REGION: process.env.STORYBLOK_REGION!,
      NODE_ENV: 'development',
    },
  },
})
