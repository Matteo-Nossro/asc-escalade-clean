// T0a auth-profils — critères A3 et A4 (+ A5 pour l'affichage) : entrée « Administration » du menu de l'en-tête.
// VRAI useAuth, seul Supabase est simulé. Le menu mobile (burger) est utilisé : il lit le même isStaff que le menu
// déroulant desktop, mais son contenu se trouve dans le DOM sans geste de pointeur (le menu desktop n'est pas testé ici).
// Garde-fou : chaque test vérifie aussi que « Mon profil » est visible, pour prouver que le menu est bien ouvert.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ref } from 'vue'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { clearNuxtState } from '#imports'
import { flushPromises } from '@vue/test-utils'
import { createSupabaseMock } from '../../utils/supabase-mock'
import { createAuthDb, serveAuth, profileOf } from '../../utils/auth-fake'

const { client, from, user, signOut } = createSupabaseMock({ withAuth: true })
const signInWithPassword = vi.fn()
client.auth.signInWithPassword = signInWithPassword
mockNuxtImport('useSupabaseClient', () => () => client)
mockNuxtImport('useSupabaseUser', () => () => user)
mockNuxtImport('useStoryblokConfig', () => () => ref(null))
const isDesktop = ref(false)
mockNuxtImport('useBreakpoints', () => () => ({ isDesktop }))

const { default: Header } = await import('~/components/layout/Header.vue')
const { useAuth } = await import('~/composables/useAuth')

const db = createAuthDb({
  profiles: {
    'admin-1': profileOf('admin-1'),
    'parent-1': profileOf('parent-1'),
  },
  roles: { 'admin-1': ['admin'], 'parent-1': ['parent'] },
})

let wrapper: any
beforeEach(() => {
  clearNuxtState(key => key.startsWith('auth:'))
  db.fail = false
  db.reads.length = 0
  user.value = null
  serveAuth(from, db)
  signOut.mockReset().mockResolvedValue({ error: null })
  signInWithPassword.mockReset()
})
afterEach(async () => {
  db.releaseAll()
  await flushPromises()
  wrapper?.unmount()
  wrapper = undefined
  document.body.style.overflow = ''
})

async function mountHeader() {
  wrapper = await mountSuspended(Header)
  await flushPromises()
}
async function openMenu() {
  await wrapper.find('button[aria-label="Ouvrir le menu"]').trigger('click')
  await flushPromises()
}
const bodyText = () => document.body.textContent ?? ''
const hasAdminEntry = () => bodyText().includes('Administration')
const menuIsOpenForMember = () => bodyText().includes('Mon profil')

describe('A3 — après une connexion, sans recharger la page', () => {
  it('admin : l\'entrée « Administration » apparaît après loginWithEmail (comme dans login.vue)', async () => {
    await mountHeader() // visiteur : rien n'est chargé au montage
    signInWithPassword.mockImplementation(async () => {
      user.value = { id: 'admin-1', email: 'admin-1@test.fr' } // la session arrive comme après un vrai signIn
      return { data: { user: { id: 'admin-1' } }, error: null }
    })

    await useAuth().loginWithEmail('admin-1@test.fr', 'mdp') // l'appel que fait login.vue (autre instance que le Header)
    await flushPromises()

    await openMenu()
    expect(menuIsOpenForMember()).toBe(true)
    expect(hasAdminEntry()).toBe(true)
  })

  it('adhérent sans rôle admin : pas d\'entrée « Administration » après connexion', async () => {
    await mountHeader()
    signInWithPassword.mockImplementation(async () => {
      user.value = { id: 'parent-1' }
      return { data: { user: { id: 'parent-1' } }, error: null }
    })
    await useAuth().loginWithEmail('parent-1@test.fr', 'mdp')
    await flushPromises()

    await openMenu()
    expect(menuIsOpenForMember()).toBe(true)
    expect(hasAdminEntry()).toBe(false)
  })
})

describe('A4 — chargement des rôles retardé, menu déjà ouvert', () => {
  it('l\'entrée apparaît dès que le chargement se termine', async () => {
    user.value = { id: 'admin-1', email: 'admin-1@test.fr' }
    const release = db.hold()
    await mountHeader()
    await openMenu()
    expect(menuIsOpenForMember()).toBe(true)
    expect(hasAdminEntry()).toBe(false) // état loading : rien par défaut

    release()
    await flushPromises()
    expect(hasAdminEntry()).toBe(true)
  })
})

describe('A5 — l\'entrée reste masquée tant que les rôles ne sont pas connus', () => {
  it('rôles jamais arrivés (état en cours) : masquée', async () => {
    user.value = { id: 'admin-1' }
    db.hold() // jamais libéré pendant le test (libéré par afterEach)
    await mountHeader()
    await openMenu()
    expect(menuIsOpenForMember()).toBe(true)
    expect(hasAdminEntry()).toBe(false)
  })

  it('lecture en échec (état error) : masquée', async () => {
    user.value = { id: 'admin-1' }
    db.fail = true
    await mountHeader()
    await openMenu()
    expect(menuIsOpenForMember()).toBe(true)
    expect(hasAdminEntry()).toBe(false)
  })

  it('compte qui n\'est pas staff : masquée même une fois les rôles chargés', async () => {
    user.value = { id: 'parent-1' }
    await mountHeader()
    await openMenu()
    expect(menuIsOpenForMember()).toBe(true)
    expect(hasAdminEntry()).toBe(false)
  })
})
