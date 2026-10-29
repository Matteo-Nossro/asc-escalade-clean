// T0 helloasso-socle — POST /api/admin/sync-helloasso passe par le client HelloAsso unique.
// Critères : « Les routes HelloAsso existantes passent par le nouveau client » · « aucune route
// n'appelle directement l'API ou l'endpoint OAuth » · la logique de rapprochement reste identique.
// Le client (useHelloAsso().get) est mocké ; le fetch global est un piège qui enregistre tout appel.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createMockEvent, stubNitroGlobals } from '../../utils/nitro'
import { createFakeSupabase, type Row } from '../../utils/fake-supabase'
import { loadModule, settle, fixture, forbidNetwork, FakeHelloAssoError } from '../../utils/helloasso-kit'

const ROUTE = 'server/api/admin/sync-helloasso.post.ts'

const h = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  haGet: vi.fn(),
  toH3Error: vi.fn(),
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
      config: { orgSlug: 'asso-fictive', environment: 'sandbox', apiUrl: 'https://api.helloasso-sandbox.com/v5' },
      get: h.haGet,
      post: vi.fn(),
      getAccessToken: vi.fn(),
    }),
    toH3Error: h.toH3Error,
    resolveHelloAssoConfig: vi.fn(),
    createHelloAssoClient: vi.fn(),
  }
})

const ITEMS = fixture('items.page-size-1')
const FORM = { id: 'form-1', form_slug: 'adhesion-fixture', form_type: 'Membership', active: true }
// L'item de la fixture : user « Adhérent Fictif », 12000 centimes, id 400001. Le rapprochement ignore les accents.
const PROFILE: Row = { id: 'profile-1', first_name: 'Adherent', last_name: 'Fictif' }

let fetchTrap: ReturnType<typeof forbidNetwork>

function setupDb(tables: Record<string, Row[]> = {}) {
  const sb = createFakeSupabase({ helloasso_forms: [FORM], profiles: [PROFILE], profile_payments: [], ...tables })
  h.db = sb.client
  return sb
}
const call = async () => {
  const handler = (await loadModule(ROUTE)).default as (e: unknown) => Promise<any>
  return settle(() => handler(createMockEvent()))
}

describe('POST /api/admin/sync-helloasso — critère : passe par le client HelloAsso unique', () => {
  beforeEach(() => {
    vi.resetModules()
    stubNitroGlobals()
    fetchTrap = forbidNetwork()
    h.requireAdmin.mockReset().mockResolvedValue({ userId: 'u1', roles: ['admin'] })
    h.haGet.mockReset()
    h.toH3Error.mockReset()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('le fetch global n\'est jamais appelé (ni OAuth, ni items)', async () => {
    setupDb()
    h.haGet.mockResolvedValue(ITEMS)
    await call()
    expect(fetchTrap).not.toHaveBeenCalled()
  })

  it('lit les items Membership du formulaire via useHelloAsso().get (chemin relatif à apiUrl)', async () => {
    setupDb()
    h.haGet.mockResolvedValue(ITEMS)
    await call()
    expect(h.haGet).toHaveBeenCalledTimes(1)
    expect(String(h.haGet.mock.calls[0]![0])).toContain('/organizations/asso-fictive/forms/Membership/adhesion-fixture/items')
    expect(String(h.haGet.mock.calls[0]![0])).not.toMatch(/^https?:/)
  })

  it('une page de moins de 100 items : un seul appel par formulaire', async () => {
    setupDb()
    h.haGet.mockResolvedValue(ITEMS)
    await call()
    expect(h.haGet).toHaveBeenCalledTimes(1)
  })

  it('rapprochement inchangé : l\'adhérent retrouvé est compté, son paiement est enregistré (120 €, order 400001)', async () => {
    const sb = setupDb()
    h.haGet.mockResolvedValue(ITEMS)
    const { value, error } = await call()
    expect(error).toBeUndefined()
    expect(value).toEqual({ matched: 1, unmatched: [] })
    const payments = sb.tables.profile_payments!
    expect(payments).toHaveLength(1)
    expect(payments[0]).toMatchObject({ profile_id: 'profile-1', form_id: 'form-1', helloasso_order_id: '400001', amount: 120 })
    expect(sb.tables.profiles!.find(p => p.id === 'profile-1')).toMatchObject({ payment_done: true, payment_amount: 120 })
  })

  it('rapprochement inchangé : un payeur sans profil est renvoyé dans unmatched, rien n\'est écrit', async () => {
    const sb = setupDb({ profiles: [{ id: 'profile-2', first_name: 'Autre', last_name: 'Personne' }] })
    h.haGet.mockResolvedValue(ITEMS)
    const { value } = await call()
    expect(value).toEqual({ matched: 0, unmatched: [{ firstName: 'Adhérent', lastName: 'Fictif' }] })
    expect(sb.tables.profile_payments).toHaveLength(0)
  })

  it('aucun formulaire Membership actif : { matched: 0, unmatched: [] } sans appel HelloAsso', async () => {
    setupDb({ helloasso_forms: [{ ...FORM, active: false }] })
    const { value } = await call()
    expect(value).toEqual({ matched: 0, unmatched: [] })
    expect(h.haGet).not.toHaveBeenCalled()
    expect(fetchTrap).not.toHaveBeenCalled()
  })

  it('erreur HelloAsso (429) : traduite par toH3Error, l\'erreur HTTP obtenue est relancée', async () => {
    setupDb()
    const original = new FakeHelloAssoError('rate_limited', 'Trop de requêtes', { status: 429, retryAfter: 7 })
    const h3 = Object.assign(new Error('Service indisponible'), { statusCode: 503 })
    h.haGet.mockRejectedValue(original)
    h.toH3Error.mockReturnValue(h3)
    const { error } = await call()
    expect(h.toH3Error).toHaveBeenCalledWith(original)
    expect(error).toBe(h3)
  })

  it('erreur HelloAsso : aucun paiement n\'est écrit', async () => {
    const sb = setupDb()
    h.haGet.mockRejectedValue(new FakeHelloAssoError('forbidden'))
    h.toH3Error.mockReturnValue(Object.assign(new Error('Bad gateway'), { statusCode: 502 }))
    await call()
    expect(h.haGet).toHaveBeenCalled() // l'échec vient bien de l'appel HelloAsso
    expect(sb.tables.profile_payments).toHaveLength(0)
  })

  it('refus de requireAdmin : rien n\'est lu en base ni appelé chez HelloAsso', async () => {
    const sb = setupDb()
    h.requireAdmin.mockRejectedValue(Object.assign(new Error('Accès refusé'), { statusCode: 403 }))
    const { error } = await call()
    expect(error).toMatchObject({ statusCode: 403 })
    expect(h.haGet).not.toHaveBeenCalled()
    expect(sb.from).not.toHaveBeenCalled()
  })
})
