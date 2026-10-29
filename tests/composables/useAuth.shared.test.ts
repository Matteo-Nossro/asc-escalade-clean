// T0a auth-profils — critères A1, A2, A5, A7 (+ contrat isProfileComplete / authStatus).
// VRAI useAuth, seul Supabase est simulé (tests/utils/auth-fake.ts). Aucun faux useAuth.
// Rouge attendu sur le code actuel : état local à chaque appel (ref), pas d'ensureProfile / authStatus.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { clearNuxtState } from '#imports'
import { flushPromises } from '@vue/test-utils'
import { createSupabaseMock } from '../utils/supabase-mock'
import { createAuthDb, serveAuth, profileOf } from '../utils/auth-fake'

const h = vi.hoisted(() => ({ navigateTo: vi.fn() }))
mockNuxtImport('navigateTo', () => h.navigateTo)

const { client, from, user, signOut } = createSupabaseMock({ withAuth: true })
const signInWithPassword = vi.fn()
client.auth.signInWithPassword = signInWithPassword
mockNuxtImport('useSupabaseClient', () => () => client)
mockNuxtImport('useSupabaseUser', () => () => user)

const { useAuth } = await import('~/composables/useAuth')

const ADMIN = 'admin-1'
const PARENT = 'parent-1'
const db = createAuthDb({
  profiles: {
    [ADMIN]: profileOf(ADMIN, { full_name: 'Alice Admin' }),
    [PARENT]: profileOf(PARENT, { full_name: 'Paul Parent' }),
    incomplete: profileOf('incomplete', { profile_completed_at: null, status: 'En attente' }),
  },
  roles: { [ADMIN]: ['admin'], [PARENT]: ['parent'], incomplete: [] },
})

beforeEach(() => {
  clearNuxtState(key => key.startsWith('auth:'))
  db.fail = false
  db.reads.length = 0
  user.value = null
  serveAuth(from, db)
  signOut.mockReset().mockResolvedValue({ error: null })
  signInWithPassword.mockReset()
  h.navigateTo.mockReset()
})
afterEach(async () => {
  db.releaseAll()
  await flushPromises()
})

describe('A1 — état partagé entre les appels de useAuth()', () => {
  it('le chargement fait par un appel est visible par un autre appel', async () => {
    user.value = { id: ADMIN, email: 'admin@test.fr' }
    const a = useAuth()
    const b = useAuth()
    await a.fetchProfile()
    expect(b.roles.value).toEqual(['admin'])
    expect(b.isAdmin.value).toBe(true)
    expect(b.isStaff.value).toBe(true)
    expect(b.profile.value?.full_name).toBe('Alice Admin')
  })

  it('un troisième appel, créé après le chargement, voit aussi le même état sans relire', async () => {
    user.value = { id: ADMIN, email: 'admin@test.fr' }
    await useAuth().fetchProfile()
    const reads = db.reads.length
    const late = useAuth()
    await flushPromises()
    expect(late.isAdmin.value).toBe(true)
    expect(db.reads.length).toBe(reads)
  })
})

describe('Contrat — authStatus et isProfileComplete', () => {
  it('sans utilisateur : authStatus est idle, rôles vides, rien d\'admin', () => {
    const auth = useAuth()
    expect(auth.authStatus.value).toBe('idle')
    expect(auth.roles.value).toEqual([])
    expect(auth.isStaff.value).toBe(false)
  })

  it('compte sans rôle : ready avec roles = [] (distinct de idle)', async () => {
    user.value = { id: 'incomplete' }
    const auth = useAuth()
    await auth.ensureProfile()
    expect(auth.authStatus.value).toBe('ready')
    expect(auth.roles.value).toEqual([])
  })

  it('isProfileComplete suit profile_completed_at', async () => {
    user.value = { id: 'incomplete' }
    const auth = useAuth()
    await auth.ensureProfile()
    expect(auth.isProfileComplete.value).toBe(false)

    user.value = { id: PARENT }
    await auth.ensureProfile()
    expect(auth.isProfileComplete.value).toBe(true)
  })
})

describe('A2 — rechargement au changement d\'utilisateur, vidage à la déconnexion', () => {
  it('changement de compte : les rôles et le profil du nouveau compte remplacent ceux de l\'ancien', async () => {
    user.value = { id: ADMIN }
    const auth = useAuth()
    await auth.ensureProfile()
    expect(auth.isAdmin.value).toBe(true)

    user.value = { id: PARENT }
    await auth.ensureProfile()
    expect(auth.isAdmin.value).toBe(false)
    expect(auth.isParent.value).toBe(true)
    expect(auth.profile.value?.id).toBe(PARENT)
    expect(db.reads.filter(r => r.table === 'profiles').map(r => r.uid)).toEqual([ADMIN, PARENT])
  })

  it('loginWithEmail charge le profil avec l\'id renvoyé par signInWithPassword (la session n\'est pas encore propagée)', async () => {
    signInWithPassword.mockResolvedValue({ data: { user: { id: ADMIN } }, error: null })
    const auth = useAuth() // user.value reste null : c'est le cas réel juste après signInWithPassword
    await auth.loginWithEmail('admin@test.fr', 'mdp')
    expect(db.reads.some(r => r.table === 'profiles' && r.uid === ADMIN)).toBe(true)
    expect(useAuth().isAdmin.value).toBe(true)
  })

  it('déconnexion : l\'état partagé est vidé pour tous les appels, et on retourne sur /login', async () => {
    user.value = { id: ADMIN }
    const a = useAuth()
    const b = useAuth()
    await a.ensureProfile()
    expect(b.isAdmin.value).toBe(true)

    await a.logout()
    expect(signOut).toHaveBeenCalled()
    expect(h.navigateTo).toHaveBeenCalledWith('/login')
    for (const auth of [a, b]) {
      expect(auth.roles.value).toEqual([])
      expect(auth.profile.value).toBeNull()
      expect(auth.isStaff.value).toBe(false)
      expect(auth.authStatus.value).not.toBe('ready')
    }
  })
})

describe('A5 — échec de lecture : fermé par défaut, puis nouvel essai', () => {
  it('erreur : authStatus = error, isStaff faux, profil et rôles vidés ; une relecture réussit ensuite', async () => {
    user.value = { id: ADMIN }
    const auth = useAuth()
    db.fail = true
    await auth.ensureProfile().catch(() => {})
    expect(auth.authStatus.value).toBe('error')
    expect(auth.isStaff.value).toBe(false)
    expect(auth.isAdmin.value).toBe(false)
    expect(auth.roles.value).toEqual([])
    expect(auth.profile.value).toBeNull()

    db.fail = false
    await auth.ensureProfile()
    expect(auth.authStatus.value).toBe('ready')
    expect(auth.isAdmin.value).toBe(true)
  })

  it('pendant le chargement : authStatus = loading et aucun droit n\'est affiché ; à la fin, ready et droits', async () => {
    user.value = { id: ADMIN }
    const release = db.hold()
    const auth = useAuth()
    const pending = auth.ensureProfile()
    await flushPromises()
    expect(auth.authStatus.value).toBe('loading')
    expect(auth.isStaff.value).toBe(false)

    release()
    await pending
    expect(auth.authStatus.value).toBe('ready')
    expect(auth.isStaff.value).toBe(true)
  })
})

describe('A7 — pas de chargements en double', () => {
  it('N appels simultanés à ensureProfile() ne lisent profiles et user_roles qu\'une fois', async () => {
    user.value = { id: ADMIN }
    const release = db.hold()
    const calls = [useAuth(), useAuth(), useAuth()].flatMap(a => [a.ensureProfile(), a.ensureProfile()])
    release()
    await Promise.all(calls)
    expect(db.count('profiles')).toBe(1)
    expect(db.count('user_roles')).toBe(1)
  })

  it('plusieurs composants qui appellent useAuth() en même temps : une seule lecture du profil', async () => {
    user.value = { id: ADMIN }
    const release = db.hold()
    const auths = [useAuth(), useAuth(), useAuth()]
    await flushPromises()
    release()
    await flushPromises()
    expect(db.count('profiles')).toBe(1)
    expect(auths.every(a => a.isAdmin.value)).toBe(true)
  })

  it('ensureProfile() ne relit pas quand l\'état est déjà ready pour cet id', async () => {
    user.value = { id: ADMIN }
    const auth = useAuth()
    await auth.ensureProfile()
    await auth.ensureProfile()
    await useAuth().ensureProfile()
    expect(db.count('profiles')).toBe(1)
  })

  it('fetchProfile() force une relecture, mais se rattache à la lecture en cours pour le même id', async () => {
    user.value = { id: ADMIN }
    const auth = useAuth()
    await auth.ensureProfile()
    expect(db.count('profiles')).toBe(1)

    const release = db.hold()
    const p1 = auth.fetchProfile()
    const p2 = auth.fetchProfile()
    release()
    await Promise.all([p1, p2])
    expect(db.count('profiles')).toBe(2)
  })
})
