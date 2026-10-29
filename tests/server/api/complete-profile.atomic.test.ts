// R1-e auth-profils — complétion atomique (completeProfile, via /api/profile/complete et /api/register).
//
// Contrat que le code applicatif doit respecter (api-dev) — comportement observé sur l'ÉTAT de la base simulée :
//  1. Deux envois simultanés pour le même utilisateur : exactement un succès `{ success: true }` et un 409,
//     un seul rôle parent, un seul jeu d'enfants (profil + parent_access), aucun doublon.
//  2. Un échec pendant la création du rôle ou des enfants laisse `profile_completed_at` VIDE (donc le 409 ne
//     bloque pas la reprise) et ne laisse aucun enfant orphelin ; la reprise suivante réussit sans doublon.
//
// Mécanisme supposé (le plus simple, sans fonction SQL ni RPC) : « réserver » la complétion par une mise à jour
// conditionnelle  update({ profile_completed_at }).eq('id', userId).is('profile_completed_at', null).select()
// — 0 ligne renvoyée ⇒ 409 — puis, en cas d'échec ensuite, libérer la réservation (profile_completed_at = null) et
// supprimer les enfants déjà insérés. La lecture préalable du profil (409 immédiat, sans écriture) est conservée :
// register.test.ts / profile-complete.test.ts vérifient « 409 ⇒ aucune écriture ».
// Une fonction SQL transactionnelle appelée par RPC reste acceptable, mais le faux client (tests/utils/fake-supabase.ts)
// ne connaît que `helloasso_acquire_token_lock` : il faudrait alors l'émuler d'abord (en parler avant).
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createMockEvent, stubNitroGlobals } from '../../utils/nitro'
import { loadModule, catchErr } from '../../utils/helloasso-kit'
import { createServerDb, minutesAgo, triggerRow } from '../../utils/auth-server-fake'

const state = vi.hoisted(() => ({ sessionUser: null as any, client: null as any }))
vi.mock('#supabase/server', () => ({
  serverSupabaseUser: async () => state.sessionUser,
  serverSupabaseServiceRole: () => state.client,
}))

const U = 'user-atomique'
const EMAIL = 'atomique@test.fr'
const parent = {
  first_name: 'Alex', last_name: 'Atomic', email: EMAIL, birth_date: '1988-05-05', gender: 'F',
  phone: null, address: null, postal_code: null, city: null,
}
const child = { first_name: 'Noé', last_name: 'Atomic', birth_date: '2015-02-02', address: null, postal_code: null, city: null }
const twoChildren = [child, { ...child, first_name: 'Eli' }]

const ROUTES = [
  { name: '/api/profile/complete', path: 'server/api/profile/complete.post.ts', body: (children: any[]) => ({ parent, children }) },
  { name: '/api/register', path: 'server/api/register.post.ts', body: (children: any[]) => ({ userId: U, parent, children }) },
]

function setup(failTables: string[] = []) {
  const db = createServerDb(
    { profiles: [triggerRow(U, EMAIL)], user_roles: [], parent_access: [] },
    { authUsers: { [U]: { id: U, email: EMAIL, created_at: minutesAgo(5), last_sign_in_at: null } }, failTables },
  )
  state.client = db.client
  state.sessionUser = { id: U, sub: U, email: EMAIL }
  return db
}
const handlerOf = async (path: string) => (await loadModule(path)).default as (e: unknown) => Promise<any>

beforeEach(() => {
  vi.resetModules()
  stubNitroGlobals()
  state.sessionUser = null
})
afterEach(() => vi.unstubAllGlobals())

describe.each(ROUTES)('R1-e — $name', ({ path, body }) => {
  it('deux envois simultanés : un succès, un 409, aucun doublon (rôle, enfants, parent_access)', async () => {
    const db = setup()
    const handler = await handlerOf(path)
    const results = await Promise.allSettled([
      handler(createMockEvent({ body: body(twoChildren) })),
      handler(createMockEvent({ body: body(twoChildren) })),
    ])

    const ok = results.filter(r => r.status === 'fulfilled') as PromiseFulfilledResult<any>[]
    const ko = results.filter(r => r.status === 'rejected') as PromiseRejectedResult[]
    expect(ok).toHaveLength(1)
    expect(ok[0]!.value).toEqual({ success: true })
    expect(ko).toHaveLength(1)
    expect(ko[0]!.reason?.statusCode).toBe(409)

    expect(db.row('profiles', U)!.profile_completed_at).toBeTruthy()
    expect(db.rows('user_roles', r => r.user_id === U && r.role_code === 'parent')).toHaveLength(1)
    expect(db.rows('profiles', r => r.id !== U)).toHaveLength(2)
    expect(db.rows('parent_access', r => r.parent_id === U)).toHaveLength(2)
  })

  it('deux envois simultanés sans enfant : un succès, un 409, aucun rôle', async () => {
    const db = setup()
    const handler = await handlerOf(path)
    const results = await Promise.allSettled([
      handler(createMockEvent({ body: body([]) })),
      handler(createMockEvent({ body: body([]) })),
    ])
    expect(results.filter(r => r.status === 'fulfilled')).toHaveLength(1)
    const ko = results.filter(r => r.status === 'rejected') as PromiseRejectedResult[]
    expect(ko).toHaveLength(1)
    expect(ko[0]!.reason?.statusCode).toBe(409)
    expect(db.rows('user_roles', r => r.user_id === U)).toHaveLength(0)
    expect(db.rows('profiles', r => r.id !== U)).toHaveLength(0)
  })

  it('un envoi après une réussite : 409 et rien de plus n\'est créé', async () => {
    const db = setup()
    const handler = await handlerOf(path)
    await handler(createMockEvent({ body: body([child]) }))
    const err = await catchErr(() => handler(createMockEvent({ body: body([child]) })))
    expect(err?.statusCode).toBe(409)
    expect(db.rows('profiles', r => r.id !== U)).toHaveLength(1)
    expect(db.rows('parent_access')).toHaveLength(1)
    expect(db.rows('user_roles', r => r.user_id === U)).toHaveLength(1)
  })

  it('échec à la création du lien parent-enfant : 500, profil NON marqué complété, aucun enfant orphelin', async () => {
    const db = setup(['parent_access'])
    const handler = await handlerOf(path)
    const err = await catchErr(() => handler(createMockEvent({ body: body([child]) })))
    expect(err?.statusCode).toBe(500)
    expect(db.row('profiles', U)!.profile_completed_at).toBeNull()
    expect(db.rows('profiles', r => r.id !== U)).toHaveLength(0)
  })

  it('échec à l\'attribution du rôle : 500, profil NON marqué complété, aucun enfant créé', async () => {
    const db = setup(['user_roles'])
    const handler = await handlerOf(path)
    const err = await catchErr(() => handler(createMockEvent({ body: body([child]) })))
    expect(err?.statusCode).toBe(500)
    expect(db.row('profiles', U)!.profile_completed_at).toBeNull()
    expect(db.rows('profiles', r => r.id !== U)).toHaveLength(0)
  })

  it('après un échec, la reprise réussit (pas de 409) et ne crée ni enfant ni rôle en double', async () => {
    const db = setup(['parent_access'])
    const handler = await handlerOf(path)
    expect((await catchErr(() => handler(createMockEvent({ body: body([child]) }))))?.statusCode).toBe(500)

    db.failTables.delete('parent_access') // la panne est réparée
    expect(await handler(createMockEvent({ body: body([child]) }))).toEqual({ success: true })

    expect(db.row('profiles', U)!.profile_completed_at).toBeTruthy()
    expect(db.rows('user_roles', r => r.user_id === U && r.role_code === 'parent')).toHaveLength(1)
    expect(db.rows('profiles', r => r.id !== U)).toHaveLength(1)
    expect(db.rows('parent_access', r => r.parent_id === U)).toHaveLength(1)
  })
})
