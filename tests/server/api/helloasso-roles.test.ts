// T0 helloasso-socle — matrice des rôles sur les 6 routes HelloAsso admin (requireAdmin RÉEL).
//
//   | Route                          | anonyme | initiateur | secretary | admin |
//   | test, sync, forms POST/PATCH   |   401   |    403     |    403    |  ok   |
//   | forms GET, stats GET           |   401   |    403     |    ok     |  ok   |
//
// Supabase est un faux en mémoire : `user_roles` répond selon le filtre .in('role_code', …) de requireAdmin.
// Le fetch est un routeur de fixtures (jamais de réseau) ; un refus ne doit déclencher AUCUN appel ni écriture.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { createMockEvent, stubNitroGlobals } from '../../utils/nitro'
import { createFakeSupabase, type Row } from '../../utils/fake-supabase'
import { loadModule, settle, fixture, createFetchRouter, forbidNetwork } from '../../utils/helloasso-kit'

const state = vi.hoisted(() => ({ user: null as any, db: null as any, rc: {} as Record<string, any> }))
mockNuxtImport('useRuntimeConfig', original => () => ({ ...original(), ...state.rc }))
vi.mock('#supabase/server', () => ({
  serverSupabaseUser: async () => state.user,
  serverSupabaseServiceRole: () => state.db,
}))

type Who = 'anonyme' | 'initiateur' | 'secretary' | 'admin'
type Verdict = 401 | 403 | 'ok'

const ROUTES: Array<{
  name: string
  file: string
  event: () => ReturnType<typeof createMockEvent>
  expected: Record<Who, Verdict>
}> = [
  { name: 'POST helloasso-test', file: 'server/api/admin/helloasso-test.post.ts', event: () => createMockEvent({ body: {} }), expected: { anonyme: 401, initiateur: 403, secretary: 403, admin: 'ok' } },
  { name: 'POST sync-helloasso', file: 'server/api/admin/sync-helloasso.post.ts', event: () => createMockEvent({ body: {} }), expected: { anonyme: 401, initiateur: 403, secretary: 403, admin: 'ok' } },
  {
    name: 'POST helloasso-forms',
    file: 'server/api/admin/helloasso-forms.post.ts',
    event: () => createMockEvent({ body: { form_slug: 'adhesion-2026', label: 'Adhésion 2026-2027', form_type: 'Membership', season: '2026-2027' } }),
    expected: { anonyme: 401, initiateur: 403, secretary: 403, admin: 'ok' },
  },
  {
    name: 'PATCH helloasso-forms/[id]',
    file: 'server/api/admin/helloasso-forms/[id].patch.ts',
    event: () => createMockEvent({ params: { id: 'form-1' }, body: { active: false } }),
    expected: { anonyme: 401, initiateur: 403, secretary: 403, admin: 'ok' },
  },
  { name: 'GET helloasso-forms', file: 'server/api/admin/helloasso-forms.get.ts', event: () => createMockEvent(), expected: { anonyme: 401, initiateur: 403, secretary: 'ok', admin: 'ok' } },
  { name: 'GET helloasso-stats', file: 'server/api/admin/helloasso-stats.get.ts', event: () => createMockEvent(), expected: { anonyme: 401, initiateur: 403, secretary: 'ok', admin: 'ok' } },
]

const FORM: Row = { id: 'form-1', form_slug: 'adhesion-fixture', label: 'Adhésion fictive', form_type: 'Membership', active: true, season: '2025-2026' }

function loginAs(who: Who) {
  const sb = createFakeSupabase({
    user_roles: who === 'anonyme' ? [] : [{ user_id: 'user-1', role_code: who }],
    helloasso_forms: [FORM],
    helloasso_tokens: [],
    profiles: [],
    group_members: [],
  })
  state.db = sb.client
  state.user = who === 'anonyme' ? null : { id: 'user-1' }
  return sb
}

describe('helloasso-socle — critère : répartition des rôles sur les routes HelloAsso', () => {
  beforeEach(() => {
    vi.resetModules()
    stubNitroGlobals()
    forbidNetwork()
    state.user = null
    state.rc = {
      helloasso: {
        clientId: 'client-fictif', clientSecret: 'secret-fictif-ne-pas-fuiter', orgSlug: 'asso-fictive',
        environment: 'sandbox', apiUrl: '', tokenUrl: '', webhookSecret: '',
      },
    }
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  for (const route of ROUTES) {
    describe(route.name, () => {
      for (const who of ['anonyme', 'initiateur', 'secretary', 'admin'] as Who[]) {
        const verdict = route.expected[who]

        if (verdict === 'ok') {
          it(`${who} : accepté (ni 401 ni 403)`, async () => {
            loginAs(who)
            const http = createFetchRouter({
              token: [{ json: fixture('token.ok') }],
              api: [{ json: fixture('form-types.ok').body }, { json: fixture('items.page-size-1') }],
            })
            vi.stubGlobal('fetch', http.fetch)
            const handler = (await loadModule(route.file)).default as (e: unknown) => Promise<unknown>
            const { error } = await settle(() => handler(route.event()))
            if (error) expect([401, 403]).not.toContain(error.statusCode)
          })
        }
        else {
          it(`${who} : refusé (${verdict}), sans lecture, écriture ni appel HelloAsso`, async () => {
            const sb = loginAs(who)
            const http = createFetchRouter()
            vi.stubGlobal('fetch', http.fetch)
            const handler = (await loadModule(route.file)).default as (e: unknown) => Promise<unknown>
            const { error } = await settle(() => handler(route.event()))
            expect(error).toBeDefined()
            expect(error.statusCode).toBe(verdict)
            // le garde s'exécute avant toute autre chose : seule la table des rôles a été lue
            const touched = sb.ops.filter(op => op.table !== 'user_roles')
            expect(touched).toEqual([])
            expect(http.calls).toHaveLength(0)
          })
        }
      }
    })
  }
})
