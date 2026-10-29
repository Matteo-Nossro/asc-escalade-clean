// T0a auth-profils — POST /api/profile/complete : critères C1 et C2 (comptes Google / Microsoft).
// La route n'existe pas encore : le module est chargé par chemin variable, l'échec « ABSENT: … » est attendu (rouge).
// Contrat : session obligatoire (401), id et email toujours pris dans la session (jamais dans le corps),
// statut « En attente » conservé, profile_completed_at renseigné, rôle parent seulement si des enfants sont déclarés,
// 400 pour un champ obligatoire manquant, 409 si le profil est déjà complété.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createMockEvent, stubNitroGlobals } from '../../utils/nitro'
import { loadModule, catchErr } from '../../utils/helloasso-kit'
import { createServerDb, triggerRow } from '../../utils/auth-server-fake'

const state = vi.hoisted(() => ({ sessionUser: null as any, client: null as any }))
vi.mock('#supabase/server', () => ({
  serverSupabaseUser: async () => state.sessionUser,
  serverSupabaseServiceRole: () => state.client,
}))

const ROUTE = 'server/api/profile/complete.post.ts'
const U = 'oauth-user'
const EMAIL = 'oauth@test.fr'
const session = { id: U, sub: U, email: EMAIL }

const parent = {
  first_name: 'Sam',
  last_name: 'Martin',
  birth_date: '1990-01-15',
  gender: 'M',
  phone: null as string | null,
  address: null,
  postal_code: null,
  city: 'Dijon',
}
const child = { first_name: 'Zoé', last_name: 'Martin', birth_date: '2015-09-10', address: null, postal_code: null, city: null }

function setup(opts: { row?: Record<string, any> | null, sessionUser?: any } = {}) {
  const row = opts.row === undefined ? triggerRow(U, EMAIL, { phone: '0611223344', licence_number: 777 }) : opts.row
  const db = createServerDb({ profiles: row ? [row] : [], user_roles: [], parent_access: [] })
  state.client = db.client
  state.sessionUser = opts.sessionUser === undefined ? session : opts.sessionUser
  return db
}
async function call(body: Record<string, any>) {
  const handler = (await loadModule(ROUTE)).default as (e: unknown) => Promise<any>
  return handler(createMockEvent({ body }))
}
const errorOf = (body: Record<string, any>) => catchErr(() => call(body))

beforeEach(() => {
  vi.resetModules()
  stubNitroGlobals()
  state.sessionUser = null
})
afterEach(() => vi.unstubAllGlobals())

describe('C1 — session obligatoire', () => {
  it('sans session : 401, rien n\'est écrit', async () => {
    const db = setup({ sessionUser: null })
    const err = await errorOf({ parent, children: [] })
    expect(err?.statusCode).toBe(401)
    expect(db.writes()).toHaveLength(0)
  })
})

describe('C1 — complétion d\'un compte OAuth', () => {
  it('complète la ligne du trigger : champs saisis, statut « En attente » conservé, profile_completed_at renseigné', async () => {
    const db = setup()
    expect(await call({ parent, children: [] })).toEqual({ success: true })
    const row = db.row('profiles', U)!
    expect(row).toMatchObject({ first_name: 'Sam', last_name: 'Martin', full_name: 'Sam Martin', birth_date: '1990-01-15', gender: 'M', city: 'Dijon', status: 'En attente' })
    expect(Number.isNaN(Date.parse(row.profile_completed_at))).toBe(false)
    expect(db.rows('profiles', r => r.id === U)).toHaveLength(1)
  })

  it('ne remplace pas les valeurs existantes par du vide (enrichissement conservé)', async () => {
    const db = setup()
    await call({ parent: { ...parent, phone: '' }, children: [] })
    expect(db.row('profiles', U)!.phone).toBe('0611223344')
    expect(db.row('profiles', U)!.licence_number).toBe(777)
  })

  it('l\'id vient de la session même si le corps contient un autre userId ; l\'email vient de la session', async () => {
    const db = setup()
    db.tables.profiles!.push(triggerRow('victime', 'victime@test.fr'))
    await call({ userId: 'victime', parent: { ...parent, email: 'pirate@test.fr' }, children: [child] })

    expect(db.row('profiles', 'victime')).toMatchObject({ first_name: null, profile_completed_at: null })
    expect(db.rows('user_roles', r => r.user_id === 'victime')).toHaveLength(0)
    expect(db.rows('parent_access', r => r.parent_id === 'victime')).toHaveLength(0)

    const row = db.row('profiles', U)!
    expect(row.first_name).toBe('Sam')
    expect(row.profile_completed_at).toBeTruthy()
    expect(row.email).toBe(EMAIL)
    expect(db.rows('profiles').some(r => r.email === 'pirate@test.fr')).toBe(false)
  })
})

describe('C2 — rôle parent seulement avec des enfants', () => {
  it('aucun enfant déclaré : aucun rôle', async () => {
    const db = setup()
    await call({ parent, children: [] })
    expect(db.rows('user_roles', r => r.user_id === U)).toHaveLength(0)
  })

  it('enfants déclarés : rôle parent, enfants « En attente » créés avec leur lien parent_access', async () => {
    const db = setup()
    await call({ parent, children: [child] })
    expect(db.rows('user_roles', r => r.user_id === U).map(r => r.role_code)).toEqual(['parent'])
    const kids = db.rows('profiles', r => r.id !== U)
    expect(kids).toHaveLength(1)
    expect(kids[0]).toMatchObject({ first_name: 'Zoé', status: 'En attente' })
    expect(db.tables.parent_access).toEqual([expect.objectContaining({ parent_id: U, child_id: kids[0]!.id })])
  })
})

describe('C1 — refus', () => {
  it('profil déjà complété : 409, rien n\'est écrit', async () => {
    const db = setup({ row: triggerRow(U, EMAIL, { first_name: 'Sam', profile_completed_at: '2026-01-01T10:00:00.000Z' }) })
    const err = await errorOf({ parent, children: [] })
    expect(err?.statusCode).toBe(409)
    expect(db.writes()).toHaveLength(0)
  })

  it.each(['first_name', 'last_name', 'birth_date', 'gender'])('parent sans %s : 400, rien n\'est écrit', async (field) => {
    const db = setup()
    const err = await errorOf({ parent: { ...parent, [field]: '' }, children: [] })
    expect(err?.statusCode).toBe(400)
    expect(db.writes()).toHaveLength(0)
  })

  it.each(['first_name', 'last_name', 'birth_date'])('enfant sans %s : 400, rien n\'est écrit', async (field) => {
    const db = setup()
    const err = await errorOf({ parent, children: [{ ...child, [field]: '' }] })
    expect(err?.statusCode).toBe(400)
    expect(db.writes()).toHaveLength(0)
  })
})
