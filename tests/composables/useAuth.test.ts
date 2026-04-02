import { describe, it, expect, vi } from 'vitest'
import { ref } from 'vue'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'

// ─── Mock Supabase ────────────────────────────────────────────────────────────

const mockSupabaseUser = ref<any>(null)
mockNuxtImport('useSupabaseClient', () => () => ({ from: vi.fn(), auth: { signOut: vi.fn() } }))
mockNuxtImport('useSupabaseUser', () => () => mockSupabaseUser)

const { useAuth } = await import('~/composables/useAuth')

// ═════════════════════════════════════════════════════════════════════════════
// Computed : isLoggedIn
// ═════════════════════════════════════════════════════════════════════════════

describe('useAuth — isLoggedIn', () => {
  it('est false quand aucun utilisateur', () => {
    mockSupabaseUser.value = null
    const { isLoggedIn } = useAuth()
    expect(isLoggedIn.value).toBe(false)
  })

  it('est true quand un utilisateur est connecté', () => {
    mockSupabaseUser.value = { id: 'abc', email: 'test@test.com' }
    const { isLoggedIn } = useAuth()
    expect(isLoggedIn.value).toBe(true)
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// Computed : rôles (isAdmin, isSecretary, isStaff, isParent)
// ═════════════════════════════════════════════════════════════════════════════

describe('useAuth — rôles', () => {
  it('isAdmin est false par défaut', () => {
    const { isAdmin } = useAuth()
    expect(isAdmin.value).toBe(false)
  })

  it('isAdmin est true après ajout du rôle admin', () => {
    const { isAdmin, roles } = useAuth()
    roles.value = ['admin']
    expect(isAdmin.value).toBe(true)
  })

  it('isSecretary est true avec le rôle secretary', () => {
    const { isSecretary, roles } = useAuth()
    roles.value = ['secretary']
    expect(isSecretary.value).toBe(true)
  })

  it('isStaff est true si admin', () => {
    const { isStaff, roles } = useAuth()
    roles.value = ['admin']
    expect(isStaff.value).toBe(true)
  })

  it('isStaff est true si secretary', () => {
    const { isStaff, roles } = useAuth()
    roles.value = ['secretary']
    expect(isStaff.value).toBe(true)
  })

  it('isStaff est false si seulement parent', () => {
    const { isStaff, roles } = useAuth()
    roles.value = ['parent']
    expect(isStaff.value).toBe(false)
  })

  it('isParent est true avec le rôle parent', () => {
    const { isParent, roles } = useAuth()
    roles.value = ['parent']
    expect(isParent.value).toBe(true)
  })

  it('hasRole retourne true pour un rôle présent', () => {
    const { hasRole, roles } = useAuth()
    roles.value = ['admin', 'parent']
    expect(hasRole('admin')).toBe(true)
    expect(hasRole('parent')).toBe(true)
    expect(hasRole('secretary')).toBe(false)
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// Computed : displayName et initials
// ═════════════════════════════════════════════════════════════════════════════

describe('useAuth — displayName', () => {
  it("utilise full_name du profil en priorité", () => {
    mockSupabaseUser.value = { id: '1', email: 'jean@test.com' }
    const { displayName, profile } = useAuth()
    profile.value = { full_name: 'Jean Dupont' } as any
    expect(displayName.value).toBe('Jean Dupont')
  })

  it("tombe sur l'email si pas de profil", () => {
    mockSupabaseUser.value = { id: '1', email: 'jean@test.com' }
    const { displayName, profile } = useAuth()
    profile.value = null
    expect(displayName.value).toBe('jean@test.com')
  })

  it("retourne vide si ni profil ni email", () => {
    mockSupabaseUser.value = null
    const { displayName, profile } = useAuth()
    profile.value = null
    expect(displayName.value).toBe('')
  })
})

describe('useAuth — initials', () => {
  it('génère les initiales depuis full_name', () => {
    mockSupabaseUser.value = null
    const { initials, profile } = useAuth()
    profile.value = { full_name: 'Marie Curie' } as any
    expect(initials.value).toBe('MC')
  })

  it('gère un nom en un seul mot', () => {
    const { initials, profile } = useAuth()
    profile.value = { full_name: 'Alice' } as any
    expect(initials.value).toBe('A')
  })

  it('tronque à 2 caractères max', () => {
    const { initials, profile } = useAuth()
    profile.value = { full_name: 'Jean Paul Martin' } as any
    expect(initials.value).toBe('JP')
  })

  it("tombe sur l'email si pas de profil (1 initiale car pas d'espace)", () => {
    mockSupabaseUser.value = { id: '1', email: 'alice@test.com' }
    const { initials, profile } = useAuth()
    profile.value = null
    expect(initials.value).toBe('A')
  })
})
