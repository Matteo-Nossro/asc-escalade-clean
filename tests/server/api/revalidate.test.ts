import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { createMockEvent, stubNitroGlobals } from '../../utils/nitro'

// Exemple de test de route server/api : server/api/revalidate.post.ts
// (webhook Storyblok -> purge du cache Netlify). Sert de modèle, ne couvre pas toute la route.

const purgeCache = vi.hoisted(() => vi.fn())
vi.mock('@netlify/functions', () => ({ purgeCache }))

// Sous l'environnement nuxt, useRuntimeConfig est réécrit en import (auto-import app) :
// on le simule via mockNuxtImport plutôt que par un global.
const runtimeConfig = vi.hoisted(() => ({ storyblokWebhookSecret: 'secret-de-test' }))
// La config réelle est conservée (le plugin routeur de Nuxt lit `app.baseURL`), on y ajoute le secret.
mockNuxtImport('useRuntimeConfig', original => () => ({ ...original(), ...runtimeConfig }))

type Handler = (event: unknown) => Promise<{ status: number, purged: string }>

const SECRET = 'secret-de-test'

async function loadHandler(): Promise<Handler> {
  const mod = await import('../../../server/api/revalidate.post')
  return mod.default as unknown as Handler
}

describe('POST /api/revalidate', () => {
  beforeEach(() => {
    vi.resetModules()
    purgeCache.mockReset()
    purgeCache.mockResolvedValue(undefined)
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    stubNitroGlobals()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('refuse (401) quand le header webhook-secret est absent', async () => {
    const handler = await loadHandler()
    await expect(handler(createMockEvent({ body: {} }))).rejects.toMatchObject({ statusCode: 401 })
    expect(purgeCache).not.toHaveBeenCalled()
  })

  it('refuse (401) quand le secret est incorrect', async () => {
    const handler = await loadHandler()
    const event = createMockEvent({ headers: { 'webhook-secret': 'mauvais' }, body: {} })
    await expect(handler(event)).rejects.toMatchObject({ statusCode: 401 })
    expect(purgeCache).not.toHaveBeenCalled()
  })

  it('purge le tag de la story et nettoie les slashes du full_slug', async () => {
    const handler = await loadHandler()
    const event = createMockEvent({
      headers: { 'Webhook-Secret': SECRET },
      body: { story: { full_slug: '/tarifs/' } },
    })

    const result = await handler(event)

    expect(purgeCache).toHaveBeenCalledTimes(1)
    expect(purgeCache).toHaveBeenCalledWith({ tags: ['storyblok-tarifs'] })
    expect(result).toEqual({ status: 202, purged: '/tarifs/' })
  })

  it('purge tout le cache quand le body ne contient aucun slug', async () => {
    const handler = await loadHandler()
    const event = createMockEvent({ headers: { 'webhook-secret': SECRET }, body: {} })

    const result = await handler(event)

    expect(purgeCache).toHaveBeenCalledTimes(1)
    expect(purgeCache).toHaveBeenCalledWith()
    expect(result).toEqual({ status: 202, purged: 'all' })
  })
})
