// enfants-fiabilite T0 — Q4 : POST /api/register, message du 403 pour un compte sans session trop ancien
// ou déjà connecté (compte non confirmé qui refait un signUp > 1 h plus tard).
// Le message est unique et neutre (décision utilisateur) : il ne révèle pas l'état du compte.
// L'autre 403 (e-mail du compte différent de celui du formulaire) reçoit le même message (décision utilisateur).
// Couvre les 4 sources de 403 de register.post.ts (session incohérente, e-mail différent, compte > 1 h, déjà connecté).
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
const U = 'user-non-confirme'
const EMAIL = 'nonconfirme@test.fr'
const MESSAGE_403 = 'Impossible de finaliser l\'inscription. Si vous avez déjà un compte, connectez-vous ; sinon, recommencez l\'inscription.'

const parent = {
  first_name: 'Alex', last_name: 'Martin', email: EMAIL, birth_date: '1990-01-01', gender: 'F',
  phone: null as string | null, address: null, postal_code: null, city: null,
}

function setup(authUser: Partial<FakeAuthUser>) {
  const user: FakeAuthUser = { id: U, email: EMAIL, created_at: minutesAgo(10), last_sign_in_at: null, ...authUser }
  const db = createServerDb({ profiles: [triggerRow(U, EMAIL)], user_roles: [], parent_access: [] }, { authUsers: { [U]: user } })
  state.client = db.client
  state.sessionUser = null
  return db
}

async function errorOf(body: Record<string, any> = { userId: U, parent, children: [] }) {
  const handler = (await loadModule(ROUTE)).default as (e: unknown) => Promise<any>
  return catchErr(() => handler(createMockEvent({ body })))
}

beforeEach(() => {
  vi.resetModules()
  stubNitroGlobals()
  state.sessionUser = null
})
afterEach(() => vi.unstubAllGlobals())

describe('Q4 — register.post : 403 d\'un compte sans session', () => {
  it('compte créé il y a plus d\'une heure : 403 avec le message neutre fixé, rien n\'est écrit', async () => {
    const db = setup({ created_at: minutesAgo(90) })
    const err = await errorOf()
    expect(err?.statusCode).toBe(403)
    expect(err?.statusMessage).toBe(MESSAGE_403)
    expect(db.writes()).toHaveLength(0)
  })

  it('compte déjà connecté (last_sign_in_at renseigné) : même 403, même message unique', async () => {
    const db = setup({ last_sign_in_at: minutesAgo(2) })
    const err = await errorOf()
    expect(err?.statusCode).toBe(403)
    expect(err?.statusMessage).toBe(MESSAGE_403)
    expect(db.writes()).toHaveLength(0)
  })

  it('le message ne révèle pas l\'état du compte (ne dit ni « confirmé » ni « non confirmé »)', async () => {
    setup({ created_at: minutesAgo(90) })
    const err = await errorOf()
    expect(String(err?.statusMessage)).not.toMatch(/confirm/i)
  })

  it('e-mail du compte différent de celui du formulaire : même 403, même message neutre unique', async () => {
    const db = setup({ email: 'autre@test.fr', created_at: minutesAgo(90) })
    const err = await errorOf()
    expect(err?.statusCode).toBe(403)
    expect(err?.statusMessage).toBe(MESSAGE_403)
    expect(db.writes()).toHaveLength(0)
  })

  it('session d\'un autre utilisateur (id incohérent avec userId) : même 403, même message neutre unique', async () => {
    const db = setup({ created_at: minutesAgo(10) })
    state.sessionUser = { id: 'autre-utilisateur', sub: 'autre-utilisateur', email: 'autre@test.fr' }
    const err = await errorOf()
    expect(err?.statusCode).toBe(403)
    expect(err?.statusMessage).toBe(MESSAGE_403)
    expect(db.writes()).toHaveLength(0)
  })

  it('userId inconnu de l\'auth : 400 (code inchangé) avec le même message neutre unique', async () => {
    const db = setup({ created_at: minutesAgo(10) })
    const err = await errorOf({ userId: 'inconnu', parent, children: [] })
    expect(err?.statusCode).toBe(400)
    expect(err?.statusMessage).toBe(MESSAGE_403)
    expect(db.writes()).toHaveLength(0)
  })

  it('compte récent, jamais connecté : inscription acceptée (comportement nominal inchangé)', async () => {
    setup({ created_at: minutesAgo(10) })
    const handler = (await loadModule(ROUTE)).default as (e: unknown) => Promise<any>
    expect(await handler(createMockEvent({ body: { userId: U, parent, children: [] } }))).toEqual({ success: true })
  })
})
