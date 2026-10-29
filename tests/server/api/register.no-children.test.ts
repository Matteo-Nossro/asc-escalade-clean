// T7 + R1-a auth-profils — POST /api/register et rôle « parent ».
// Règle unique (décision R1-a) : le rôle « parent » est attribué si et seulement si des enfants sont déclarés,
// comme pour /api/profile/complete. L'inscription par e-mail sans enfant ne reçoit plus « parent ».
// (Avant R1-a ce fichier verrouillait l'inverse : « parent » toujours attribué.)
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createMockEvent, stubNitroGlobals } from '../../utils/nitro'
import { loadModule } from '../../utils/helloasso-kit'
import { createServerDb, minutesAgo, triggerRow } from '../../utils/auth-server-fake'

const state = vi.hoisted(() => ({ client: null as any }))
vi.mock('#supabase/server', () => ({
  serverSupabaseUser: async () => ({ id: 'u-1', sub: 'u-1', email: 'sans@test.fr' }),
  serverSupabaseServiceRole: () => state.client,
}))

const parent = {
  first_name: 'Sam', last_name: 'Seul', email: 'sans@test.fr', birth_date: '1990-01-01', gender: 'M',
  phone: null, address: null, postal_code: null, city: null,
}
const child = { first_name: 'Léo', last_name: 'Seul', birth_date: '2014-06-01', address: null, postal_code: null, city: null }

function setup() {
  const db = createServerDb(
    { profiles: [triggerRow('u-1', 'sans@test.fr')], user_roles: [], parent_access: [] },
    { authUsers: { 'u-1': { id: 'u-1', email: 'sans@test.fr', created_at: minutesAgo(5), last_sign_in_at: null } } },
  )
  state.client = db.client
  return db
}
async function call(body: Record<string, any>) {
  const handler = (await loadModule('server/api/register.post.ts')).default as (e: unknown) => Promise<any>
  return handler(createMockEvent({ body }))
}

beforeEach(() => {
  vi.resetModules()
  stubNitroGlobals()
})
afterEach(() => vi.unstubAllGlobals())

describe('R1-a — register sans enfant : aucun rôle parent', () => {
  it.each([[[]], [undefined]])('children = %j : succès, profil complété, aucun rôle, aucun enfant ni parent_access', async (children) => {
    const db = setup()
    expect(await call({ userId: 'u-1', parent, children })).toEqual({ success: true })
    expect(db.row('profiles', 'u-1')!.profile_completed_at).toBeTruthy()
    expect(db.rows('user_roles', r => r.user_id === 'u-1')).toHaveLength(0)
    expect(db.rows('profiles', r => r.id !== 'u-1')).toHaveLength(0)
    expect(db.tables.parent_access).toHaveLength(0)
  })
})

describe('R1-a — register avec enfants : rôle parent', () => {
  it('un ou plusieurs enfants : rôle parent attribué une seule fois, enfants liés', async () => {
    const db = setup()
    expect(await call({ userId: 'u-1', parent, children: [child, { ...child, first_name: 'Mia' }] })).toEqual({ success: true })
    expect(db.rows('user_roles', r => r.user_id === 'u-1').map(r => r.role_code)).toEqual(['parent'])
    expect(db.rows('profiles', r => r.id !== 'u-1')).toHaveLength(2)
    expect(db.tables.parent_access).toHaveLength(2)
  })
})
