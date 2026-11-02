import { vi } from 'vitest'

/**
 * Utilitaires pour tester un handler `server/api` sans build ni `$fetch`.
 *
 * Les routes Nitro utilisent des auto-imports (`defineEventHandler`, `createError`,
 * `readBody`, `getHeader`, `useRuntimeConfig`...) qui n'existent pas sous Vitest :
 * on les pose en globaux avant d'importer la route.
 *
 * `useRuntimeConfig` n'est pas posé ici : sous l'environnement `nuxt` (vitest.config.ts), il est
 * réécrit en import par le plugin Nuxt et un global serait ignoré. Simuler la config avec
 * `mockNuxtImport('useRuntimeConfig', ...)` (cf. tests/server/api/revalidate.test.ts).
 *
 * Usage :
 *   stubNitroGlobals()
 *   const handler = (await import('../../../server/api/xxx.post')).default
 *   await handler(createMockEvent({ headers: {...}, body: {...} }))
 */

export interface MockEvent {
  __mock: true
  headers: Record<string, string>
  body: unknown
  query: Record<string, string>
  params: Record<string, string>
}

export interface MockEventInit {
  headers?: Record<string, string>
  body?: unknown
  query?: Record<string, string>
  params?: Record<string, string>
}

/** Fabrique un event simulé. Les noms de headers sont normalisés en minuscules. */
export function createMockEvent(init: MockEventInit = {}): MockEvent {
  const headers: Record<string, string> = {}
  for (const [k, v] of Object.entries(init.headers ?? {})) headers[k.toLowerCase()] = v
  return {
    __mock: true,
    headers,
    body: init.body,
    query: init.query ?? {},
    params: init.params ?? {},
  }
}

/** Erreur équivalente à celle de h3 (`createError`), assez fidèle pour les assertions. */
export class MockH3Error extends Error {
  statusCode: number
  statusMessage?: string
  data?: unknown
  constructor(input: { statusCode?: number, statusMessage?: string, message?: string, data?: unknown }) {
    super(input.message ?? input.statusMessage ?? 'Error')
    this.statusCode = input.statusCode ?? 500
    this.statusMessage = input.statusMessage
    this.data = input.data
  }
}

/**
 * Pose les globaux Nitro/h3 (hors `useRuntimeConfig`, voir l'en-tête du fichier).
 * À appeler avant l'import de la route ; `vi.unstubAllGlobals()` (ou `unstubGlobals: true`) les retire.
 */
export function stubNitroGlobals() {
  vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
  vi.stubGlobal('createError', (input: ConstructorParameters<typeof MockH3Error>[0]) => new MockH3Error(input))
  vi.stubGlobal('readBody', async (event: MockEvent) => event.body)
  vi.stubGlobal('getHeader', (event: MockEvent, name: string) => event.headers[name.toLowerCase()])
  vi.stubGlobal('getQuery', (event: MockEvent) => event.query)
  vi.stubGlobal('getRouterParam', (event: MockEvent, name: string) => event.params[name])
}
