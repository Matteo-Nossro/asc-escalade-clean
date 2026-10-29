// T0a auth-profils — POST /api/register : critères B1 à B5.
// Le compte auth est créé côté client par signUp ; le trigger handle_new_user a déjà posé la ligne `profiles`
// (statut « En attente », profile_completed_at vide). La route doit COMPLÉTER cette ligne, pas la rejeter.
// Base en mémoire (tests/utils/auth-server-fake.ts). Aucun SQL, RLS ni trigger réel : voir T1b pour la base.
//
// Rouge attendu sur le code actuel : la route renvoie 409 dès que la ligne du trigger existe, ne contrôle pas l'email
// du compte, ne tient pas compte de profile_completed_at.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createMockEvent, stubNitroGlobals } from '../../utils/nitro'
import { loadModule, catchErr } from '../../utils/helloasso-kit'
import { createServerDb, minutesAgo, triggerRow, type FakeAuthUser } from '../../utils/auth-server-fake'

const state = vi.hoisted(() => ({ sessionUser: null as any, client: null as any }))
vi.mock('#supabase/server', () => ({
  serverSupabaseUser: async () => state.sessionUser,
  serverSupabaseServiceRole: () => state.client,
}))

const ROUTE = 'server/api/register.post.ts'
const U = 'user-camille'
const EMAIL = 'camille@test.fr'

const parent = {
  first_name: 'Camille',
  last_name: 'Durand',
  email: EMAIL,
  birth_date: '1985-03-02',
  gender: 'F',
  phone: null as string | null,
  address: '1 rue des Alpes',
  postal_code: '21800',
  city: 'Chevigny-Saint-Sauveur',
}
const child = { first_name: 'Léo', last_name: 'Durand', birth_date: '2014-06-01', address: null, postal_code: null, city: null }

const freshAuthUser = (extra: Partial<FakeAuthUser> = {}): FakeAuthUser =>
  ({ id: U, email: EMAIL, created_at: minutesAgo(10), last_sign_in_at: null, ...extra })

/** Prépare la base (ligne du trigger + enrichissement) et l'utilisateur auth. */
function setup(opts: { authUser?: FakeAuthUser | null, row?: Record<string, any> | null, tables?: Record<string, any[]>, failTables?: string[], session?: any } = {}) {
  const authUser = opts.authUser === undefined ? freshAuthUser() : opts.authUser
  const row = opts.row === undefined
    ? triggerRow(U, EMAIL, { phone: '0611223344', address: '3 rue Enrichie', first_name: 'Cam', licence_number: 4242 })
    : opts.row
  const db = createServerDb(
    { profiles: row ? [row] : [], user_roles: [], parent_access: [], ...(opts.tables ?? {}) },
    { authUsers: authUser ? { [authUser.id]: authUser } : {}, failTables: opts.failTables },
  )
  state.client = db.client
  state.sessionUser = opts.session ?? null
  return db
}

async function call(body: Record<string, any>) {
  const handler = (await loadModule(ROUTE)).default as (e: unknown) => Promise<any>
  return handler(createMockEvent({ body }))
}
const valid = (over: Record<string, any> = {}) => ({ userId: U, parent, children: [child], ...over })
const errorOf = async (body: Record<string, any>) => catchErr(() => call(body))

beforeEach(() => {
  vi.resetModules()
  stubNitroGlobals()
  state.sessionUser = null
})
afterEach(() => vi.unstubAllGlobals())

describe('B1, B2, B4 — inscription publique valide (ligne du trigger complétée)', () => {
  it('renvoie un succès, sans 409 malgré la ligne créée par le trigger', async () => {
    setup({ session: { id: U, sub: U, email: EMAIL } })
    expect(await call(valid())).toEqual({ success: true })
  })

  it('le profil contient les champs saisis, reste « En attente » et est marqué complété', async () => {
    const db = setup({ session: { id: U, sub: U, email: EMAIL } })
    await call(valid())
    const row = db.row('profiles', U)!
    expect(row).toMatchObject({
      first_name: 'Camille', last_name: 'Durand', full_name: 'Camille Durand',
      birth_date: '1985-03-02', gender: 'F', city: 'Chevigny-Saint-Sauveur', postal_code: '21800',
      status: 'En attente',
    })
    expect(row.email).toBe(EMAIL)
    expect(Number.isNaN(Date.parse(row.profile_completed_at))).toBe(false)
    expect(db.rows('profiles', r => r.id === U)).toHaveLength(1) // complétée, pas dupliquée
  })

  it('attribue le rôle parent une seule fois', async () => {
    const db = setup({ session: { id: U, sub: U, email: EMAIL } })
    await call(valid())
    expect(db.rows('user_roles', r => r.user_id === U && r.role_code === 'parent')).toHaveLength(1)
  })

  it('crée les enfants (« En attente », complétés) et le lien parent_access', async () => {
    const db = setup({ session: { id: U, sub: U, email: EMAIL } })
    await call(valid())
    const kids = db.rows('profiles', r => r.id !== U)
    expect(kids).toHaveLength(1)
    expect(kids[0]).toMatchObject({ first_name: 'Léo', last_name: 'Durand', birth_date: '2014-06-01', status: 'En attente' })
    expect(kids[0]!.profile_completed_at).toBeTruthy()
    expect(db.tables.parent_access).toEqual([expect.objectContaining({ parent_id: U, child_id: kids[0]!.id, access_type: 'full' })])
  })

  it('une nouvelle soumission ne duplique pas les enfants déjà créés', async () => {
    const db = setup({
      session: { id: U, sub: U, email: EMAIL },
      tables: { parent_access: [{ id: 'pa-1', parent_id: U, child_id: 'enfant-existant', access_type: 'full' }] },
    })
    await call(valid())
    expect(db.rows('profiles', r => r.id !== U)).toHaveLength(0)
    expect(db.tables.parent_access).toHaveLength(1)
  })

  it('ne touche jamais au statut d\'une ligne existante', async () => {
    const db = setup({ session: { id: U, sub: U, email: EMAIL }, row: triggerRow(U, EMAIL, { status: 'Inactif' }) })
    await call(valid())
    expect(db.row('profiles', U)!.status).toBe('Inactif')
  })

  it('si la ligne du trigger n\'existe pas, elle est créée « En attente » et complétée', async () => {
    const db = setup({ session: { id: U, sub: U, email: EMAIL }, row: null })
    await call(valid())
    expect(db.row('profiles', U)).toMatchObject({ id: U, status: 'En attente', first_name: 'Camille' })
    expect(db.row('profiles', U)!.profile_completed_at).toBeTruthy()
    expect(db.rows('user_roles', r => r.user_id === U && r.role_code === 'parent')).toHaveLength(1)
  })
})

describe('B2 — pas d\'écrasement par du vide', () => {
  it('les valeurs déjà présentes (enrichissement FFME) survivent à des champs vides ou null du formulaire', async () => {
    const db = setup({ session: { id: U, sub: U, email: EMAIL } })
    await call(valid({ parent: { ...parent, phone: null, address: '' } }))
    const row = db.row('profiles', U)!
    expect(row.phone).toBe('0611223344')
    expect(row.address).toBe('3 rue Enrichie')
    expect(row.licence_number).toBe(4242)
  })

  it('une valeur saisie non vide est enregistrée', async () => {
    const db = setup({ session: { id: U, sub: U, email: EMAIL } })
    await call(valid({ parent: { ...parent, phone: '0699887766' } }))
    expect(db.row('profiles', U)!.phone).toBe('0699887766')
    expect(db.row('profiles', U)!.first_name).toBe('Camille') // remplace « Cam »
  })
})

describe('B2 — profile_completed_at posé en dernier (reprise possible)', () => {
  it('si la création d\'un enfant échoue, le parent n\'est pas marqué complété', async () => {
    const db = setup({ session: { id: U, sub: U, email: EMAIL }, failTables: ['parent_access'] })
    const err = await errorOf(valid())
    expect(err).toBeDefined()
    expect(err.statusCode).toBe(500)
    expect(db.row('profiles', U)!.profile_completed_at).toBeNull()
  })
})

describe('B3 — 409 seulement pour un vrai doublon', () => {
  it('profil déjà complété : 409 « Cette adresse email est déjà inscrite. », rien n\'est écrit', async () => {
    const db = setup({
      session: { id: U, sub: U, email: EMAIL },
      row: triggerRow(U, EMAIL, { first_name: 'Camille', profile_completed_at: '2026-01-01T10:00:00.000Z' }),
    })
    const err = await errorOf(valid())
    expect(err.statusCode).toBe(409)
    expect(err.statusMessage).toBe('Cette adresse email est déjà inscrite.')
    expect(db.writes()).toHaveLength(0)
  })

  it('même refus sans session quand tout le reste est valide', async () => {
    const db = setup({ row: triggerRow(U, EMAIL, { profile_completed_at: '2026-01-01T10:00:00.000Z' }) })
    const err = await errorOf(valid())
    expect(err.statusCode).toBe(409)
    expect(db.writes()).toHaveLength(0)
  })
})

describe('B1 — champs obligatoires (400, aucune écriture)', () => {
  beforeEach(() => { setup({ session: { id: U, sub: U, email: EMAIL } }) })

  it.each(['first_name', 'last_name', 'birth_date', 'gender'])('parent sans %s : 400', async (field) => {
    for (const empty of ['', null]) {
      const db = setup({ session: { id: U, sub: U, email: EMAIL } })
      const err = await errorOf(valid({ parent: { ...parent, [field]: empty } }))
      expect(err?.statusCode, `${field} = ${JSON.stringify(empty)}`).toBe(400)
      expect(db.writes()).toHaveLength(0)
    }
  })

  it.each(['first_name', 'last_name', 'birth_date'])('enfant sans %s : 400', async (field) => {
    const db = setup({ session: { id: U, sub: U, email: EMAIL } })
    const err = await errorOf(valid({ children: [{ ...child, [field]: '' }] }))
    expect(err?.statusCode).toBe(400)
    expect(db.writes()).toHaveLength(0)
  })

  it('email du parent manquant : 400', async () => {
    const db = setup({ session: { id: U, sub: U, email: EMAIL } })
    const err = await errorOf(valid({ parent: { ...parent, email: '' } }))
    expect(err?.statusCode).toBe(400)
    expect(db.writes()).toHaveLength(0)
  })

  it('userId manquant : 400', async () => {
    const db = setup({ session: { id: U, sub: U, email: EMAIL } })
    const err = await errorOf({ parent, children: [child] })
    expect(err?.statusCode).toBe(400)
    expect(db.writes()).toHaveLength(0)
  })
})

describe('B5 — avec session : l\'id de la session doit correspondre', () => {
  it('session d\'un autre utilisateur : 403, rien n\'est écrit', async () => {
    const db = setup({ session: { id: 'autre-user', sub: 'autre-user', email: 'autre@test.fr' } })
    const err = await errorOf(valid())
    expect(err?.statusCode).toBe(403)
    expect(db.writes()).toHaveLength(0)
  })

  it('session correspondante : acceptée même si le compte s\'est déjà connecté (confirmation d\'email désactivée)', async () => {
    setup({
      session: { id: U, sub: U, email: EMAIL },
      authUser: freshAuthUser({ last_sign_in_at: minutesAgo(1) }),
    })
    expect(await call(valid())).toEqual({ success: true })
  })
})

describe('B5 — sans session : UUID ET email du même compte, jamais connecté, créé il y a moins d\'une heure', () => {
  it('email correct mais sans userId : 400', async () => {
    const db = setup()
    const err = await errorOf({ parent, children: [child] })
    expect(err?.statusCode).toBe(400)
    expect(db.writes()).toHaveLength(0)
  })

  it('userId d\'un autre compte (email différent) : 403, rien n\'est écrit', async () => {
    const db = setup({ authUser: freshAuthUser({ email: 'victime@test.fr' }) })
    const err = await errorOf(valid())
    expect(err?.statusCode).toBe(403)
    expect(db.writes()).toHaveLength(0)
  })

  it('compte déjà connecté (last_sign_in_at renseigné) : 403, rien n\'est écrit', async () => {
    const db = setup({ authUser: freshAuthUser({ last_sign_in_at: minutesAgo(5) }) })
    const err = await errorOf(valid())
    expect(err?.statusCode).toBe(403)
    expect(db.writes()).toHaveLength(0)
  })

  it('compte créé il y a plus d\'une heure : 403, rien n\'est écrit', async () => {
    const db = setup({ authUser: freshAuthUser({ created_at: minutesAgo(120) }) })
    const err = await errorOf(valid())
    expect(err?.statusCode).toBe(403)
    expect(db.writes()).toHaveLength(0)
  })

  it('userId inconnu de l\'auth : refusé (400 ou 403), rien n\'est écrit', async () => {
    const db = setup({ authUser: null })
    const err = await errorOf(valid({ userId: 'inconnu' }))
    expect([400, 403]).toContain(err?.statusCode)
    expect(db.writes()).toHaveLength(0)
  })

  it('UUID et email corrects, compte jamais connecté et récent : 200', async () => {
    const db = setup()
    expect(await call(valid())).toEqual({ success: true })
    expect(db.row('profiles', U)!.profile_completed_at).toBeTruthy()
    expect(db.getUserById).toHaveBeenCalledWith(U)
  })

  it('la comparaison de l\'email ignore la casse', async () => {
    setup()
    expect(await call(valid({ parent: { ...parent, email: 'Camille@TEST.fr' } }))).toEqual({ success: true })
  })
})
