// T0a auth-profils — critère C3 (page /completer-profil, formulaire de complétion des comptes OAuth).
// La page n'existe pas encore : le module est chargé par chemin absolu variable, l'échec « ABSENT » est attendu (rouge).
// VRAI useAuth, Supabase simulé, `fetch` / `$fetch` simulés (aucun réseau).
//
// Hypothèse de structure posée ici (à respecter par ui-dev, T6) :
//  - le formulaire est un <form> soumis par un événement `submit` (ou, à défaut, un bouton type="submit") ;
//  - un profil pré-rempli avec prénom, nom, date de naissance et genre suffit à envoyer, sans enfant ;
//  - les champs texte sont de vrais <input> dont la valeur reflète le profil ;
//  - le lien de déconnexion est un <a> ou <button> dont le texte contient « déconnex ».
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { clearNuxtState } from '#imports'
import { flushPromises } from '@vue/test-utils'
import { createSupabaseMock } from '../utils/supabase-mock'
import { createAuthDb, serveAuth, profileOf } from '../utils/auth-fake'

const h = vi.hoisted(() => ({ navigateTo: vi.fn() }))
mockNuxtImport('navigateTo', () => h.navigateTo)

const { client, from, user, signOut } = createSupabaseMock({ withAuth: true })
mockNuxtImport('useSupabaseClient', () => () => client)
mockNuxtImport('useSupabaseUser', () => () => user)

const PAGE = `${process.cwd().replace(/\\/g, '/')}/app/pages/completer-profil.vue`
async function loadPage() {
  try {
    return (await import(/* @vite-ignore */ PAGE)).default
  }
  catch (e: any) {
    throw new Error(`ABSENT: app/pages/completer-profil.vue — ${String(e?.message ?? e).split('\n')[0]}`)
  }
}

const db = createAuthDb({
  profiles: {
    nouveau: profileOf('nouveau', {
      profile_completed_at: null,
      status: 'En attente',
      email: 'camille@test.fr',
      first_name: 'Camille',
      last_name: 'Durand',
      birth_date: '1990-05-12',
      gender: 'F',
      phone: '0611223344',
    }),
  },
  roles: { nouveau: [] },
})

const posts: Array<{ url: string, init: any }> = []
const COMPLETE = '/api/profile/complete'
const json = (body: unknown) => new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } })

let wrapper: any
beforeEach(() => {
  clearNuxtState(key => key.startsWith('auth:'))
  db.fail = false
  db.reads.length = 0
  serveAuth(from, db)
  signOut.mockReset().mockResolvedValue({ error: null })
  h.navigateTo.mockReset()
  user.value = { id: 'nouveau', email: 'camille@test.fr' }
  posts.length = 0
  vi.stubGlobal('fetch', vi.fn(async (url: any, init: any) => {
    if (String(url).includes(COMPLETE)) { posts.push({ url: String(url), init }); return json({ success: true }) }
    return json({ features: [] }) // autocomplétion d'adresse et autres appels : réponse vide
  }))
  vi.stubGlobal('$fetch', vi.fn(async (url: any, init: any) => {
    if (String(url).includes(COMPLETE)) { posts.push({ url: String(url), init: { ...init, body: typeof init?.body === 'string' ? init.body : JSON.stringify(init?.body) } }); return { success: true } }
    return { features: [] }
  }))
})
afterEach(async () => {
  db.releaseAll()
  wrapper?.unmount()
  wrapper = undefined
  vi.unstubAllGlobals()
  await flushPromises()
})

async function mountPage() {
  const Page = await loadPage()
  wrapper = await mountSuspended(Page)
  await flushPromises()
  await vi.waitFor(() => expect(db.count('profiles')).toBeGreaterThan(0))
  await flushPromises()
}
const inputValues = () => wrapper.findAll('input').map((i: any) => i.element.value)
async function submit() {
  const form = wrapper.find('form')
  if (form.exists()) await form.trigger('submit')
  else await wrapper.find('button[type="submit"]').trigger('click')
  await flushPromises()
  await vi.waitFor(() => expect(posts.length).toBeGreaterThan(0), { timeout: 3000 })
  await flushPromises()
}
const postedBody = () => JSON.parse(posts[0]!.init.body)

describe('C3 — /completer-profil', () => {
  it('pré-remplit le formulaire depuis le profil (enrichissement FFME éventuel)', async () => {
    await mountPage()
    const values = inputValues()
    expect(values).toContain('Camille')
    expect(values).toContain('Durand')
    expect(values).toContain('1990-05-12')
  })

  it('envoie le formulaire à /api/profile/complete : parent sans email ni userId, enfants vides', async () => {
    await mountPage()
    await submit()
    expect(posts[0]!.url).toContain(COMPLETE)
    expect(String(posts[0]!.init?.method ?? 'POST').toUpperCase()).toBe('POST')
    const body = postedBody()
    expect(body.parent).toMatchObject({ first_name: 'Camille', last_name: 'Durand', birth_date: '1990-05-12', gender: 'F' })
    expect(body.parent.email).toBeUndefined()
    expect(body.userId).toBeUndefined()
    expect(body.children).toEqual([])
  })

  it('après l\'envoi : message « en attente de validation par le bureau » et profil relu (fetchProfile)', async () => {
    await mountPage()
    const readsBefore = db.count('profiles')
    await submit()
    expect(wrapper.text().toLowerCase()).toContain('en attente de validation par le bureau')
    expect(db.count('profiles')).toBeGreaterThan(readsBefore)
  })

  it('propose un lien de déconnexion qui déconnecte et renvoie sur /login', async () => {
    await mountPage()
    const logout = wrapper.findAll('a, button').find((el: any) => /déconnex/i.test(el.text()))
    expect(logout, 'lien ou bouton « déconnexion »').toBeTruthy()
    await logout.trigger('click')
    await flushPromises()
    expect(signOut).toHaveBeenCalled()
    expect(h.navigateTo).toHaveBeenCalledWith('/login')
  })
})
