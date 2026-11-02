// Backlog Q14 : useEvents suit la règle de usePosts (?_storyblok → draft, sinon STORYBLOK_VERSION)

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useEvents } from '~/composables/useEvents'

const { get, query } = vi.hoisted(() => ({
  get: vi.fn(),
  query: { value: {} as Record<string, string> },
}))

mockNuxtImport('useStoryblokApi', () => () => ({ get }))
mockNuxtImport('useRoute', () => () => ({ query: query.value }))

// useRuntimeConfig ne peut pas être mocké (le router Nuxt en dépend) : on modifie la vraie config
const setStoryblokVersion = (v: string | undefined) => {
  useRuntimeConfig().public.storyblokVersion = v as string
}

beforeEach(() => {
  get.mockReset()
  get.mockResolvedValue({ data: { stories: [] } })
  query.value = {}
  setStoryblokVersion(undefined)
})

describe('useEvents — version Storyblok', () => {
  it('site public sans STORYBLOK_VERSION : ne demande que les stories publiées', async () => {
    await useEvents().getEvents()
    expect(get).toHaveBeenCalledWith('cdn/stories', expect.objectContaining({ version: 'published' }))
  })

  it('site public avec STORYBLOK_VERSION=published : stories publiées', async () => {
    setStoryblokVersion('published')
    await useEvents().getEvents()
    expect(get).toHaveBeenCalledWith('cdn/stories', expect.objectContaining({ version: 'published' }))
  })

  it('sans ?_storyblok, STORYBLOK_VERSION=draft est respecté (comme usePosts)', async () => {
    setStoryblokVersion('draft')
    await useEvents().getEvents()
    expect(get).toHaveBeenCalledWith('cdn/stories', expect.objectContaining({ version: 'draft' }))
  })

  it('prévisualisation ?_storyblok : demande les brouillons même si STORYBLOK_VERSION=published', async () => {
    query.value = { _storyblok: '12345' }
    setStoryblokVersion('published')
    await useEvents().getEvents()
    expect(get).toHaveBeenCalledWith('cdn/stories', expect.objectContaining({ version: 'draft' }))
  })
})
