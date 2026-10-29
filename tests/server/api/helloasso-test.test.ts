// T0 helloasso-socle — POST /api/admin/helloasso-test (« Tester la connexion »).
// Contrat : 2 étapes (publicData puis transactions), arrêt à la première erreur, réponse 200 dans tous
// les cas, message « privilège AccessTransactions manquant » réservé au 403 de l'étape transactions,
// jamais de secret, de jeton ni de donnée d'adhérent dans la réponse.
// Le client HelloAsso est mocké (son comportement est couvert par tests/server/utils/helloasso.test.ts).
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createMockEvent, stubNitroGlobals } from '../../utils/nitro'
import { loadModule, fixture, forbidNetwork, expectNoLeak, FakeHelloAssoError } from '../../utils/helloasso-kit'

const ROUTE = 'server/api/admin/helloasso-test.post.ts'

const h = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  useHelloAsso: vi.fn(),
}))
vi.mock('../../../server/utils/requireAdmin', () => ({ requireAdmin: h.requireAdmin }))
vi.mock('../../../server/utils/helloasso', async () => {
  const { FakeHelloAssoError: Err } = await import('../../utils/helloasso-kit')
  return {
    HelloAssoError: Err,
    useHelloAsso: h.useHelloAsso,
    resolveHelloAssoConfig: vi.fn(),
    createHelloAssoClient: vi.fn(),
    toH3Error: vi.fn(),
  }
})

const SECRET = 'secret-fictif-ne-pas-fuiter'
const ACCESS_TOKEN = 'fixture-access-token-ok'
const FORM_TYPES = fixture('form-types.ok').body
const ITEMS = fixture('items.page-size-1')
// Données d'adhérent présentes dans la réponse items (fixture) : ne doivent jamais ressortir.
const ITEM_DATA = ['payeur.fictif@example.com', 'Fictif', 'Prénom', 'Adhérent', '1 rue Fictive', 'Adhésion adulte fictive', 'fixture-qr-code', 'carte-adherent']
const NO_LEAK = [SECRET, ACCESS_TOKEN, 'client-fictif', ...ITEM_DATA]

function makeClient(get: ReturnType<typeof vi.fn>) {
  return {
    config: { clientId: 'client-fictif', clientSecret: SECRET, orgSlug: 'asso-fictive', environment: 'sandbox', apiUrl: 'https://api.helloasso-sandbox.com/v5', tokenUrl: 'https://api.helloasso-sandbox.com/oauth2/token', webhookSecret: 'wh-fictif' },
    getAccessToken: vi.fn(async () => ACCESS_TOKEN),
    get,
    post: vi.fn(),
  }
}
/** Chemin + query d'un appel `get(path, query?)`, sous la forme d'une URL relative. */
const urlOf = (call: unknown[]) => {
  const u = new URL(`http://x${call[0]}`)
  for (const [k, v] of Object.entries((call[1] as Record<string, unknown>) ?? {})) u.searchParams.set(k, String(v))
  return u.pathname + u.search
}

async function run(get: ReturnType<typeof vi.fn>) {
  h.useHelloAsso.mockReturnValue(makeClient(get))
  const handler = (await loadModule(ROUTE)).default as (e: unknown) => Promise<any>
  return handler(createMockEvent())
}

describe('POST /api/admin/helloasso-test', () => {
  beforeEach(() => {
    vi.resetModules()
    stubNitroGlobals()
    forbidNetwork()
    h.requireAdmin.mockReset().mockResolvedValue({ userId: 'u1', roles: ['admin'] })
    h.useHelloAsso.mockReset()
  })
  afterEach(() => vi.unstubAllGlobals())

  describe('critère : réservée à l\'admin', () => {
    it('demande requiredRole: \'admin\' à requireAdmin', async () => {
      const get = vi.fn().mockResolvedValueOnce(FORM_TYPES).mockResolvedValueOnce(ITEMS)
      const event = createMockEvent()
      h.useHelloAsso.mockReturnValue(makeClient(get))
      const handler = (await loadModule(ROUTE)).default as (e: unknown) => Promise<any>
      await handler(event)
      expect(h.requireAdmin).toHaveBeenCalledWith(event, expect.objectContaining({ requiredRole: 'admin' }))
    })

    it('non-admin refusé (403) : aucun client HelloAsso créé, aucun appel', async () => {
      h.requireAdmin.mockRejectedValue(Object.assign(new Error('Accès refusé'), { statusCode: 403 }))
      const get = vi.fn()
      h.useHelloAsso.mockReturnValue(makeClient(get))
      const handler = (await loadModule(ROUTE)).default as (e: unknown) => Promise<any>
      await expect(handler(createMockEvent())).rejects.toMatchObject({ statusCode: 403 })
      expect(h.useHelloAsso).not.toHaveBeenCalled()
      expect(get).not.toHaveBeenCalled()
    })
  })

  describe('critère : succès sur les 2 étapes', () => {
    it('renvoie ok: true, environnement, slug et checks publicData/transactions à « ok »', async () => {
      const get = vi.fn().mockResolvedValueOnce(FORM_TYPES).mockResolvedValueOnce(ITEMS)
      const res = await run(get)
      expect(res).toMatchObject({
        ok: true,
        environment: 'sandbox',
        orgSlug: 'asso-fictive',
        checks: { publicData: 'ok', transactions: 'ok' },
      })
    })

    it('fait exactement 2 appels API, dans l\'ordre : formTypes puis items?pageSize=1', async () => {
      const get = vi.fn().mockResolvedValueOnce(FORM_TYPES).mockResolvedValueOnce(ITEMS)
      await run(get)
      expect(get).toHaveBeenCalledTimes(2)
      expect(urlOf(get.mock.calls[0]!)).toBe('/organizations/asso-fictive/formTypes')
      expect(urlOf(get.mock.calls[1]!)).toBe('/organizations/asso-fictive/items?pageSize=1')
    })

    it('formTypes, s\'il est renvoyé, est la liste des types de formulaires', async () => {
      const get = vi.fn().mockResolvedValueOnce(FORM_TYPES).mockResolvedValueOnce(ITEMS)
      const res = await run(get)
      if (res.formTypes !== undefined) expect(res.formTypes).toEqual(FORM_TYPES)
      expect(res.ok).toBe(true)
    })

    it('aucune fuite : ni secret, ni jeton, ni donnée d\'item dans la réponse', async () => {
      const get = vi.fn().mockResolvedValueOnce(FORM_TYPES).mockResolvedValueOnce(ITEMS)
      expectNoLeak(await run(get), NO_LEAK)
    })
  })

  describe('critère : échec à l\'étape publicData', () => {
    it.each(['forbidden', 'unauthorized', 'auth_failed', 'rate_limited', 'network', 'http_error'])(
      '%s : réponse 200 { ok: false, step: \'publicData\', code }, et l\'appel items n\'est pas lancé',
      async (code) => {
        const get = vi.fn().mockRejectedValueOnce(new FakeHelloAssoError(code, `échec ${code}`))
        const res = await run(get)
        expect(res).toMatchObject({ ok: false, step: 'publicData', code })
        expect(typeof res.message).toBe('string')
        expect(get).toHaveBeenCalledTimes(1)
        expect(urlOf(get.mock.calls[0]!)).toBe('/organizations/asso-fictive/formTypes')
      },
    )

    it('403 à publicData : forbidden avec un message générique (sans « privilège AccessTransactions manquant »)', async () => {
      const get = vi.fn().mockRejectedValueOnce(new FakeHelloAssoError('forbidden', 'accès refusé'))
      const res = await run(get)
      expect(res).toMatchObject({ ok: false, step: 'publicData', code: 'forbidden' })
      expect(res.message).not.toContain('privilège AccessTransactions manquant')
    })

    it('ne contient pas de checks.transactions « ok »', async () => {
      const get = vi.fn().mockRejectedValueOnce(new FakeHelloAssoError('network'))
      const res = await run(get)
      expect(res.checks?.transactions).not.toBe('ok')
    })
  })

  describe('critère : échec à l\'étape transactions', () => {
    it('403 sur items : step transactions, code forbidden, message « privilège AccessTransactions manquant »', async () => {
      const get = vi.fn().mockResolvedValueOnce(FORM_TYPES).mockRejectedValueOnce(new FakeHelloAssoError('forbidden', 'accès refusé', { status: 403 }))
      const res = await run(get)
      expect(res).toMatchObject({ ok: false, step: 'transactions', code: 'forbidden' })
      expect(res.message).toContain('privilège AccessTransactions manquant')
    })

    it('le message du 403 transactions invite à vérifier les droits du client API (message neutre, sans « régénérer »)', async () => {
      const get = vi.fn().mockResolvedValueOnce(FORM_TYPES).mockRejectedValueOnce(new FakeHelloAssoError('forbidden', 'accès refusé'))
      const res = await run(get)
      expect(res.message).toContain('vérifiez les droits du client API dans le back-office HelloAsso')
      expect(res.message).not.toMatch(/régénér/i)
    })

    it.each(['unauthorized', 'rate_limited', 'network', 'http_error'])(
      '%s à transactions : step transactions, code conservé, SANS le message AccessTransactions',
      async (code) => {
        const get = vi.fn().mockResolvedValueOnce(FORM_TYPES).mockRejectedValueOnce(new FakeHelloAssoError(code, `échec ${code}`))
        const res = await run(get)
        expect(res).toMatchObject({ ok: false, step: 'transactions', code })
        expect(res.message).not.toContain('privilège AccessTransactions manquant')
      },
    )

    it('l\'étape publicData réussie est signalée dans checks', async () => {
      const get = vi.fn().mockResolvedValueOnce(FORM_TYPES).mockRejectedValueOnce(new FakeHelloAssoError('forbidden'))
      const res = await run(get)
      expect(res.checks?.publicData).toBe('ok')
      expect(res.checks?.transactions).not.toBe('ok')
    })

    it('aucune fuite sur un échec : ni secret, ni jeton, ni donnée d\'item', async () => {
      const get = vi.fn().mockResolvedValueOnce(FORM_TYPES).mockRejectedValueOnce(new FakeHelloAssoError('forbidden'))
      expectNoLeak(await run(get), NO_LEAK)
    })
  })

  describe('critère : configuration absente ou invalide', () => {
    it('useHelloAsso lève config_missing : { ok: false, step: \'config\', code: \'config_missing\' }, aucun appel API', async () => {
      const get = vi.fn()
      h.useHelloAsso.mockImplementation(() => { throw new FakeHelloAssoError('config_missing', 'Configuration HelloAsso incomplète : clientId') })
      const handler = (await loadModule(ROUTE)).default as (e: unknown) => Promise<any>
      const res = await handler(createMockEvent())
      expect(res).toMatchObject({ ok: false, step: 'config', code: 'config_missing' })
      expect(res.message).toContain('clientId')
      expect(get).not.toHaveBeenCalled()
      expectNoLeak(res, NO_LEAK)
    })
  })
})
