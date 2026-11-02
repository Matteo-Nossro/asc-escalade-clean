// enfants-fiabilite T0 — Q10 (adhérent) : /profil charge et affiche les enfants dès qu'un lien parent_access existe,
// même sans le rôle `parent` ; sans lien (et sans rôle), aucune card « Profils famille » et aucune requête parent_access.
// Supabase simulé table par table (profiles, user_roles, parent_access) ; chaque lecture est enregistrée.
// Rouge attendu : sans rôle `parent`, la page ne lit pas parent_access et n'affiche pas les enfants.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { createSupabaseMock } from '../utils/supabase-mock'
import { profileOf } from '../utils/auth-fake'

const h = vi.hoisted(() => ({ navigateTo: vi.fn() }))
mockNuxtImport('navigateTo', () => h.navigateTo)

const UID = 'adherent-1'
const { client, from, user } = createSupabaseMock({ withAuth: true })
mockNuxtImport('useSupabaseClient', () => () => client)
mockNuxtImport('useSupabaseUser', () => () => user)

const { default: ProfilPage } = await import('~/pages/profil.vue')

const links = [
  { id: 'pa1', parent_id: UID, child_id: 'c1', access_type: 'full', created_at: '2026-01-01T10:00:00.000Z',
    child: { id: 'c1', first_name: 'Noé', last_name: 'Martin', full_name: 'Noé Martin', avatar_url: null, birth_date: '2015-02-02' } },
  { id: 'pa2', parent_id: UID, child_id: 'c2', access_type: 'full', created_at: '2026-01-01T10:00:00.000Z',
    child: { id: 'c2', first_name: 'Eli', last_name: 'Martin', full_name: 'Eli Martin', avatar_url: null, birth_date: '2017-04-04' } },
]

const db = { roles: [] as string[], links: [] as any[] }
const reads: string[] = []

function serve() {
  from.mockReset().mockImplementation((table: string) => {
    reads.push(table)
    const result = () => {
      if (table === 'profiles') return { data: profileOf(UID, { first_name: 'Alex', last_name: 'Martin', email: 'alex@test.fr' }), error: null }
      if (table === 'user_roles') return { data: db.roles.map(role_code => ({ role_code })), error: null }
      if (table === 'parent_access') return { data: db.links, error: null }
      return { data: [], error: null }
    }
    const q: any = {
      select: () => q, eq: () => q, in: () => q, order: () => q, limit: () => q,
      single: async () => result(),
      maybeSingle: async () => result(),
      then: (ok: any, ko: any) => Promise.resolve(result()).then(ok, ko),
    }
    return q
  })
}

let wrapper: any
async function mountProfil() {
  wrapper = await mountSuspended(ProfilPage)
  await vi.waitFor(() => expect(wrapper.vm.ready).toBe(true), { timeout: 3000 })
  await flushPromises()
  return wrapper.text() as string
}

beforeEach(() => {
  reads.length = 0
  db.roles = []
  db.links = []
  h.navigateTo.mockReset()
  user.value = { id: UID, email: 'alex@test.fr' }
  serve()
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ features: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } })))
})
afterEach(async () => {
  wrapper?.unmount()
  wrapper = undefined
  vi.unstubAllGlobals()
  await flushPromises()
})

describe('Q10 — /profil : enfants selon les liens parent_access', () => {
  it('SANS rôle parent mais avec des liens : parent_access est lu et les enfants sont affichés', async () => {
    db.roles = []
    db.links = links
    const text = await mountProfil()
    expect(reads).toContain('parent_access')
    expect(text).toContain('Profils famille')
    expect(text).toContain('Noé Martin')
    expect(text).toContain('Eli Martin')
  })

  it('avec le rôle parent et des liens : enfants affichés (inchangé)', async () => {
    db.roles = ['parent']
    db.links = links
    const text = await mountProfil()
    expect(text).toContain('Profils famille')
    expect(text).toContain('Noé Martin')
  })

  it('avec le rôle parent mais sans lien : la card famille reste affichée (« Ajouter un enfant »), sans enfant', async () => {
    db.roles = ['parent']
    db.links = []
    const text = await mountProfil()
    expect(text).toContain('Profils famille')
    expect(text).toContain('Ajouter un enfant')
    expect(text).not.toContain('Noé Martin')
  })

  it('sans rôle parent et sans lien : aucune card « Profils famille »', async () => {
    db.roles = []
    db.links = []
    const text = await mountProfil()
    expect(text).not.toContain('Profils famille')
    expect(text).not.toContain('Ajouter un enfant')
  })
})
