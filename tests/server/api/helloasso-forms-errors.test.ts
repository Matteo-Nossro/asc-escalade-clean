// C0 helloasso-socle (corrections post-revue) — C2 : codes HTTP des erreurs de formulaires HelloAsso.
// POST /api/admin/helloasso-forms : doublon (form_type, form_slug) = erreur Postgres 23505 => 409,
//   message lisible en français, sans nom de contrainte ni texte brut de PostgREST.
// PATCH /api/admin/helloasso-forms/[id] : id inconnu (aucune ligne / PGRST116) => 404.
// Toute autre erreur base reste 500. Les rôles sont couverts ailleurs : requireAdmin est mocké ici.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createMockEvent, stubNitroGlobals } from '../../utils/nitro'
import { createFakeSupabase, type Row } from '../../utils/fake-supabase'
import { loadModule, settle } from '../../utils/helloasso-kit'

const POST = 'server/api/admin/helloasso-forms.post.ts'
const PATCH = 'server/api/admin/helloasso-forms/[id].patch.ts'

const h = vi.hoisted(() => ({ requireAdmin: vi.fn(), db: null as any }))
vi.mock('#supabase/server', () => ({
  serverSupabaseServiceRole: () => h.db,
  serverSupabaseUser: async () => ({ id: 'u1' }),
}))
vi.mock('../../../server/utils/requireAdmin', () => ({ requireAdmin: h.requireAdmin }))

const VALID_BODY = { form_slug: 'adhesion-2026', label: 'Adhésion 2026-2027', form_type: 'Membership', season: '2026-2027' }

// Textes bruts renvoyés par PostgREST / Postgres, qui ne doivent jamais atteindre l'utilisateur.
const PG_DUPLICATE = {
  code: '23505',
  message: 'duplicate key value violates unique constraint "helloasso_forms_form_type_form_slug_key"',
  details: 'Key (form_type, form_slug)=(Membership, adhesion-2026) already exists.',
  hint: null,
}
const PG_NO_ROW = {
  code: 'PGRST116',
  message: 'JSON object requested, multiple (or no) rows returned',
  details: 'The result contains 0 rows',
  hint: null,
}
const PG_OTHER = { code: '57P01', message: 'terminating connection due to administrator command', details: null, hint: null }
const RAW_FRAGMENTS = [
  'helloasso_forms_form_type_form_slug_key', 'duplicate key', 'violates', 'unique constraint', '23505',
  'Key (form_type', 'already exists', 'PGRST116', 'JSON object requested', 'rows returned',
]

/** Client Supabase dont toute requête se termine par l'erreur donnée (chaîne `.insert().select().single()` quelconque). */
function failingClient(error: unknown) {
  const from = vi.fn()
  const chain: any = new Proxy(function () {}, {
    get: (_t, prop) => prop === 'then'
      ? (ok: any, ko: any) => Promise.resolve({ data: null, error, count: null }).then(ok, ko)
      : () => chain,
  })
  from.mockImplementation(() => chain)
  return { from, rpc: vi.fn() }
}

const post = async (body: unknown = VALID_BODY) => {
  const handler = (await loadModule(POST)).default as (e: unknown) => Promise<any>
  return settle(() => handler(createMockEvent({ body })))
}
const patch = async (body: unknown = { active: false }, id = 'form-inconnu') => {
  const handler = (await loadModule(PATCH)).default as (e: unknown) => Promise<any>
  return settle(() => handler(createMockEvent({ params: { id }, body })))
}
/** Tout le texte que l'appelant pourrait voir dans l'erreur. */
const visibleText = (e: any) => `${e?.statusMessage ?? ''} ${e?.message ?? ''} ${JSON.stringify(e?.data ?? '')}`

describe('helloasso-forms — C2 : doublon => 409, id inconnu => 404, autre erreur => 500', () => {
  beforeEach(() => {
    vi.resetModules()
    stubNitroGlobals()
    h.requireAdmin.mockReset().mockResolvedValue({ userId: 'u1', roles: ['admin'] })
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  describe('POST /api/admin/helloasso-forms', () => {
    it('doublon (23505 renvoyé par le client Supabase) : 409', async () => {
      h.db = failingClient(PG_DUPLICATE)
      const { value, error } = await post()
      expect(value).toBeUndefined()
      expect(error).toMatchObject({ statusCode: 409 })
    })

    it('doublon : message lisible en français (formulaire déjà enregistré)', async () => {
      h.db = failingClient(PG_DUPLICATE)
      const { error } = await post()
      expect(error?.statusMessage).toBeTruthy()
      expect(error?.statusMessage).toMatch(/déjà|existe/i)
    })

    it.each(RAW_FRAGMENTS)('doublon : l\'erreur ne laisse pas passer « %s »', async (fragment) => {
      h.db = failingClient(PG_DUPLICATE)
      const { error } = await post()
      expect(error).toBeDefined()
      expect(visibleText(error)).not.toContain(fragment)
    })

    it('autre erreur base (connexion coupée) : reste 500', async () => {
      h.db = failingClient(PG_OTHER)
      const { error } = await post()
      expect(error).toMatchObject({ statusCode: 500 })
    })

    it('erreur sans code Postgres : reste 500', async () => {
      h.db = failingClient({ message: 'boom' })
      const { error } = await post()
      expect(error).toMatchObject({ statusCode: 500 })
    })

    it('non-régression : insertion réussie sans doublon, la ligne est renvoyée', async () => {
      const sb = createFakeSupabase({ helloasso_forms: [] })
      h.db = sb.client
      const { value, error } = await post()
      expect(error).toBeUndefined()
      expect(value).toMatchObject({ form_slug: 'adhesion-2026', season: '2026-2027' })
      expect(sb.tables.helloasso_forms).toHaveLength(1)
    })
  })

  describe('PATCH /api/admin/helloasso-forms/[id]', () => {
    const EXISTING: Row = { id: 'form-1', form_slug: 'adhesion-fixture', label: 'Adhésion fictive', form_type: 'Membership', active: true, season: '2025-2026' }

    it('id inconnu (aucune ligne trouvée, PGRST116) : 404', async () => {
      const sb = createFakeSupabase({ helloasso_forms: [EXISTING] })
      h.db = sb.client
      const { value, error } = await patch({ active: false }, 'form-inconnu')
      expect(value).toBeUndefined()
      expect(error).toMatchObject({ statusCode: 404 })
      expect(sb.tables.helloasso_forms![0]).toMatchObject({ active: true })
    })

    it('id inconnu, erreur PostgREST PGRST116 renvoyée par le client : 404', async () => {
      h.db = failingClient(PG_NO_ROW)
      const { error } = await patch()
      expect(error).toMatchObject({ statusCode: 404 })
    })

    it('id inconnu : message lisible en français, sans texte brut de PostgREST', async () => {
      h.db = failingClient(PG_NO_ROW)
      const { error } = await patch()
      expect(error?.statusMessage).toBeTruthy()
      expect(error?.statusMessage).toMatch(/introuvable|inconnu|existe pas|trouvé/i)
      expect(visibleText(error)).not.toContain('PGRST116')
      expect(visibleText(error)).not.toContain('JSON object requested')
    })

    it('autre erreur base : reste 500', async () => {
      h.db = failingClient(PG_OTHER)
      const { error } = await patch()
      expect(error).toMatchObject({ statusCode: 500 })
    })

    it('erreur sans code Postgres : reste 500', async () => {
      h.db = failingClient({ message: 'boom' })
      const { error } = await patch()
      expect(error).toMatchObject({ statusCode: 500 })
    })

    it('non-régression : id connu, la ligne est modifiée et renvoyée', async () => {
      const sb = createFakeSupabase({ helloasso_forms: [EXISTING] })
      h.db = sb.client
      const { value, error } = await patch({ active: false }, 'form-1')
      expect(error).toBeUndefined()
      expect(value).toMatchObject({ id: 'form-1', active: false })
    })
  })

  // Ajouté après la revue des corrections (2026-10-28) : depuis C3, le message s'affiche à l'écran.
  describe('500 : message générique, sans texte brut de la base (ni à l\'écran, ni dans les logs)', () => {
    const RAW = [PG_OTHER.message, 'boom']
    it.each([
      ['POST, erreur Postgres', () => post(), PG_OTHER],
      ['POST, erreur sans code', () => post(), { message: 'boom' }],
      ['PATCH, erreur Postgres', () => patch(), PG_OTHER],
      ['PATCH, erreur sans code', () => patch(), { message: 'boom' }],
    ] as const)('%s', async (_nom, run, pgError) => {
      h.db = failingClient(pgError)
      const { error } = await run()
      expect(error).toMatchObject({ statusCode: 500 })
      for (const raw of RAW) expect(visibleText(error)).not.toContain(raw)
      const logs = JSON.stringify((console.error as any).mock.calls)
      for (const raw of RAW) expect(logs).not.toContain(raw)
    })
  })
})
