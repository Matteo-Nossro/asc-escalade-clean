// C0 helloasso-socle (corrections post-revue) — C1 : webhook HelloAsso fermé par défaut.
// POST /api/webhooks/helloasso : si `runtimeConfig.helloasso.webhookSecret` est vide ou absent, la route
// refuse TOUTE notification (erreur HTTP >= 400, on retiendra 503), sans lire ni écrire dans Supabase,
// et sans journaliser de secret ni le corps de la notification.
// Non-régression : avec un secret défini, secret correct accepté (paiement enregistré), secret faux ignoré.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { createMockEvent, stubNitroGlobals } from '../../utils/nitro'
import { createFakeSupabase, type Row } from '../../utils/fake-supabase'
import { loadModule, settle } from '../../utils/helloasso-kit'

const ROUTE = 'server/api/webhooks/helloasso.post.ts'

const h = vi.hoisted(() => ({ rc: {} as Record<string, unknown>, db: null as any }))
vi.mock('#supabase/server', () => ({
  serverSupabaseServiceRole: () => h.db,
  serverSupabaseUser: async () => ({ id: 'u1' }),
}))
mockNuxtImport('useRuntimeConfig', original => () => ({ ...original(), ...h.rc }))

const GOOD_SECRET = 'wh-secret-fictif'
const FORGED_SECRET = 'secret-forge-par-un-tiers'

const FORM: Row = { id: 'form-1', form_slug: 'adhesion-fixture', form_type: 'Membership', active: true }
const PROFILE: Row = { id: 'profile-1', first_name: 'Adherent', last_name: 'Fictif', payment_done: false, payment_amount: null }

// Notification « Payment » valide : le payeur Adhérent Fictif règle 120 € (order 900001).
const NOTIFICATION = {
  eventType: 'Payment',
  data: {
    id: 900001,
    state: 'Authorized',
    order: { formType: 'Membership', formSlug: 'adhesion-fixture' },
    items: [{ type: 'Membership', state: 'Processed', amount: 12000 }],
    payer: { firstName: 'Zoé-Prénom-Fictif', lastName: 'Nom-Fictif-Du-Payeur' },
  },
}
const MATCHING_NOTIFICATION = {
  ...NOTIFICATION,
  data: { ...NOTIFICATION.data, payer: { firstName: 'Adhérent', lastName: 'Fictif' } },
}

function setupDb() {
  const sb = createFakeSupabase({ helloasso_forms: [FORM], profiles: [PROFILE], profile_payments: [] })
  h.db = sb.client
  return sb
}

let responseStatus: number | undefined
const call = async (opts: { secret?: string, body?: unknown } = {}) => {
  const handler = (await loadModule(ROUTE)).default as (e: unknown) => Promise<any>
  const query = opts.secret === undefined ? {} : { secret: opts.secret }
  return settle(() => handler(createMockEvent({ query, body: opts.body ?? MATCHING_NOTIFICATION })))
}
/** Statut HTTP effectif de la réponse : erreur levée (createError) ou setResponseStatus. */
const httpStatus = (r: { error?: any }) => r.error?.statusCode ?? responseStatus ?? 0

let logSpies: Array<ReturnType<typeof vi.spyOn>>
const allLogs = () => logSpies.flatMap(s => s.mock.calls).map(args => args.map(a => (a instanceof Error ? `${a.message} ${a.stack}` : typeof a === 'string' ? a : JSON.stringify(a))).join(' ')).join('\n')

describe('webhook HelloAsso — C1 : fermé par défaut sans secret configuré', () => {
  beforeEach(() => {
    vi.resetModules()
    stubNitroGlobals()
    responseStatus = undefined
    vi.stubGlobal('setResponseStatus', (_e: unknown, code: number) => { responseStatus = code })
    h.rc = { helloasso: { webhookSecret: '' } }
    logSpies = [
      vi.spyOn(console, 'log').mockImplementation(() => {}),
      vi.spyOn(console, 'info').mockImplementation(() => {}),
      vi.spyOn(console, 'warn').mockImplementation(() => {}),
      vi.spyOn(console, 'error').mockImplementation(() => {}),
    ]
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  describe('secret vide ou absent : toute notification est refusée', () => {
    const CONFIGS: Array<[string, Record<string, unknown>]> = [
      ['webhookSecret vide', { helloasso: { webhookSecret: '' } }],
      ['webhookSecret absent', { helloasso: {} }],
      ['webhookSecret null', { helloasso: { webhookSecret: null } }],
      ['bloc helloasso absent', { helloasso: undefined }],
    ]

    it.each(CONFIGS)('%s, sans paramètre secret : erreur HTTP >= 400, rien n\'est lu ni écrit', async (_nom, rc) => {
      h.rc = rc
      const sb = setupDb()
      const r = await call({})
      expect(httpStatus(r)).toBeGreaterThanOrEqual(400)
      expect(sb.from).not.toHaveBeenCalled()
      expect(sb.ops).toHaveLength(0)
      expect(sb.tables.profile_payments).toHaveLength(0)
      expect(sb.tables.profiles![0]).toMatchObject({ payment_done: false, payment_amount: null })
    })

    it.each(CONFIGS)('%s, avec un secret forgé dans l\'URL : refusé, rien n\'est lu ni écrit', async (_nom, rc) => {
      h.rc = rc
      const sb = setupDb()
      const r = await call({ secret: FORGED_SECRET })
      expect(httpStatus(r)).toBeGreaterThanOrEqual(400)
      expect(sb.from).not.toHaveBeenCalled()
      expect(sb.ops).toHaveLength(0)
      expect(sb.tables.profile_payments).toHaveLength(0)
    })

    it('secret vide dans la config ET paramètre `secret=` vide dans l\'URL : refusé (pas d\'égalité « vide = vide »)', async () => {
      const sb = setupDb()
      const r = await call({ secret: '' })
      expect(httpStatus(r)).toBeGreaterThanOrEqual(400)
      expect(sb.from).not.toHaveBeenCalled()
      expect(sb.tables.profile_payments).toHaveLength(0)
    })

    // Ajouté après la revue des corrections (2026-10-28)
    it('secret fait d\'espaces dans la config, même valeur dans l\'URL : refusé en 503, rien n\'est lu', async () => {
      h.rc = { helloasso: { webhookSecret: '   ' } }
      const sb = setupDb()
      const r = await call({ secret: '   ' })
      expect(httpStatus(r)).toBe(503)
      expect(sb.from).not.toHaveBeenCalled()
    })

    it('le refus est un 503 (service non configuré)', async () => {
      setupDb()
      const r = await call({})
      expect(httpStatus(r)).toBe(503)
    })

    it('une notification non pertinente (autre eventType) est refusée elle aussi, pas acquittée en 200', async () => {
      const sb = setupDb()
      const r = await call({ body: { eventType: 'Order', data: {} } })
      expect(r.value).toBeUndefined()
      expect(httpStatus(r)).toBeGreaterThanOrEqual(400)
      expect(sb.from).not.toHaveBeenCalled()
    })

    it('aucun log ne contient le secret de l\'URL ni le corps de la notification (nom, prénom, id de commande)', async () => {
      setupDb()
      await call({ secret: FORGED_SECRET })
      const logs = allLogs()
      for (const forbidden of [FORGED_SECRET, 'Nom-Fictif-Du-Payeur', 'Zoé-Prénom-Fictif', '900001', 'adhesion-fixture']) {
        expect(logs, `fuite de « ${forbidden} » dans les logs`).not.toContain(forbidden)
      }
    })

    it('le message de l\'erreur renvoyée ne contient ni le secret de l\'URL ni le corps de la notification', async () => {
      setupDb()
      const r = await call({ secret: FORGED_SECRET })
      const text = `${r.error?.message ?? ''} ${r.error?.statusMessage ?? ''} ${JSON.stringify(r.error?.data ?? '')}`
      expect(r.error).toBeDefined()
      for (const forbidden of [FORGED_SECRET, 'Nom-Fictif-Du-Payeur', '900001']) {
        expect(text).not.toContain(forbidden)
      }
    })
  })

  describe('non-régression : secret défini (comportement actuel inchangé)', () => {
    beforeEach(() => { h.rc = { helloasso: { webhookSecret: GOOD_SECRET } } })

    it('secret correct : la notification est traitée, le paiement du profil retrouvé est enregistré (120 €)', async () => {
      const sb = setupDb()
      const r = await call({ secret: GOOD_SECRET })
      expect(r.error).toBeUndefined()
      expect(r.value).toEqual({ ok: true })
      expect(sb.tables.profile_payments).toHaveLength(1)
      expect(sb.tables.profile_payments![0]).toMatchObject({ profile_id: 'profile-1', form_id: 'form-1', helloasso_order_id: '900001', amount: 120 })
      expect(sb.tables.profiles![0]).toMatchObject({ payment_done: true, payment_amount: 120 })
    })

    it('secret faux : requête ignorée (200 { ok: true }), rien n\'est lu ni écrit', async () => {
      const sb = setupDb()
      const r = await call({ secret: FORGED_SECRET })
      expect(r.error).toBeUndefined()
      expect(r.value).toEqual({ ok: true })
      expect(sb.from).not.toHaveBeenCalled()
      expect(sb.tables.profile_payments).toHaveLength(0)
    })

    it('secret absent de l\'URL : requête ignorée (200 { ok: true }), rien n\'est écrit', async () => {
      const sb = setupDb()
      const r = await call({})
      expect(r.error).toBeUndefined()
      expect(r.value).toEqual({ ok: true })
      expect(sb.tables.profile_payments).toHaveLength(0)
    })
  })
})
