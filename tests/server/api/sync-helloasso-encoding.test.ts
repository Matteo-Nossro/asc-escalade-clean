// C0 helloasso-socle (corrections post-revue) — C4 : la sync encode `orgSlug` et `form_slug`.
// POST /api/admin/sync-helloasso : les deux slugs sont passés par encodeURIComponent dans le chemin
// donné à useHelloAsso().get ; un slug contenant `/`, `?`, un espace ou `..` ne peut ni sortir de son
// segment ni injecter une query string. Le client (useHelloAsso().get) est mocké.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createMockEvent, stubNitroGlobals } from '../../utils/nitro'
import { createFakeSupabase } from '../../utils/fake-supabase'
import { loadModule, settle, fixture, forbidNetwork } from '../../utils/helloasso-kit'

const ROUTE = 'server/api/admin/sync-helloasso.post.ts'

const h = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  haGet: vi.fn(),
  orgSlug: 'asso-fictive',
  db: null as any,
}))
vi.mock('#supabase/server', () => ({
  serverSupabaseServiceRole: () => h.db,
  serverSupabaseUser: async () => ({ id: 'u1' }),
}))
vi.mock('../../../server/utils/requireAdmin', () => ({ requireAdmin: h.requireAdmin }))
vi.mock('../../../server/utils/helloasso', async () => {
  const { FakeHelloAssoError: Err } = await import('../../utils/helloasso-kit')
  return {
    HelloAssoError: Err,
    useHelloAsso: () => ({
      config: { orgSlug: h.orgSlug, environment: 'sandbox', apiUrl: 'https://api.helloasso-sandbox.com/v5' },
      get: h.haGet,
      post: vi.fn(),
      getAccessToken: vi.fn(),
    }),
    toH3Error: vi.fn(),
    resolveHelloAssoConfig: vi.fn(),
    createHelloAssoClient: vi.fn(),
  }
})

const ITEMS = fixture('items.page-size-1')

const NASTY_SLUGS: Array<[string, string]> = [
  ['slash', 'a/b'],
  ['point d\'interrogation', 'a?b=c'],
  ['espace', 'a b'],
  ['remontée de dossier', '../admin'],
  ['deux points au milieu', 'x/../y'],
  ['dièse, esperluette, pourcent', 'a#b&c%d'],
  ['accent', 'adhésion'],
]

const expectedPath = (org: string, slug: string) =>
  `/organizations/${encodeURIComponent(org)}/forms/Membership/${encodeURIComponent(slug)}/items`

async function runSync(formSlug: string) {
  const sb = createFakeSupabase({
    helloasso_forms: [{ id: 'form-1', form_slug: formSlug, form_type: 'Membership', active: true }],
    profiles: [],
    profile_payments: [],
  })
  h.db = sb.client
  h.haGet.mockResolvedValue(ITEMS)
  const handler = (await loadModule(ROUTE)).default as (e: unknown) => Promise<any>
  return settle(() => handler(createMockEvent()))
}
const firstPath = () => String(h.haGet.mock.calls[0]![0])

describe('POST /api/admin/sync-helloasso — C4 : slugs encodés dans le chemin HelloAsso', () => {
  beforeEach(() => {
    vi.resetModules()
    stubNitroGlobals()
    forbidNetwork()
    h.requireAdmin.mockReset().mockResolvedValue({ userId: 'u1', roles: ['admin'] })
    h.haGet.mockReset()
    h.orgSlug = 'asso-fictive'
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  describe('form_slug', () => {
    it.each(NASTY_SLUGS)('form_slug avec %s : encodé par encodeURIComponent', async (_nom, slug) => {
      await runSync(slug)
      expect(h.haGet).toHaveBeenCalledTimes(1)
      expect(firstPath()).toBe(expectedPath('asso-fictive', slug))
    })

    it.each(NASTY_SLUGS)('form_slug avec %s : le chemin garde exactement ses 6 segments, sans query string', async (_nom, slug) => {
      await runSync(slug)
      const path = firstPath()
      expect(path).not.toContain('?')
      expect(path).not.toContain('../')
      expect(path.split('/')).toHaveLength(7) // '' + organizations, org, forms, Membership, slug, items
    })
  })

  describe('orgSlug', () => {
    it.each(NASTY_SLUGS)('orgSlug avec %s : encodé par encodeURIComponent', async (_nom, org) => {
      h.orgSlug = org
      await runSync('adhesion-fixture')
      expect(h.haGet).toHaveBeenCalledTimes(1)
      expect(firstPath()).toBe(expectedPath(org, 'adhesion-fixture'))
    })

    it.each(NASTY_SLUGS)('orgSlug avec %s : le chemin garde exactement ses 6 segments, sans query string', async (_nom, org) => {
      h.orgSlug = org
      await runSync('adhesion-fixture')
      const path = firstPath()
      expect(path).not.toContain('?')
      expect(path.split('/')).toHaveLength(7)
    })
  })

  describe('non-régression', () => {
    it('slugs ordinaires : chemin inchangé', async () => {
      await runSync('adhesion-fixture')
      expect(firstPath()).toBe('/organizations/asso-fictive/forms/Membership/adhesion-fixture/items')
    })

    it('la pagination reste passée en paramètres séparés (pageIndex 1, pageSize 100)', async () => {
      await runSync('adhesion-fixture')
      expect(h.haGet.mock.calls[0]![1]).toMatchObject({ pageIndex: 1, pageSize: 100 })
    })
  })
})
