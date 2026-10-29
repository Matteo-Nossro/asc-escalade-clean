// T0a auth-profils — POST /api/admin/create-member : critères C4, D1, D2.
// Le trigger handle_new_user (+ on_profile_enrich) a déjà posé la ligne `profiles` du nouveau compte, éventuellement
// enrichie (téléphone, licence FFME…). L'upsert de la route ne doit pas l'écraser par du vide, doit enregistrer les
// valeurs saisies, conserver le statut choisi par l'admin ('Actif' par défaut) et marquer le profil complété.
// requireAdmin est simulé (son comportement est couvert par tests/server/utils/requireAdmin.test.ts).
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createMockEvent, stubNitroGlobals } from '../../../utils/nitro'
import { loadModule, catchErr } from '../../../utils/helloasso-kit'
import { createServerDb, triggerRow } from '../../../utils/auth-server-fake'

const h = vi.hoisted(() => ({ requireAdmin: vi.fn(), client: null as any }))
vi.mock('#supabase/server', () => ({
  serverSupabaseUser: async () => null,
  serverSupabaseServiceRole: () => h.client,
}))
vi.mock('../../../../server/utils/requireAdmin', () => ({ requireAdmin: h.requireAdmin }))

const ROUTE = 'server/api/admin/create-member.post.ts'
const NEW_ID = 'new-1'
const ENRICHED = {
  first_name: 'Jean', last_name: 'Martin', phone: '0611223344', mobile: '0622334455',
  birth_date: '1988-04-05', gender: 'M', licence_number: 4242, licence_type: 'Compétition',
}

/** Formulaire du bureau : champs non saisis = chaînes vides, licence / formule à '-' (comme dashboard.vue). */
const emptyForm = () => ({
  email: 'jean@test.fr', first_name: 'Jean', last_name: 'Martin',
  phone: '', mobile: '', birth_date: '', gender: '', status: 'Actif', licence: '-', formule: '-', roles: [], groupIds: [],
})

function setup(opts: { enriched?: boolean } = {}) {
  const row = triggerRow(NEW_ID, 'jean@test.fr', opts.enriched === false ? {} : ENRICHED)
  const db = createServerDb({ profiles: [row], user_roles: [], group_members: [] }, { createdUserId: NEW_ID })
  h.client = db.client
  return db
}
async function call(body: Record<string, any>, event = createMockEvent({ body })) {
  const handler = (await loadModule(ROUTE)).default as (e: unknown) => Promise<any>
  return handler(event)
}
/** Charges utiles de toutes les écritures sur `profiles`. */
const profilePayloads = (db: ReturnType<typeof setup>) =>
  db.sb.ops.filter(o => o.table === 'profiles' && o.op !== 'select').flatMap(o => (Array.isArray(o.payload) ? o.payload : [o.payload]))

beforeEach(() => {
  vi.resetModules()
  stubNitroGlobals()
  h.requireAdmin.mockReset().mockResolvedValue({ userId: 'admin-1', roles: ['admin'] })
})
afterEach(() => vi.unstubAllGlobals())

describe('requireAdmin', () => {
  it('est appelé avec l\'évènement', async () => {
    setup()
    const event = createMockEvent({ body: emptyForm() })
    await call(emptyForm(), event)
    expect(h.requireAdmin).toHaveBeenCalledWith(event)
  })

  it('refus (403) : aucun compte créé, aucune écriture', async () => {
    const db = setup()
    h.requireAdmin.mockRejectedValue(Object.assign(new Error('Accès refusé'), { statusCode: 403 }))
    const err = await catchErr(() => call(emptyForm()))
    expect(err?.statusCode).toBe(403)
    expect(db.createUser).not.toHaveBeenCalled()
    expect(db.writes()).toHaveLength(0)
  })
})

describe('D1 — pas d\'écrasement d\'une valeur existante par du vide', () => {
  it('l\'enrichissement (téléphone, mobile, naissance, genre, licence) survit à un formulaire vide', async () => {
    const db = setup()
    await call(emptyForm())
    expect(db.row('profiles', NEW_ID)).toMatchObject(ENRICHED)
  })

  it('le payload de l\'upsert ne contient aucune valeur vide, null ou absente', async () => {
    const db = setup()
    await call(emptyForm())
    const payloads = profilePayloads(db)
    expect(payloads.length).toBeGreaterThan(0)
    for (const payload of payloads) {
      for (const [key, value] of Object.entries(payload)) {
        expect(value, `profiles.${key}`).not.toBeNull()
        expect(value, `profiles.${key}`).not.toBeUndefined()
        expect(value, `profiles.${key}`).not.toBe('')
      }
    }
  })

  it.each(['', '-'])('licence = %j et formule = "-" : licence_number et licence_type ne sont pas écrits', async (licence) => {
    const db = setup()
    await call({ ...emptyForm(), licence, formule: '-' })
    for (const payload of profilePayloads(db)) {
      expect(payload).not.toHaveProperty('licence_number')
      expect(payload).not.toHaveProperty('licence_type')
    }
    expect(db.row('profiles', NEW_ID)).toMatchObject({ licence_number: 4242, licence_type: 'Compétition' })
  })

  it('sans email (profil autonome) : aucun compte auth, une ligne créée sans champ vide', async () => {
    const db = setup()
    const result = await call({ ...emptyForm(), email: '', first_name: 'Enfant', last_name: 'Sansmail' })
    expect(db.createUser).not.toHaveBeenCalled()
    expect(result.id).toBeTruthy()
    expect(result.id).not.toBe(NEW_ID)
    const row = db.row('profiles', result.id)!
    expect(row).toMatchObject({ first_name: 'Enfant', last_name: 'Sansmail', status: 'Actif' })
    expect(row.profile_completed_at).toBeTruthy()
    for (const payload of profilePayloads(db).filter(p => p.id === result.id)) {
      expect(payload).not.toHaveProperty('email')
    }
  })
})

describe('D2 — les valeurs saisies sont enregistrées, même si elles remplacent une valeur existante', () => {
  it('téléphone, mobile, naissance, genre, licence et formule saisis remplacent l\'enrichissement', async () => {
    const db = setup()
    await call({
      ...emptyForm(),
      phone: '0699000001', mobile: '0699000002', birth_date: '1991-02-03', gender: 'F', licence: '1234', formule: 'Loisir',
    })
    expect(db.row('profiles', NEW_ID)).toMatchObject({
      phone: '0699000001', mobile: '0699000002', birth_date: '1991-02-03', gender: 'F', licence_number: 1234, licence_type: 'Loisir',
    })
  })

  it('renvoie l\'id du compte créé', async () => {
    setup()
    expect(await call(emptyForm())).toEqual({ id: NEW_ID })
  })
})

describe('C4 — statut choisi par l\'admin', () => {
  it.each(['Actif', 'Inactif', 'En attente'])('statut « %s » choisi : conservé tel quel', async (status) => {
    const db = setup()
    await call({ ...emptyForm(), status })
    expect(db.row('profiles', NEW_ID)!.status).toBe(status)
  })

  it.each([undefined, ''])('aucun statut choisi (%j) : « Actif » est écrit explicitement', async (status) => {
    const db = setup()
    await call({ ...emptyForm(), status })
    expect(db.row('profiles', NEW_ID)!.status).toBe('Actif')
    expect(profilePayloads(db).some(p => p.status === 'Actif')).toBe(true)
  })

  it('profile_completed_at est renseigné (date du jour)', async () => {
    const db = setup()
    await call(emptyForm())
    const at = Date.parse(db.row('profiles', NEW_ID)!.profile_completed_at)
    expect(Number.isNaN(at)).toBe(false)
    expect(Math.abs(Date.now() - at)).toBeLessThan(60_000)
  })
})
