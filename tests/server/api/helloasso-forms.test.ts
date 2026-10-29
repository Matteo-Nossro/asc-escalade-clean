// T0 helloasso-socle — formulaires HelloAsso : `season` obligatoire au format AAAA-AAAA (années consécutives).
// POST /api/admin/helloasso-forms et PATCH /api/admin/helloasso-forms/[id].
// Critère : season absent / mauvais format / années non consécutives => 400 ; 2026-2027 accepté ;
// le PATCH valide `season` de la même façon. `event_id` n'est pas exposé (lot 5).
// Les rôles sont couverts par helloasso-roles.test.ts : requireAdmin est mocké ici.
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

const EXISTING: Row = { id: 'form-1', form_slug: 'adhesion-fixture', label: 'Adhésion fictive', form_type: 'Membership', active: true, season: '2025-2026' }
const VALID_BODY = { form_slug: 'adhesion-2026', label: 'Adhésion 2026-2027', form_type: 'Membership', season: '2026-2027' }

const INVALID_SEASONS: Array<[string, unknown]> = [
  ['année seule', '2026'],
  ['années sur 2 chiffres', '26-27'],
  ['séparateur « / »', '2026/2027'],
  ['même année deux fois', '2026-2026'],
  ['années non consécutives', '2026-2028'],
  ['ordre inversé', '2027-2026'],
  ['lettres', 'abcd-efgh'],
  ['suffixe parasite', '2026-2027x'],
  ['chaîne vide', ''],
  ['espaces', '   '],
  ['nombre', 20262027],
  ['null', null],
]

function setupDb() {
  const sb = createFakeSupabase({ helloasso_forms: [EXISTING] })
  h.db = sb.client
  return sb
}
const post = async (body: unknown) => {
  const handler = (await loadModule(POST)).default as (e: unknown) => Promise<any>
  return settle(() => handler(createMockEvent({ body })))
}
const patch = async (body: unknown, id = 'form-1') => {
  const handler = (await loadModule(PATCH)).default as (e: unknown) => Promise<any>
  return settle(() => handler(createMockEvent({ params: { id }, body })))
}

describe('helloasso-forms — critère : saison obligatoire au format AAAA-AAAA', () => {
  beforeEach(() => {
    vi.resetModules()
    stubNitroGlobals()
    h.requireAdmin.mockReset().mockResolvedValue({ userId: 'u1', roles: ['admin'] })
  })
  afterEach(() => vi.unstubAllGlobals())

  describe('POST /api/admin/helloasso-forms', () => {
    it('season absent : 400, rien n\'est inséré', async () => {
      const sb = setupDb()
      const { season: _s, ...sansSaison } = VALID_BODY
      const { error } = await post(sansSaison)
      expect(error).toMatchObject({ statusCode: 400 })
      expect(sb.tables.helloasso_forms).toHaveLength(1)
    })

    it.each(INVALID_SEASONS)('season invalide (%s) : 400, rien n\'est inséré', async (_nom, season) => {
      const sb = setupDb()
      const { error } = await post({ ...VALID_BODY, season })
      expect(error).toMatchObject({ statusCode: 400 })
      expect(sb.tables.helloasso_forms).toHaveLength(1)
    })

    it('season 2026-2027 : accepté, inséré avec sa saison', async () => {
      const sb = setupDb()
      const { value, error } = await post(VALID_BODY)
      expect(error).toBeUndefined()
      expect(value).toMatchObject({ form_slug: 'adhesion-2026', season: '2026-2027' })
      expect(sb.tables.helloasso_forms).toHaveLength(2)
      expect(sb.tables.helloasso_forms![1]).toMatchObject({ form_slug: 'adhesion-2026', label: 'Adhésion 2026-2027', form_type: 'Membership', season: '2026-2027' })
    })

    it('season 2025-2026 : accepté', async () => {
      setupDb()
      const { error } = await post({ ...VALID_BODY, season: '2025-2026' })
      expect(error).toBeUndefined()
    })

    it('form_slug et label restent requis (400)', async () => {
      const sb = setupDb()
      expect((await post({ ...VALID_BODY, form_slug: ' ' })).error).toMatchObject({ statusCode: 400 })
      expect((await post({ ...VALID_BODY, label: '' })).error).toMatchObject({ statusCode: 400 })
      expect(sb.tables.helloasso_forms).toHaveLength(1)
    })

    it('event_id n\'est pas exposé : ignoré s\'il est envoyé', async () => {
      const sb = setupDb()
      const { error } = await post({ ...VALID_BODY, event_id: 'uuid-evenement' })
      expect(error).toBeUndefined()
      expect(sb.tables.helloasso_forms![1]!.event_id).toBeUndefined()
    })
  })

  describe('PATCH /api/admin/helloasso-forms/[id]', () => {
    it('active seul : toujours accepté', async () => {
      const sb = setupDb()
      const { error } = await patch({ active: false })
      expect(error).toBeUndefined()
      expect(sb.tables.helloasso_forms![0]).toMatchObject({ active: false, season: '2025-2026' })
    })

    it('season seule (2026-2027) : acceptée et enregistrée', async () => {
      const sb = setupDb()
      const { error } = await patch({ season: '2026-2027' })
      expect(error).toBeUndefined()
      expect(sb.tables.helloasso_forms![0]).toMatchObject({ season: '2026-2027', active: true })
    })

    it('active et season ensemble : les deux sont enregistrés', async () => {
      const sb = setupDb()
      const { error } = await patch({ active: false, season: '2026-2027' })
      expect(error).toBeUndefined()
      expect(sb.tables.helloasso_forms![0]).toMatchObject({ active: false, season: '2026-2027' })
    })

    // `season: null` compte comme une saison invalide (décision du 2026-10-28), pas comme un champ absent.
    it.each(INVALID_SEASONS)('season invalide (%s), même avec un active valide : 400, la ligne n\'est pas modifiée', async (_nom, season) => {
      const sb = setupDb()
      const { error } = await patch({ active: false, season })
      expect(error).toMatchObject({ statusCode: 400 })
      expect(sb.tables.helloasso_forms![0]).toMatchObject({ active: true, season: '2025-2026' })
    })

    it('corps vide ou active non booléen sans season : 400', async () => {
      setupDb()
      expect((await patch({})).error).toMatchObject({ statusCode: 400 })
      expect((await patch({ active: 'oui' })).error).toMatchObject({ statusCode: 400 })
    })

    it('event_id n\'est pas exposé : ignoré s\'il est envoyé', async () => {
      const sb = setupDb()
      const { error } = await patch({ active: false, event_id: 'uuid-evenement' })
      expect(error).toBeUndefined()
      expect(sb.tables.helloasso_forms![0]!.event_id).toBeUndefined()
    })
  })
})
