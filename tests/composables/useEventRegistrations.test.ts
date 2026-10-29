import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { createSupabaseMock, mockChain } from '../utils/supabase-mock'

// ─── Mock Supabase ────────────────────────────────────────────────────────────
// mockChain (chaîne Supabase factice) est centralisé dans tests/utils/supabase-mock.ts

const { client: mockClient, from: mockFrom, user: mockUser } = createSupabaseMock({ user: { id: 'parent-123' } })

mockNuxtImport('useSupabaseClient', () => () => mockClient)
mockNuxtImport('useSupabaseUser', () => () => mockUser)

const { useEventRegistrations } = await import('~/composables/useEventRegistrations')

// ═════════════════════════════════════════════════════════════════════════════
// État initial
// ═════════════════════════════════════════════════════════════════════════════

describe('useEventRegistrations — état initial', () => {
  it('démarre avec une liste vide et loading=false', () => {
    const { registrations, loading } = useEventRegistrations()
    expect(registrations.value).toEqual([])
    expect(loading.value).toBe(false)
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// register — logique registered_by
// ═════════════════════════════════════════════════════════════════════════════

describe('useEventRegistrations — register', () => {
  beforeEach(() => {
    mockFrom.mockReset()
    mockUser.value = { id: 'parent-123' }
  })

  it("n'inclut pas registered_by quand l'utilisateur s'inscrit lui-meme", async () => {
    const insertMock = vi.fn().mockResolvedValue({ error: null })
    mockFrom.mockReturnValue(mockChain({ insert: insertMock }))

    const { register } = useEventRegistrations()
    await register({ eventId: 'event-1' })

    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({ registered_by: null, user_id: 'parent-123' })
    )
  })

  it("inscrit un enfant avec registered_by = id du parent", async () => {
    const insertMock = vi.fn().mockResolvedValue({ error: null })
    mockFrom.mockReturnValue(mockChain({ insert: insertMock }))

    const { register } = useEventRegistrations()
    await register({ eventId: 'event-1', userId: 'child-456' })

    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 'child-456', registered_by: 'parent-123' })
    )
  })

  it("demarrer toujours avec status 'pending'", async () => {
    const insertMock = vi.fn().mockResolvedValue({ error: null })
    mockFrom.mockReturnValue(mockChain({ insert: insertMock }))

    const { register } = useEventRegistrations()
    await register({ eventId: 'event-1' })

    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'pending' })
    )
  })

  it('inclut les notes si fournies', async () => {
    const insertMock = vi.fn().mockResolvedValue({ error: null })
    mockFrom.mockReturnValue(mockChain({ insert: insertMock }))

    const { register } = useEventRegistrations()
    await register({ eventId: 'event-1', notes: 'Allergie aux arachides' })

    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({ notes: 'Allergie aux arachides' })
    )
  })

  it('leve une erreur si non authentifie', async () => {
    mockUser.value = null
    const { register } = useEventRegistrations()
    await expect(register({ eventId: 'event-1' })).rejects.toThrow('Non authentifie')
  })

  it('leve une erreur si Supabase retourne une erreur', async () => {
    const insertMock = vi.fn().mockResolvedValue({ error: { message: 'Quota depasse' } })
    mockFrom.mockReturnValue(mockChain({ insert: insertMock }))

    const { register } = useEventRegistrations()
    await expect(register({ eventId: 'event-1' })).rejects.toThrow('Quota depasse')
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// isRegistered
// ═════════════════════════════════════════════════════════════════════════════

describe('useEventRegistrations — isRegistered', () => {
  beforeEach(() => {
    mockFrom.mockReset()
    mockUser.value = { id: 'user-1' }
  })

  it('retourne false si non authentifie', async () => {
    mockUser.value = null
    const { isRegistered } = useEventRegistrations()
    expect(await isRegistered('event-1')).toBe(false)
  })

  it('retourne true si une inscription existe', async () => {
    mockFrom.mockReturnValue(mockChain({ data: { id: 'reg-1' }, error: null }))
    const { isRegistered } = useEventRegistrations()
    expect(await isRegistered('event-1')).toBe(true)
  })

  it('retourne false si aucune inscription', async () => {
    mockFrom.mockReturnValue(mockChain({ data: null, error: null }))
    const { isRegistered } = useEventRegistrations()
    expect(await isRegistered('event-1')).toBe(false)
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// countByEvent
// ═════════════════════════════════════════════════════════════════════════════

describe('useEventRegistrations — countByEvent', () => {
  beforeEach(() => mockFrom.mockReset())

  it('retourne le count Supabase', async () => {
    mockFrom.mockReturnValue(mockChain({ count: 12, error: null }))
    const { countByEvent } = useEventRegistrations()
    expect(await countByEvent('event-1')).toBe(12)
  })

  it('retourne 0 si Supabase retourne une erreur', async () => {
    mockFrom.mockReturnValue(mockChain({ count: null, error: { message: 'err' } }))
    const { countByEvent } = useEventRegistrations()
    expect(await countByEvent('event-1')).toBe(0)
  })

  it('retourne 0 si count est null', async () => {
    mockFrom.mockReturnValue(mockChain({ count: null, error: null }))
    const { countByEvent } = useEventRegistrations()
    expect(await countByEvent('event-1')).toBe(0)
  })
})
