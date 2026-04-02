import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'

// ─── Mock Supabase ────────────────────────────────────────────────────────────

const mockFrom = vi.fn()
mockNuxtImport('useSupabaseClient', () => () => ({ from: mockFrom }))
mockNuxtImport('useSupabaseUser', () => () => ref({ id: 'user-123' }))

// ─── Import après les mocks ───────────────────────────────────────────────────

const { useGroups } = await import('~/composables/useGroups')

// ═════════════════════════════════════════════════════════════════════════════
// Fonctions de formatage (pures — pas de Supabase)
// ═════════════════════════════════════════════════════════════════════════════

describe('useGroups — formatDay', () => {
  it('retourne le nom du jour pour un numéro connu', () => {
    const { formatDay } = useGroups()
    expect(formatDay(1)).toBe('Lundi')
    expect(formatDay(2)).toBe('Mardi')
    expect(formatDay(3)).toBe('Mercredi')
    expect(formatDay(4)).toBe('Jeudi')
    expect(formatDay(5)).toBe('Vendredi')
    expect(formatDay(6)).toBe('Samedi')
    expect(formatDay(7)).toBe('Dimanche')
  })

  it('retourne un fallback pour un numéro inconnu', () => {
    const { formatDay } = useGroups()
    expect(formatDay(0)).toBe('Jour 0')
    expect(formatDay(8)).toBe('Jour 8')
    expect(formatDay(99)).toBe('Jour 99')
  })
})

describe('useGroups — formatTime', () => {
  it('convertit "HH:MM:SS" en "HHhMM"', () => {
    const { formatTime } = useGroups()
    expect(formatTime('18:00:00')).toBe('18h00')
    expect(formatTime('09:30:00')).toBe('09h30')
    expect(formatTime('20:45:00')).toBe('20h45')
  })

  it('fonctionne aussi avec le format "HH:MM" (sans secondes)', () => {
    const { formatTime } = useGroups()
    expect(formatTime('18:00')).toBe('18h00')
    expect(formatTime('07:15')).toBe('07h15')
  })
})

describe('useGroups — formatSchedule', () => {
  it('formate un créneau complet correctement', () => {
    const { formatSchedule } = useGroups()
    expect(
      formatSchedule({ day_of_week: 1, start_time: '18:00:00', end_time: '20:00:00', id: '1', group_id: 'g1' })
    ).toBe('Lundi 18h00 – 20h00')
  })

  it('formate un créneau du weekend', () => {
    const { formatSchedule } = useGroups()
    expect(
      formatSchedule({ day_of_week: 6, start_time: '09:00:00', end_time: '11:30:00', id: '2', group_id: 'g1' })
    ).toBe('Samedi 09h00 – 11h30')
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// enroll — logique enrolled_by
// ═════════════════════════════════════════════════════════════════════════════

describe('useGroups — enroll', () => {
  beforeEach(() => {
    mockFrom.mockReset()
  })

  it("n'inclut pas enrolled_by quand l'utilisateur s'inscrit lui-même", async () => {
    const insertMock = vi.fn().mockResolvedValue({ error: null })
    mockFrom.mockReturnValue({ insert: insertMock })

    const { enroll } = useGroups()
    await enroll('group-1')

    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({ enrolled_by: null })
    )
  })

  it('inclut enrolled_by quand un parent inscrit un enfant', async () => {
    const insertMock = vi.fn().mockResolvedValue({ error: null })
    mockFrom.mockReturnValue({ insert: insertMock })

    const { enroll } = useGroups()
    await enroll('group-1', 'child-456')

    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'child-456',
        enrolled_by: 'user-123',
      })
    )
  })

  it('lève une erreur si Supabase retourne une erreur', async () => {
    const insertMock = vi.fn().mockResolvedValue({ error: { message: 'DB error' } })
    mockFrom.mockReturnValue({ insert: insertMock })

    const { enroll } = useGroups()
    await expect(enroll('group-1')).rejects.toThrow('DB error')
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// État réactif initial
// ═════════════════════════════════════════════════════════════════════════════

describe('useGroups — état initial', () => {
  it('démarre avec des listes vides et loading=false', () => {
    const { groups, myEnrollments, loading } = useGroups()
    expect(groups.value).toEqual([])
    expect(myEnrollments.value).toEqual([])
    expect(loading.value).toBe(false)
  })
})
