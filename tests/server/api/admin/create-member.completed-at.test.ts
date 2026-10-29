// T7 auth-profils (complément) — create-member sur un membre dont le profil était déjà complété.
// Comportement attendu (documenté par qa) : la date d'origine de profile_completed_at est conservée ;
// elle n'est posée à « maintenant » que si elle était vide.
// Si ce test échoue : le code de create-member écrase la date (à signaler à api-dev, pas de correction ici).
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createMockEvent, stubNitroGlobals } from '../../../utils/nitro'
import { loadModule } from '../../../utils/helloasso-kit'
import { createServerDb, triggerRow } from '../../../utils/auth-server-fake'

const h = vi.hoisted(() => ({ requireAdmin: vi.fn(), client: null as any }))
vi.mock('#supabase/server', () => ({
  serverSupabaseUser: async () => null,
  serverSupabaseServiceRole: () => h.client,
}))
vi.mock('../../../../server/utils/requireAdmin', () => ({ requireAdmin: h.requireAdmin }))

const ROUTE = 'server/api/admin/create-member.post.ts'
const ID = 'new-1'
const ORIGINAL = '2025-09-15T10:00:00.000Z'

const form = () => ({
  email: 'jean@test.fr', first_name: 'Jean', last_name: 'Martin',
  phone: '', mobile: '', birth_date: '', gender: '', status: 'Actif', licence: '-', formule: '-', roles: [], groupIds: [],
})

async function run(extra: Record<string, unknown>) {
  const db = createServerDb(
    { profiles: [triggerRow(ID, 'jean@test.fr', extra)], user_roles: [], group_members: [] },
    { createdUserId: ID },
  )
  h.client = db.client
  const handler = (await loadModule(ROUTE)).default as (e: unknown) => Promise<any>
  await handler(createMockEvent({ body: form() }))
  return db
}

beforeEach(() => {
  vi.resetModules()
  stubNitroGlobals()
  h.requireAdmin.mockReset().mockResolvedValue({ userId: 'admin-1', roles: ['admin'] })
})
afterEach(() => vi.unstubAllGlobals())

describe('create-member — profile_completed_at d\'un membre existant', () => {
  it('profil déjà complété : la date d\'origine est conservée', async () => {
    const db = await run({ profile_completed_at: ORIGINAL })
    expect(db.row('profiles', ID)!.profile_completed_at).toBe(ORIGINAL)
  })

  it('profil non complété : la date est posée à maintenant', async () => {
    const db = await run({ profile_completed_at: null })
    const at = Date.parse(db.row('profiles', ID)!.profile_completed_at)
    expect(Math.abs(Date.now() - at)).toBeLessThan(60_000)
  })
})
