// T0a auth-profils — critère C3 (page /callback, retour OAuth Google / Microsoft).
// VRAI useAuth, Supabase simulé. `navigateTo` et `useRoute` sont simulés. Avec une session la page agit tout de suite ;
// sans session elle attend jusqu'à 3 s (R2b-4) : on attend la redirection avec vi.waitFor (pas de faux timers).
// Profil incomplet => /completer-profil ; complété staff => /admin/dashboard (inchangé) ;
// complété non-staff => /profil (R1-b) ; recovery inchangé.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { clearNuxtState } from '#imports'
import { flushPromises } from '@vue/test-utils'
import { createSupabaseMock } from '../utils/supabase-mock'
import { createAuthDb, serveAuth, profileOf } from '../utils/auth-fake'

const h = vi.hoisted(() => ({ navigateTo: vi.fn(), route: { query: {} as Record<string, string>, path: '/callback' } }))
mockNuxtImport('navigateTo', () => h.navigateTo)
mockNuxtImport('useRoute', () => () => h.route)

const { client, from, user } = createSupabaseMock({ withAuth: true })
mockNuxtImport('useSupabaseClient', () => () => client)
mockNuxtImport('useSupabaseUser', () => () => user)

const { default: CallbackPage } = await import('~/pages/callback.vue')

const db = createAuthDb({
  profiles: {
    nouveau: profileOf('nouveau', { profile_completed_at: null, status: 'En attente' }),
    membre: profileOf('membre'),
    adherent: profileOf('adherent'),
    secretaire: profileOf('secretaire'),
  },
  roles: { nouveau: [], membre: ['admin'], adherent: ['parent'], secretaire: ['secretary'] },
})

let wrapper: any
beforeEach(() => {
  clearNuxtState(key => key.startsWith('auth:'))
  db.fail = false
  db.reads.length = 0
  serveAuth(from, db)
  user.value = null
  h.route.query = {}
  h.navigateTo.mockReset()
})
afterEach(async () => {
  db.releaseAll()
  wrapper?.unmount()
  wrapper = undefined
  await flushPromises()
})

/** Monte la page et renvoie la destination de la première redirection. */
async function landOn() {
  wrapper = await mountSuspended(CallbackPage)
  await vi.waitFor(() => expect(h.navigateTo).toHaveBeenCalled(), { timeout: 4000 })
  return h.navigateTo.mock.calls[0]![0] as string
}

describe('C3 — /callback après connexion OAuth', () => {
  it('profil incomplet (nouveau compte Google / Microsoft) : redirigé vers /completer-profil', async () => {
    user.value = { id: 'nouveau', email: 'nouveau@test.fr' }
    expect(await landOn()).toBe('/completer-profil')
  })

  it('profil complété, admin : /admin/dashboard comme aujourd\'hui', async () => {
    user.value = { id: 'membre', email: 'membre@test.fr' }
    expect(await landOn()).toBe('/admin/dashboard')
  })

  it('R1-b — profil complété, secrétaire (staff) : /admin/dashboard inchangé', async () => {
    user.value = { id: 'secretaire', email: 'secretaire@test.fr' }
    expect(await landOn()).toBe('/admin/dashboard')
  })

  it('R1-b — profil complété, non-staff (adhérent / parent) : directement /profil, sans détour par /admin/dashboard', async () => {
    user.value = { id: 'adherent', email: 'adherent@test.fr' }
    expect(await landOn()).toBe('/profil')
    expect(h.navigateTo.mock.calls.map(c => c[0])).not.toContain('/admin/dashboard')
  })

  it('lien de récupération de mot de passe : /profil?resetPassword=true, avant la règle de complétion', async () => {
    user.value = { id: 'nouveau', email: 'nouveau@test.fr' }
    h.route.query = { type: 'recovery' }
    expect(await landOn()).toBe('/profil?resetPassword=true')
  })

  it('aucune session : retour sur /login', async () => {
    user.value = null
    expect(await landOn()).toBe('/login')
  })
})
