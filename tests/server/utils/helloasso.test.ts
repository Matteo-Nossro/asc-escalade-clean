// T0 helloasso-socle — client HelloAsso serveur (server/utils/helloasso.ts), contrat figé du plan.
// Critères : module unique · jeton OAuth partagé en base et renouvelé sous verrou · 401 · 429 ·
// configuration par runtimeConfig serveur. fetch stubé : AUCUN appel réseau réel.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { createMockEvent, stubNitroGlobals } from '../../utils/nitro'
import { createFakeSupabase, isLockFree, type Row } from '../../utils/fake-supabase'
import {
  loadModule, catchErr, fixture, createFetchRouter, createSleep, forbidNetwork,
  formOf, grantOf, bearerOf, expectNoLeak, inMs, MIN, DAY, type ReplySpec,
} from '../../utils/helloasso-kit'

const MODULE = 'server/utils/helloasso.ts'

// useHelloAsso(event) lit useRuntimeConfig(event) et serverSupabaseServiceRole(event)
const state = vi.hoisted(() => ({ rc: {} as Record<string, any>, db: null as any }))
mockNuxtImport('useRuntimeConfig', original => () => ({ ...original(), ...state.rc }))
vi.mock('#supabase/server', () => ({
  serverSupabaseServiceRole: () => state.db,
  serverSupabaseUser: async () => null,
}))

const SECRET = 'secret-fictif-ne-pas-fuiter'
const CONFIG = {
  clientId: 'client-fictif',
  clientSecret: SECRET,
  orgSlug: 'asso-fictive',
  environment: 'sandbox',
  apiUrl: 'https://api.helloasso-sandbox.com/v5',
  tokenUrl: 'https://api.helloasso-sandbox.com/oauth2/token',
  webhookSecret: 'webhook-fictif',
}
const PROD = {
  environment: 'production',
  apiUrl: 'https://api.helloasso.com/v5',
  tokenUrl: 'https://api.helloasso.com/oauth2/token',
}
const FT_PATH = '/organizations/asso-fictive/formTypes'
const FORM_TYPES = fixture('form-types.ok').body
const TOKEN_OK = fixture('token.ok')
const TOKEN_REFRESHED = fixture('token.refreshed')
const LEAKS = [SECRET, 'fixture-access-token', 'fixture-refresh-token']

const tokenRow = (over: Row = {}): Row => ({
  environment: 'sandbox',
  client_id: CONFIG.clientId,
  access_token: 'fixture-access-token-cached',
  access_expires_at: inMs(20 * MIN),
  refresh_token: 'fixture-refresh-token-cached',
  refresh_expires_at: inMs(10 * DAY),
  lock_holder: null,
  lock_until: null,
  ...over,
})
/** Ligne dont le jeton d'accès est expiré et qui n'a plus de refresh : seul client_credentials reste. */
const expiredRow = (over: Row = {}) =>
  tokenRow({ access_token: 'ancien-jeton', access_expires_at: inMs(-MIN), refresh_token: null, refresh_expires_at: null, ...over })

const rcOf = (cfg: Record<string, any>) => ({ ...cfg, helloasso: cfg }) // tolère rc = runtimeConfig ou rc = runtimeConfig.helloasso

async function setup(o: { rows?: Row[], token?: ReplySpec[], api?: ReplySpec[], config?: Record<string, any>, sleep?: ReturnType<typeof createSleep> } = {}) {
  const mod = await loadModule(MODULE)
  const sb = createFakeSupabase({ helloasso_tokens: o.rows ?? [] })
  const http = createFetchRouter({ token: o.token, api: o.api })
  vi.stubGlobal('fetch', http.fetch)
  const sleep = o.sleep ?? createSleep()
  const client = mod.createHelloAssoClient({ config: { ...CONFIG, ...o.config }, supabase: sb.client, sleep })
  const row = (env = 'sandbox') => sb.tables.helloasso_tokens!.find(r => r.environment === env)
  return { mod, sb, http, sleep, client, row }
}

describe('helloasso-socle — client HelloAsso', () => {
  beforeEach(() => {
    stubNitroGlobals()
    forbidNetwork()
    state.rc = {}
    state.db = null
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  // ---------------------------------------------------------------------------------------------
  describe('critère : configuration runtimeConfig.helloasso (resolveHelloAssoConfig)', () => {
    const base = { clientId: 'client-fictif', clientSecret: SECRET, orgSlug: 'asso-fictive', environment: 'sandbox', apiUrl: '', tokenUrl: '', webhookSecret: '' }

    it('sandbox sans URL explicite : URLs par défaut de la sandbox', async () => {
      const { resolveHelloAssoConfig } = await loadModule(MODULE)
      const cfg = resolveHelloAssoConfig(rcOf(base))
      expect(cfg.environment).toBe('sandbox')
      expect(cfg.apiUrl).toBe('https://api.helloasso-sandbox.com/v5')
      expect(cfg.tokenUrl).toBe('https://api.helloasso-sandbox.com/oauth2/token')
    })

    it('production sans URL explicite : URLs par défaut de la production', async () => {
      const { resolveHelloAssoConfig } = await loadModule(MODULE)
      const cfg = resolveHelloAssoConfig(rcOf({ ...base, environment: 'production' }))
      expect(cfg.environment).toBe('production')
      expect(cfg.apiUrl).toBe('https://api.helloasso.com/v5')
      expect(cfg.tokenUrl).toBe('https://api.helloasso.com/oauth2/token')
    })

    it('apiUrl et tokenUrl explicites : conservées', async () => {
      const { resolveHelloAssoConfig } = await loadModule(MODULE)
      const cfg = resolveHelloAssoConfig(rcOf({ ...base, apiUrl: 'https://proxy.exemple.test/v5', tokenUrl: 'https://proxy.exemple.test/oauth2/token' }))
      expect(cfg.apiUrl).toBe('https://proxy.exemple.test/v5')
      expect(cfg.tokenUrl).toBe('https://proxy.exemple.test/oauth2/token')
    })

    it('conserve clientId, clientSecret et orgSlug', async () => {
      const { resolveHelloAssoConfig } = await loadModule(MODULE)
      const cfg = resolveHelloAssoConfig(rcOf(base))
      expect(cfg).toMatchObject({ clientId: 'client-fictif', clientSecret: SECRET, orgSlug: 'asso-fictive' })
    })

    it.each(['clientId', 'clientSecret', 'orgSlug', 'environment'])('%s manquant : config_missing qui cite la clé, sans fetch ni valeur secrète', async (key) => {
      const mod = await loadModule(MODULE)
      const fetchStub = forbidNetwork()
      const err = await catchErr(() => mod.resolveHelloAssoConfig(rcOf({ ...base, [key]: '' })))
      expect(err).toBeInstanceOf(mod.HelloAssoError)
      expect(err.code).toBe('config_missing')
      expect(err.message).toContain(key)
      expectNoLeak(err, [SECRET, 'webhook-fictif'])
      expect(fetchStub).not.toHaveBeenCalled()
    })

    it('plusieurs clés manquantes : toutes citées par leur nom', async () => {
      const mod = await loadModule(MODULE)
      const err = await catchErr(() => mod.resolveHelloAssoConfig(rcOf({ ...base, clientId: '', orgSlug: '' })))
      expect(err.code).toBe('config_missing')
      expect(err.message).toContain('clientId')
      expect(err.message).toContain('orgSlug')
      expectNoLeak(err, [SECRET])
    })

    it('environnement sans valeur par défaut : config absente => config_missing (pas de TypeError)', async () => {
      const mod = await loadModule(MODULE)
      const err = await catchErr(() => mod.resolveHelloAssoConfig({}))
      expect(err).toBeInstanceOf(mod.HelloAssoError)
      expect(err.code).toBe('config_missing')
      expect(err.message).toContain('environment')
    })

    it.each(['staging', 'prod', 'test'])('environnement invalide « %s » : config_missing', async (environment) => {
      const mod = await loadModule(MODULE)
      const err = await catchErr(() => mod.resolveHelloAssoConfig(rcOf({ ...base, environment })))
      expect(err).toBeInstanceOf(mod.HelloAssoError)
      expect(err.code).toBe('config_missing')
      expectNoLeak(err, [SECRET])
    })

    it('webhookSecret vide : n\'empêche pas le client (il ne sert qu\'au lot 7)', async () => {
      const { resolveHelloAssoConfig } = await loadModule(MODULE)
      expect(() => resolveHelloAssoConfig(rcOf({ ...base, webhookSecret: '' }))).not.toThrow()
    })
  })

  // ---------------------------------------------------------------------------------------------
  describe('critère : jeton mis en cache en base, partagé entre instances', () => {
    it('jeton valide en base : 0 appel d\'auth, 0 verrou, en-tête Bearer présent', async () => {
      const ctx = await setup({ rows: [tokenRow()], api: [{ json: FORM_TYPES }] })
      const body = await ctx.client.get(FT_PATH)
      expect(body).toEqual(FORM_TYPES)
      expect(ctx.http.tokenCalls()).toHaveLength(0)
      expect(ctx.sb.rpc).not.toHaveBeenCalled()
      expect(ctx.http.apiCalls()).toHaveLength(1)
      expect(bearerOf(ctx.http.apiCalls()[0]!)).toBe('Bearer fixture-access-token-cached')
    })

    it('get() appelle apiUrl + path en GET, query ajoutée à l\'URL', async () => {
      const ctx = await setup({ rows: [tokenRow()], api: [{ json: fixture('items.page-size-1') }] })
      await ctx.client.get('/organizations/asso-fictive/items', { pageSize: 1 })
      const call = ctx.http.apiCalls()[0]!
      const url = new URL(call.url)
      expect(call.method).toBe('GET')
      expect(url.origin + url.pathname).toBe('https://api.helloasso-sandbox.com/v5/organizations/asso-fictive/items')
      expect(url.searchParams.get('pageSize')).toBe('1')
    })

    it('post() envoie le corps en JSON avec le Bearer', async () => {
      const ctx = await setup({ rows: [tokenRow()], api: [{ json: { ok: true } }] })
      await ctx.client.post('/organizations/asso-fictive/exemple', { a: 1 })
      const call = ctx.http.apiCalls()[0]!
      expect(call.method).toBe('POST')
      expect(call.url).toBe('https://api.helloasso-sandbox.com/v5/organizations/asso-fictive/exemple')
      expect(call.headers['content-type']).toContain('application/json')
      expect(JSON.parse(call.body!)).toEqual({ a: 1 })
      expect(bearerOf(call)).toBe('Bearer fixture-access-token-cached')
    })

    it('getAccessToken() renvoie le jeton valide de la base', async () => {
      const ctx = await setup({ rows: [tokenRow()] })
      await expect(ctx.client.getAccessToken()).resolves.toBe('fixture-access-token-cached')
      expect(ctx.http.fetch).not.toHaveBeenCalled()
    })

    it('le client expose sa config résolue', async () => {
      const ctx = await setup()
      expect(ctx.client.config).toMatchObject({ orgSlug: 'asso-fictive', environment: 'sandbox' })
    })

    it('une ligne par environnement : en production, la ligne sandbox est ignorée et laissée intacte', async () => {
      const sandboxRow = tokenRow()
      const ctx = await setup({ rows: [sandboxRow], config: PROD, token: [{ json: TOKEN_OK }], api: [{ json: FORM_TYPES }] })
      await ctx.client.get(FT_PATH)
      const [auth] = ctx.http.tokenCalls()
      expect(ctx.http.tokenCalls()).toHaveLength(1)
      expect(auth!.url).toBe('https://api.helloasso.com/oauth2/token')
      expect(ctx.http.apiCalls()[0]!.url.startsWith('https://api.helloasso.com/v5/')).toBe(true)
      expect(ctx.sb.rpc).toHaveBeenCalledWith('helloasso_acquire_token_lock', expect.objectContaining({ p_environment: 'production' }))
      expect(ctx.row('production')).toMatchObject({ access_token: 'fixture-access-token-ok' })
      expect(ctx.row('sandbox')).toMatchObject({ access_token: 'fixture-access-token-cached' })
    })
  })

  // ---------------------------------------------------------------------------------------------
  describe('critère : obtention en client_credentials, un seul appel d\'auth par renouvellement', () => {
    it.each([
      ['aucune ligne en base', () => []],
      ['jeton expiré et pas de refresh_token', () => [expiredRow()]],
      ['jeton expiré et refresh_token expiré', () => [expiredRow({ refresh_token: 'fixture-refresh-token-cached', refresh_expires_at: inMs(-DAY) })]],
    ])('%s : 1 seul appel client_credentials, form-urlencoded', async (_nom, rows) => {
      const ctx = await setup({ rows: rows(), token: [{ json: TOKEN_OK }], api: [{ json: FORM_TYPES }] })
      await ctx.client.get(FT_PATH)
      expect(ctx.http.tokenCalls()).toHaveLength(1)
      const call = ctx.http.tokenCalls()[0]!
      expect(call.method).toBe('POST')
      expect(call.url).toBe(CONFIG.tokenUrl)
      expect(call.headers['content-type']).toContain('application/x-www-form-urlencoded')
      const form = formOf(call)
      expect(form.get('grant_type')).toBe('client_credentials')
      expect(form.get('client_id')).toBe('client-fictif')
      expect(form.get('client_secret')).toBe(SECRET)
      expect(bearerOf(ctx.http.apiCalls()[0]!)).toBe('Bearer fixture-access-token-ok')
    })

    it('écrit en base le couple de jetons, le client_id et les dates d\'expiration', async () => {
      const t0 = Date.now()
      const ctx = await setup({ token: [{ json: TOKEN_OK }], api: [{ json: FORM_TYPES }] })
      await ctx.client.get(FT_PATH)
      const t1 = Date.now()
      const row = ctx.row()!
      expect(row).toMatchObject({
        environment: 'sandbox',
        client_id: 'client-fictif',
        access_token: 'fixture-access-token-ok',
        refresh_token: 'fixture-refresh-token-ok',
      })
      // expires_in = 1799 s (fixture)
      expect(Date.parse(row.access_expires_at)).toBeGreaterThanOrEqual(t0 + 1799_000 - 60_000)
      expect(Date.parse(row.access_expires_at)).toBeLessThanOrEqual(t1 + 1799_000 + 5_000)
      expect(Date.parse(row.refresh_expires_at)).toBeGreaterThan(Date.now() + DAY)
    })

    it('prend le verrou via la RPC helloasso_acquire_token_lock (environnement + détenteur) et le libère', async () => {
      const ctx = await setup({ token: [{ json: TOKEN_OK }], api: [{ json: FORM_TYPES }] })
      await ctx.client.get(FT_PATH)
      expect(ctx.sb.rpc).toHaveBeenCalledTimes(1)
      expect(ctx.sb.rpc).toHaveBeenCalledWith('helloasso_acquire_token_lock', expect.objectContaining({
        p_environment: 'sandbox',
        p_holder: expect.any(String),
      }))
      expect(isLockFree(ctx.row())).toBe(true)
    })

    it('le jeton expire dans moins de 5 min : renouvelé avant expiration', async () => {
      const ctx = await setup({
        rows: [tokenRow({ access_expires_at: inMs(4 * MIN), refresh_token: null, refresh_expires_at: null })],
        token: [{ json: TOKEN_OK }], api: [{ json: FORM_TYPES }],
      })
      await ctx.client.get(FT_PATH)
      expect(ctx.http.tokenCalls()).toHaveLength(1)
      expect(bearerOf(ctx.http.apiCalls()[0]!)).toBe('Bearer fixture-access-token-ok')
    })

    it('le jeton expire dans plus de 5 min : réutilisé tel quel', async () => {
      const ctx = await setup({ rows: [tokenRow({ access_expires_at: inMs(6 * MIN) })], api: [{ json: FORM_TYPES }] })
      await ctx.client.get(FT_PATH)
      expect(ctx.http.tokenCalls()).toHaveLength(0)
    })

    it.each([
      ['client_id différent', 'autre-client'],
      ['client_id vide', ''],
      ['client_id absent', null],
    ])('ligne ignorée (%s) : nouvel appel client_credentials, même si un refresh_token existe', async (_nom, clientId) => {
      const ctx = await setup({
        rows: [tokenRow({ client_id: clientId })], // jeton et refresh encore valides
        token: [{ json: TOKEN_OK }], api: [{ json: FORM_TYPES }],
      })
      await ctx.client.get(FT_PATH)
      expect(ctx.http.tokenCalls()).toHaveLength(1)
      expect(grantOf(ctx.http.tokenCalls()[0]!)).toBe('client_credentials')
      expect(bearerOf(ctx.http.apiCalls()[0]!)).toBe('Bearer fixture-access-token-ok')
      expect(ctx.row()!.client_id).toBe('client-fictif')
    })
  })

  // ---------------------------------------------------------------------------------------------
  describe('critère : renouvellement par refresh_token, par un seul chemin (verrou)', () => {
    const refreshable = () => tokenRow({ access_token: 'ancien-jeton', access_expires_at: inMs(-MIN) })

    it('refresh_token valide : 1 seul appel grant_type=refresh_token (pas de client_credentials)', async () => {
      const ctx = await setup({ rows: [refreshable()], token: [{ json: TOKEN_REFRESHED }], api: [{ json: FORM_TYPES }] })
      await ctx.client.get(FT_PATH)
      expect(ctx.http.tokenCalls()).toHaveLength(1)
      const call = ctx.http.tokenCalls()[0]!
      expect(grantOf(call)).toBe('refresh_token')
      expect(formOf(call).get('refresh_token')).toBe('fixture-refresh-token-cached')
      expect(call.headers['content-type']).toContain('application/x-www-form-urlencoded')
      expect(bearerOf(ctx.http.apiCalls()[0]!)).toBe('Bearer fixture-access-token-refreshed')
    })

    // Ajouté après la revue (2026-10-28) : corps identique au refresh validé en sandbox en P0.
    it('refresh : le corps ne contient que grant_type et refresh_token (ni client_id ni client_secret)', async () => {
      const ctx = await setup({ rows: [refreshable()], token: [{ json: TOKEN_REFRESHED }], api: [{ json: FORM_TYPES }] })
      await ctx.client.get(FT_PATH)
      expect([...formOf(ctx.http.tokenCalls()[0]!).keys()].sort()).toEqual(['grant_type', 'refresh_token'])
    })

    it('écrit le nouveau couple de jetons (le refresh_token tourne) et libère le verrou', async () => {
      const ctx = await setup({ rows: [refreshable()], token: [{ json: TOKEN_REFRESHED }], api: [{ json: FORM_TYPES }] })
      await ctx.client.get(FT_PATH)
      expect(ctx.row()).toMatchObject({
        access_token: 'fixture-access-token-refreshed',
        refresh_token: 'fixture-refresh-token-refreshed',
        client_id: 'client-fictif',
      })
      expect(Date.parse(ctx.row()!.access_expires_at)).toBeGreaterThan(Date.now() + 25 * MIN)
      expect(isLockFree(ctx.row())).toBe(true)
    })

    it('écriture conditionnée à lock_holder : une instance qui a perdu le verrou n\'écrase rien', async () => {
      const ctx: Awaited<ReturnType<typeof setup>> = await setup({
        rows: [expiredRow()],
        token: [() => {
          // pendant l'appel d'auth, une autre instance a repris le verrou
          ctx.sb.tables.helloasso_tokens![0]!.lock_holder = 'uuid-autre-instance'
          return { json: TOKEN_OK }
        }],
        api: [{ json: FORM_TYPES }],
      })
      await catchErr(() => ctx.client.get(FT_PATH))
      expect(ctx.row()!.access_token).toBe('ancien-jeton')
      expect(ctx.row()!.refresh_token ?? null).toBeNull()
      expect(ctx.row()!.lock_holder).toBe('uuid-autre-instance')
    })

    it('3 get() concurrents sans jeton : 1 seul appel d\'auth, 1 seule prise de verrou, 3 appels API', async () => {
      const ctx = await setup({
        token: [async () => { await new Promise(r => setTimeout(r, 15)); return { json: TOKEN_OK } }],
        api: [{ json: FORM_TYPES }, { json: FORM_TYPES }, { json: FORM_TYPES }],
      })
      const results = await Promise.all([ctx.client.get(FT_PATH), ctx.client.get(FT_PATH), ctx.client.get(FT_PATH)])
      expect(results).toEqual([FORM_TYPES, FORM_TYPES, FORM_TYPES])
      expect(ctx.http.tokenCalls()).toHaveLength(1)
      expect(ctx.sb.rpc).toHaveBeenCalledTimes(1)
      expect(ctx.http.apiCalls()).toHaveLength(3)
      for (const call of ctx.http.apiCalls()) expect(bearerOf(call)).toBe('Bearer fixture-access-token-ok')
    })
  })

  // ---------------------------------------------------------------------------------------------
  describe('critère : verrou déjà pris par une autre instance', () => {
    const lockedByOther = () => expiredRow({ lock_holder: 'uuid-autre-instance', lock_until: inMs(20_000) })

    it('verrou perdu et jeton jamais renouvelé : lock_timeout, 0 appel d\'auth, 0 appel API, relecture bornée', async () => {
      const ctx = await setup({ rows: [lockedByOther()] })
      const err = await catchErr(() => ctx.client.get(FT_PATH))
      expect(err).toBeInstanceOf(ctx.mod.HelloAssoError)
      expect(err.code).toBe('lock_timeout')
      expect(ctx.http.tokenCalls()).toHaveLength(0)
      expect(ctx.http.apiCalls()).toHaveLength(0)
      expect(ctx.sleep).toHaveBeenCalled()
      expect(ctx.sleep.mock.calls.length).toBeLessThanOrEqual(100)
      expectNoLeak(err, LEAKS)
    })

    it('verrou perdu puis jeton écrit par l\'autre instance : jeton relu, 0 appel d\'auth', async () => {
      const sleep = createSleep({
        onCall: (n) => {
          if (n === 1) {
            Object.assign(ctx.sb.tables.helloasso_tokens![0]!, {
              access_token: 'fixture-access-token-autre-instance',
              access_expires_at: inMs(25 * MIN),
              lock_holder: null,
              lock_until: null,
            })
          }
        },
      })
      const ctx: Awaited<ReturnType<typeof setup>> = await setup({ rows: [lockedByOther()], api: [{ json: FORM_TYPES }], sleep })
      const body = await ctx.client.get(FT_PATH)
      expect(body).toEqual(FORM_TYPES)
      expect(ctx.http.tokenCalls()).toHaveLength(0)
      expect(bearerOf(ctx.http.apiCalls()[0]!)).toBe('Bearer fixture-access-token-autre-instance')
    })

    it('RPC à false (verrou refusé) : même comportement, sans toucher à l\'endpoint d\'auth', async () => {
      const ctx = await setup({ rows: [expiredRow()] })
      ctx.sb.rpc.mockImplementation(() => Promise.resolve({ data: false, error: null }))
      const err = await catchErr(() => ctx.client.get(FT_PATH))
      expect(err.code).toBe('lock_timeout')
      expect(ctx.http.tokenCalls()).toHaveLength(0)
    })
  })

  // ---------------------------------------------------------------------------------------------
  describe('critère : 401 de l\'API => une seule ré-authentification puis une erreur claire', () => {
    it('401 puis succès : 1 seule ré-auth et 1 seul rejeu avec le nouveau jeton', async () => {
      const ctx = await setup({
        rows: [tokenRow({ refresh_token: null, refresh_expires_at: null })],
        token: [{ json: TOKEN_OK }],
        api: [{ status: 401 }, { json: FORM_TYPES }],
      })
      const body = await ctx.client.get(FT_PATH)
      expect(body).toEqual(FORM_TYPES)
      expect(ctx.http.tokenCalls()).toHaveLength(1)
      expect(ctx.http.apiCalls()).toHaveLength(2)
      expect(bearerOf(ctx.http.apiCalls()[0]!)).toBe('Bearer fixture-access-token-cached')
      expect(bearerOf(ctx.http.apiCalls()[1]!)).toBe('Bearer fixture-access-token-ok')
    })

    it('401 puis 401 : unauthorized, 2 appels API et 1 appel d\'auth au total, jetons absents du message', async () => {
      const ctx = await setup({
        rows: [tokenRow({ refresh_token: null, refresh_expires_at: null })],
        token: [{ json: TOKEN_OK }],
        api: [{ status: 401 }, { status: 401 }],
      })
      const err = await catchErr(() => ctx.client.get(FT_PATH))
      expect(err).toBeInstanceOf(ctx.mod.HelloAssoError)
      expect(err.code).toBe('unauthorized')
      expect(ctx.http.apiCalls()).toHaveLength(2)
      expect(ctx.http.tokenCalls()).toHaveLength(1)
      expectNoLeak(err, LEAKS)
    })
  })

  // ---------------------------------------------------------------------------------------------
  describe('critère : refus de l\'endpoint d\'auth (400/401)', () => {
    it.each([400, 401])('refresh refusé (%i) : auth_failed, refresh_token effacé, 1 seul appel d\'auth, aucun appel API', async (status) => {
      const ctx = await setup({
        rows: [tokenRow({ access_token: 'ancien-jeton', access_expires_at: inMs(-MIN) })],
        token: [{ status }],
      })
      const err = await catchErr(() => ctx.client.get(FT_PATH))
      expect(err).toBeInstanceOf(ctx.mod.HelloAssoError)
      expect(err.code).toBe('auth_failed')
      expect(ctx.http.tokenCalls()).toHaveLength(1)
      expect(grantOf(ctx.http.tokenCalls()[0]!)).toBe('refresh_token')
      expect(ctx.http.apiCalls()).toHaveLength(0)
      expect(ctx.row()!.refresh_token ?? null).toBeNull()
      expectNoLeak(err, LEAKS)
    })

    it('refresh refusé : le verrou est libéré', async () => {
      const ctx = await setup({
        rows: [tokenRow({ access_token: 'ancien-jeton', access_expires_at: inMs(-MIN) })],
        token: [{ status: 400 }],
      })
      await catchErr(() => ctx.client.get(FT_PATH))
      expect(isLockFree(ctx.row())).toBe(true)
    })

    it('refresh refusé : l\'appel suivant repasse en client_credentials', async () => {
      const ctx = await setup({
        rows: [tokenRow({ access_token: 'ancien-jeton', access_expires_at: inMs(-MIN) })],
        token: [{ status: 400 }, { json: TOKEN_OK }],
        api: [{ json: FORM_TYPES }],
      })
      await catchErr(() => ctx.client.get(FT_PATH))
      const body = await ctx.client.get(FT_PATH)
      expect(body).toEqual(FORM_TYPES)
      expect(ctx.http.tokenCalls()).toHaveLength(2)
      expect(grantOf(ctx.http.tokenCalls()[1]!)).toBe('client_credentials')
    })

    it.each([400, 401])('client_credentials refusé (%i) : auth_failed, 1 seul appel d\'auth, aucun secret dans l\'erreur', async (status) => {
      const ctx = await setup({ token: [{ status }] })
      const err = await catchErr(() => ctx.client.get(FT_PATH))
      expect(err).toBeInstanceOf(ctx.mod.HelloAssoError)
      expect(err.code).toBe('auth_failed')
      expect(ctx.http.tokenCalls()).toHaveLength(1)
      expect(ctx.http.apiCalls()).toHaveLength(0)
      expectNoLeak(err, LEAKS)
    })
  })

  // ---------------------------------------------------------------------------------------------
  describe('critère : 429 sans boucle, erreur exploitable', () => {
    it('429 sur l\'API : rate_limited immédiat, un seul appel API, retryAfter lu, aucune ré-auth', async () => {
      const ctx = await setup({ rows: [tokenRow()], api: [{ status: 429, headers: { 'Retry-After': '7' } }] })
      const err = await catchErr(() => ctx.client.get(FT_PATH))
      expect(err).toBeInstanceOf(ctx.mod.HelloAssoError)
      expect(err.code).toBe('rate_limited')
      expect(err.retryAfter).toBe(7)
      expect(ctx.http.apiCalls()).toHaveLength(1)
      expect(ctx.http.tokenCalls()).toHaveLength(0)
      expectNoLeak(err, LEAKS)
    })

    it('429 sans en-tête Retry-After : rate_limited, retryAfter indéfini', async () => {
      const ctx = await setup({ rows: [tokenRow()], api: [{ status: 429 }] })
      const err = await catchErr(() => ctx.client.get(FT_PATH))
      expect(err.code).toBe('rate_limited')
      expect(err.retryAfter).toBeUndefined()
      expect(ctx.http.apiCalls()).toHaveLength(1)
    })

    it('429 sur l\'endpoint d\'auth : rate_limited immédiat, un seul appel d\'auth, retryAfter lu, aucun appel API', async () => {
      const ctx = await setup({ token: [{ status: 429, headers: { 'Retry-After': '12' } }] })
      const err = await catchErr(() => ctx.client.get(FT_PATH))
      expect(err).toBeInstanceOf(ctx.mod.HelloAssoError)
      expect(err.code).toBe('rate_limited')
      expect(err.retryAfter).toBe(12)
      expect(ctx.http.tokenCalls()).toHaveLength(1)
      expect(ctx.http.apiCalls()).toHaveLength(0)
    })
  })

  // ---------------------------------------------------------------------------------------------
  describe('critère : 403, erreur réseau et autres statuts, sans boucle', () => {
    it('403 : forbidden, un seul appel API, aucune ré-auth', async () => {
      const ctx = await setup({ rows: [tokenRow()], api: [{ status: 403 }] })
      const err = await catchErr(() => ctx.client.get(FT_PATH))
      expect(err).toBeInstanceOf(ctx.mod.HelloAssoError)
      expect(err.code).toBe('forbidden')
      expect(err.status).toBe(403)
      expect(ctx.http.apiCalls()).toHaveLength(1)
      expect(ctx.http.tokenCalls()).toHaveLength(0)
    })

    it('erreur réseau sur l\'API : network, un seul appel, aucune boucle', async () => {
      const ctx = await setup({ rows: [tokenRow()], api: [{ networkError: true }] })
      const err = await catchErr(() => ctx.client.get(FT_PATH))
      expect(err).toBeInstanceOf(ctx.mod.HelloAssoError)
      expect(err.code).toBe('network')
      expect(ctx.http.apiCalls()).toHaveLength(1)
      expect(ctx.http.tokenCalls()).toHaveLength(0)
    })

    it('erreur réseau sur l\'endpoint d\'auth : network, un seul appel d\'auth', async () => {
      const ctx = await setup({ token: [{ networkError: true }] })
      const err = await catchErr(() => ctx.client.get(FT_PATH))
      expect(err.code).toBe('network')
      expect(ctx.http.tokenCalls()).toHaveLength(1)
      expect(ctx.http.apiCalls()).toHaveLength(0)
    })

    it.each([404, 500])('statut %i : http_error avec le statut, un seul appel, aucune ré-auth', async (status) => {
      const ctx = await setup({ rows: [tokenRow()], api: [{ status }] })
      const err = await catchErr(() => ctx.client.get(FT_PATH))
      expect(err).toBeInstanceOf(ctx.mod.HelloAssoError)
      expect(err.code).toBe('http_error')
      expect(err.status).toBe(status)
      expect(ctx.http.apiCalls()).toHaveLength(1)
      expect(ctx.http.tokenCalls()).toHaveLength(0)
    })
  })

  // ---------------------------------------------------------------------------------------------
  describe('critère : useHelloAsso(event) branché sur runtimeConfig et le service role', () => {
    it('lit runtimeConfig.helloasso : URLs sandbox par défaut, jeton obtenu et rangé dans la base du service role', async () => {
      state.rc = { helloasso: { ...CONFIG, apiUrl: '', tokenUrl: '' } }
      const sb = createFakeSupabase({ helloasso_tokens: [] })
      state.db = sb.client
      const http = createFetchRouter({ token: [{ json: TOKEN_OK }], api: [{ json: FORM_TYPES }] })
      vi.stubGlobal('fetch', http.fetch)
      const { useHelloAsso } = await loadModule(MODULE)

      const client = await useHelloAsso(createMockEvent())
      const body = await client.get(FT_PATH)

      expect(client.config).toMatchObject({ orgSlug: 'asso-fictive', environment: 'sandbox' })
      expect(body).toEqual(FORM_TYPES)
      expect(http.tokenCalls()[0]!.url).toBe('https://api.helloasso-sandbox.com/oauth2/token')
      expect(http.apiCalls()[0]!.url).toBe('https://api.helloasso-sandbox.com/v5/organizations/asso-fictive/formTypes')
      expect(sb.tables.helloasso_tokens![0]).toMatchObject({ environment: 'sandbox', access_token: 'fixture-access-token-ok' })
    })

    it('configuration absente : config_missing (aucun appel réseau)', async () => {
      state.rc = { helloasso: { clientId: '', clientSecret: '', orgSlug: '', environment: '', apiUrl: '', tokenUrl: '', webhookSecret: '' } }
      state.db = createFakeSupabase().client
      const fetchStub = forbidNetwork()
      const mod = await loadModule(MODULE)
      const err = await catchErr(() => mod.useHelloAsso(createMockEvent()))
      expect(err).toBeInstanceOf(mod.HelloAssoError)
      expect(err.code).toBe('config_missing')
      expect(fetchStub).not.toHaveBeenCalled()
    })
  })

  // ---------------------------------------------------------------------------------------------
  describe('toH3Error : traduction des codes HelloAssoError en erreurs HTTP', () => {
    // Les erreurs sont produites par le vrai client : le constructeur de HelloAssoError n'est pas figé par le contrat.
    async function produce(code: string): Promise<{ mod: any, err: any }> {
      const retryAfterHeader = { 'Retry-After': '7' }
      switch (code) {
        case 'config_missing': {
          const mod = await loadModule(MODULE)
          return { mod, err: await catchErr(() => mod.resolveHelloAssoConfig({})) }
        }
        case 'rate_limited': {
          const c = await setup({ rows: [tokenRow()], api: [{ status: 429, headers: retryAfterHeader }] })
          return { mod: c.mod, err: await catchErr(() => c.client.get(FT_PATH)) }
        }
        case 'lock_timeout': {
          const c = await setup({ rows: [expiredRow({ lock_holder: 'uuid-autre-instance', lock_until: inMs(20_000) })] })
          return { mod: c.mod, err: await catchErr(() => c.client.get(FT_PATH)) }
        }
        case 'auth_failed': {
          const c = await setup({ token: [{ status: 401 }] })
          return { mod: c.mod, err: await catchErr(() => c.client.get(FT_PATH)) }
        }
        case 'unauthorized': {
          const c = await setup({ rows: [tokenRow({ refresh_token: null, refresh_expires_at: null })], token: [{ json: TOKEN_OK }], api: [{ status: 401 }, { status: 401 }] })
          return { mod: c.mod, err: await catchErr(() => c.client.get(FT_PATH)) }
        }
        case 'forbidden': {
          const c = await setup({ rows: [tokenRow()], api: [{ status: 403 }] })
          return { mod: c.mod, err: await catchErr(() => c.client.get(FT_PATH)) }
        }
        case 'http_error': {
          const c = await setup({ rows: [tokenRow()], api: [{ status: 500 }] })
          return { mod: c.mod, err: await catchErr(() => c.client.get(FT_PATH)) }
        }
        default: {
          const c = await setup({ rows: [tokenRow()], api: [{ networkError: true }] })
          return { mod: c.mod, err: await catchErr(() => c.client.get(FT_PATH)) }
        }
      }
    }
    const toH3 = (mod: any, err: any) => { try { return mod.toH3Error(err) } catch (e) { return e } }
    const retryAfterOf = (e: any) => e?.headers?.['Retry-After'] ?? e?.headers?.['retry-after'] ?? e?.data?.headers?.['Retry-After'] ?? e?.data?.retryAfter ?? e?.retryAfter

    it.each([
      ['config_missing', 500],
      ['rate_limited', 503],
      ['lock_timeout', 503],
      ['auth_failed', 502],
      ['unauthorized', 502],
      ['forbidden', 502],
      ['http_error', 502],
      ['network', 502],
    ])('%s → HTTP %i', async (code, statusCode) => {
      const { mod, err } = await produce(code)
      expect(err?.code).toBe(code)
      const h3 = toH3(mod, err)
      expect(h3.statusCode).toBe(statusCode)
      expectNoLeak({ message: h3.message, statusMessage: h3.statusMessage }, LEAKS)
    })

    it('rate_limited avec Retry-After connu : la durée (7 s) est transmise au client HTTP', async () => {
      const { mod, err } = await produce('rate_limited')
      expect(String(retryAfterOf(toH3(mod, err)))).toBe('7')
    })
  })
})
