// auth-erreur-profil, T0 — Q26 : état de lecture du profil séparé des actions de connexion.
// Critères : « loading » et « error » de useAuth n'ont aucun lecteur => retirés ; l'échec d'une action de connexion
// n'est jamais pris pour un échec de lecture du profil (authStatus inchangé, donc pas de blocage Q25).
// VRAI useAuth, seul Supabase est simulé. Le blocage lui-même (porte) est vérifié dans tests/components/auth/PageGate.test.ts.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { clearNuxtState } from '#imports'
import { flushPromises } from '@vue/test-utils'
import { createSupabaseMock, mockChain } from '../utils/supabase-mock'
import { createAuthDb, serveAuth, profileOf } from '../utils/auth-fake'

const h = vi.hoisted(() => ({ navigateTo: vi.fn() }))
mockNuxtImport('navigateTo', () => h.navigateTo)

const { client, from, user } = createSupabaseMock({ withAuth: true })
const signInWithPassword = vi.fn()
const signInWithOAuth = vi.fn()
const signUp = vi.fn()
client.auth.signInWithPassword = signInWithPassword
client.auth.signInWithOAuth = signInWithOAuth
client.auth.signUp = signUp
mockNuxtImport('useSupabaseClient', () => () => client)
mockNuxtImport('useSupabaseUser', () => () => user)

const { useAuth } = await import('~/composables/useAuth')

const db = createAuthDb({
  profiles: { adherent: profileOf('adherent', { full_name: 'Alix Adherente' }) },
  roles: { adherent: ['parent'] },
})

beforeEach(() => {
  clearNuxtState(key => key.startsWith('auth:'))
  db.fail = false
  db.failTables = []
  db.failNext = 0
  db.reads.length = 0
  serveAuth(from, db)
  user.value = null
  signInWithPassword.mockReset().mockResolvedValue({ data: { user: null }, error: { message: 'Invalid login credentials' } })
  signInWithOAuth.mockReset().mockResolvedValue({ data: null, error: { message: 'oauth refusé' } })
  signUp.mockReset().mockResolvedValue({ data: null, error: { message: 'User already registered' } })
  h.navigateTo.mockReset()
})
afterEach(async () => {
  db.releaseAll()
  await flushPromises()
})

describe('Q26 — useAuth n\'expose plus loading ni error', () => {
  it('la valeur renvoyée n\'a ni `loading` ni `error` (authStatus est le seul état de lecture du profil)', () => {
    const auth = useAuth() as Record<string, unknown>
    expect(Object.keys(auth)).not.toContain('loading')
    expect(Object.keys(auth)).not.toContain('error')
    expect(Object.keys(auth)).toContain('authStatus')
  })

  it('aucun état partagé « auth:loading » / « auth:error » n\'est créé, même après une action en échec', async () => {
    const auth = useAuth()
    await expect(auth.loginWithEmail('a@test.fr', 'mauvais')).rejects.toBeTruthy()
    const keys = Object.keys(useNuxtApp().payload.state)
    expect(keys.filter(k => /auth:(loading|error)$/.test(k))).toEqual([])
  })
})

describe('Q26 — un échec d\'action de connexion n\'est jamais un échec de lecture du profil', () => {
  it('loginWithEmail refusé (visiteur) : l\'erreur est levée, authStatus reste idle, aucune lecture du profil', async () => {
    const auth = useAuth()
    await expect(auth.loginWithEmail('a@test.fr', 'mauvais')).rejects.toMatchObject({ message: 'Invalid login credentials' })
    expect(auth.authStatus.value).toBe('idle')
    expect(db.count('profiles')).toBe(0)
  })

  it('loginWithEmail refusé alors que le profil est ready : authStatus reste ready, profil et rôles intacts', async () => {
    user.value = { id: 'adherent', email: 'adherent@test.fr' }
    const auth = useAuth()
    await auth.ensureProfile()
    expect(auth.authStatus.value).toBe('ready')

    await expect(auth.loginWithEmail('a@test.fr', 'mauvais')).rejects.toBeTruthy()
    expect(auth.authStatus.value).toBe('ready')
    expect(auth.profile.value?.full_name).toBe('Alix Adherente')
    expect(auth.roles.value).toEqual(['parent'])
    expect(db.count('profiles')).toBe(1)
  })

  it('signUp refusé : authStatus inchangé, aucune lecture du profil', async () => {
    const auth = useAuth()
    await expect(auth.signUp('a@test.fr', 'mdp', 'Alix')).rejects.toMatchObject({ message: 'User already registered' })
    expect(auth.authStatus.value).toBe('idle')
    expect(db.count('profiles')).toBe(0)
  })

  it('loginWithOAuth refusé : authStatus inchangé', async () => {
    const auth = useAuth()
    await expect(auth.loginWithOAuth('google')).rejects.toMatchObject({ message: 'oauth refusé' })
    expect(auth.authStatus.value).toBe('idle')
  })

  it('updateProfile refusé alors que le profil est ready : authStatus reste ready (pas de blocage)', async () => {
    user.value = { id: 'adherent', email: 'adherent@test.fr' }
    const auth = useAuth()
    await auth.ensureProfile()
    from.mockReset().mockReturnValue(mockChain({ single: vi.fn().mockResolvedValue({ data: null, error: { message: 'update refusé' } }) }))

    await expect(auth.updateProfile({ phone: '0600000000' } as any)).rejects.toMatchObject({ message: 'update refusé' })
    expect(auth.authStatus.value).toBe('ready')
    expect(auth.profile.value?.full_name).toBe('Alix Adherente')
  })

  it('à l\'inverse, un échec de lecture du profil met bien authStatus à error (c\'est le seul signal de blocage)', async () => {
    user.value = { id: 'adherent', email: 'adherent@test.fr' }
    db.fail = true
    const auth = useAuth()
    await auth.fetchProfile()
    expect(auth.authStatus.value).toBe('error')
  })
})
