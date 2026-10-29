import { fileURLToPath } from 'node:url'
import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  // `#supabase/server` est un alias Nitro que Vite ne résout pas : on le pointe vers un stub,
  // que chaque test remplace par vi.mock('#supabase/server', …)
  resolve: {
    alias: {
      '#supabase/server': fileURLToPath(new URL('./tests/utils/supabase-server-stub.ts', import.meta.url)),
    },
  },
  test: {
    environment: 'nuxt',
    environmentOptions: {
      nuxt: {
        mock: {
          intersectionObserver: true,
          indexedDb: true,
        },
      },
    },
    globals: true,
    include: ['tests/**/*.test.ts'],
    exclude: ['e2e/**', 'node_modules/**', '.claude/worktrees/**', '.output/**'],
    coverage: {
      reporter: ['text', 'html'],
    },
  },
})
