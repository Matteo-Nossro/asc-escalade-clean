// enfants-fiabilite T0 — Q1, Q2, Q3 sur completeProfile (via /api/profile/complete et /api/register).
//
//  Q1 : le rôle `parent` n'est accordé qu'APRÈS la création réussie de tous les enfants et de leurs liens ;
//       un échec à la création d'un enfant ou de son lien ne laisse aucun rôle `parent` (aucune insertion de rôle).
//       Sans enfant : pas de rôle. Avec enfants : rôle accordé.
//  Q2 : chaque étape de compensation en échec est journalisée (console.error, étape nommée), les étapes
//       suivantes s'exécutent, l'erreur renvoyée au client reste la 500 d'origine.
//  Q3 : insertion du profil (aucune ligne du trigger) refusée avec le code Postgres 23505 ⇒ 409, sans compensation.
//
// Base en mémoire (tests/utils/auth-server-fake.ts). Pour simuler un échec précis (table + opération), le client est
// enveloppé : une règle fait répondre `{ error }` à l'opération visée, sans l'exécuter. Les autres appels passent
// tels quels. Limite habituelle : ni SQL, ni RLS, ni contraintes réelles.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createMockEvent, stubNitroGlobals } from '../../utils/nitro'
import { loadModule, catchErr } from '../../utils/helloasso-kit'
import { createServerDb, minutesAgo, triggerRow } from '../../utils/auth-server-fake'

const state = vi.hoisted(() => ({ sessionUser: null as any, client: null as any }))
vi.mock('#supabase/server', () => ({
  serverSupabaseUser: async () => state.sessionUser,
  serverSupabaseServiceRole: () => state.client,
}))

const U = 'user-fiabilite'
const EMAIL = 'fiabilite@test.fr'
const parent = {
  first_name: 'Alex', last_name: 'Fiable', email: EMAIL, birth_date: '1988-05-05', gender: 'F',
  phone: null, address: null, postal_code: null, city: null,
}
const child = { first_name: 'Noé', last_name: 'Fiable', birth_date: '2015-02-02', address: null, postal_code: null, city: null }
const twoChildren = [child, { ...child, first_name: 'Eli' }]

const ROUTES = [
  { name: '/api/profile/complete', path: 'server/api/profile/complete.post.ts', body: (children: any[]) => ({ parent, children }) },
  { name: '/api/register', path: 'server/api/register.post.ts', body: (children: any[]) => ({ userId: U, parent, children }) },
]

type WriteOp = 'insert' | 'update' | 'delete' | 'upsert'
interface Rule {
  table: string
  op: WriteOp
  error: { code?: string, message: string }
  /** Condition sur la charge utile et le rang (1 = premier appel de ce couple table/opération). */
  when?: (payload: any, nth: number) => boolean
}
interface Call { table: string, op: string, payload: any, failed: boolean }

/** Enveloppe `client.from` : les écritures visées par une règle répondent `{ data: null, error }` sans toucher aux tables. */
function withRules(base: ReturnType<typeof createServerDb>, rules: Rule[]) {
  const calls: Call[] = []
  const counts = new Map<string, number>()
  const baseFrom = base.client.from
  const from = (table: string) => {
    const q = baseFrom(table) as any
    let op = 'select'
    let payload: any
    const proxy: any = new Proxy(q, {
      get(target, prop) {
        if (prop === 'then') {
          let rule: Rule | undefined
          if (op !== 'select') {
            const key = `${table}:${op}`
            const nth = (counts.get(key) ?? 0) + 1
            counts.set(key, nth)
            rule = rules.find(r => r.table === table && r.op === op && (!r.when || r.when(payload, nth)))
          }
          calls.push({ table, op, payload, failed: !!rule })
          if (rule) return (ok: any, ko: any) => Promise.resolve({ data: null, error: rule!.error }).then(ok, ko)
          return target.then.bind(target)
        }
        const value = target[prop]
        if (typeof value !== 'function') return value
        return (...args: any[]) => {
          if (prop === 'insert' || prop === 'update' || prop === 'delete' || prop === 'upsert') {
            op = prop
            payload = args[0]
          }
          const out = value.apply(target, args)
          return out === target ? proxy : out
        }
      },
    })
    return proxy
  }
  base.client.from = from as any
  return calls
}

function setup(opts: { rules?: Rule[], profiles?: any[], tables?: Record<string, any[]> } = {}) {
  const db = createServerDb(
    { profiles: opts.profiles ?? [triggerRow(U, EMAIL)], user_roles: [], parent_access: [], ...(opts.tables ?? {}) },
    { authUsers: { [U]: { id: U, email: EMAIL, created_at: minutesAgo(5), last_sign_in_at: null } } },
  )
  const calls = withRules(db, opts.rules ?? [])
  state.client = db.client
  state.sessionUser = { id: U, sub: U, email: EMAIL }
  return { db, calls }
}
const handlerOf = async (path: string) => (await loadModule(path)).default as (e: unknown) => Promise<any>
const parentRoles = (db: ReturnType<typeof createServerDb>) => db.rows('user_roles', r => r.user_id === U && r.role_code === 'parent')
const childProfiles = (db: ReturnType<typeof createServerDb>) => db.rows('profiles', r => r.id !== U)

beforeEach(() => {
  vi.resetModules()
  stubNitroGlobals()
  state.sessionUser = null
})
afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe.each(ROUTES)('$name', ({ path, body }) => {
  describe('Q1 — le rôle parent n\'est accordé qu\'après la création des enfants', () => {
    it('échec à la création d\'un enfant : 500, aucune insertion du rôle parent, rien de conservé', async () => {
      const { db, calls } = setup({
        rules: [{ table: 'profiles', op: 'insert', error: { message: 'insertion refusée (simulé)' }, when: p => p?.id !== U }],
      })
      const err = await catchErr(async () => (await handlerOf(path))(createMockEvent({ body: body([child]) })))
      expect(err?.statusCode).toBe(500)
      expect(calls.filter(c => c.table === 'user_roles' && c.op === 'insert')).toHaveLength(0)
      expect(parentRoles(db)).toHaveLength(0)
      expect(db.row('profiles', U)!.profile_completed_at).toBeNull()
    })

    it('échec à la création du lien parent-enfant : 500, aucune insertion du rôle parent, aucun rôle conservé', async () => {
      const { db, calls } = setup({
        rules: [{ table: 'parent_access', op: 'insert', error: { message: 'lien refusé (simulé)' } }],
      })
      const err = await catchErr(async () => (await handlerOf(path))(createMockEvent({ body: body([child]) })))
      expect(err?.statusCode).toBe(500)
      expect(calls.filter(c => c.table === 'user_roles' && c.op === 'insert')).toHaveLength(0)
      expect(parentRoles(db)).toHaveLength(0)
      expect(childProfiles(db)).toHaveLength(0)
    })

    it('échec sur le SECOND enfant : le premier est supprimé et aucun rôle parent n\'a été accordé', async () => {
      const { db, calls } = setup({
        rules: [{ table: 'profiles', op: 'insert', error: { message: 'insertion refusée (simulé)' }, when: (p, nth) => p?.id !== U && nth === 2 }],
      })
      const err = await catchErr(async () => (await handlerOf(path))(createMockEvent({ body: body(twoChildren) })))
      expect(err?.statusCode).toBe(500)
      expect(calls.filter(c => c.table === 'user_roles' && c.op === 'insert')).toHaveLength(0)
      expect(parentRoles(db)).toHaveLength(0)
      expect(childProfiles(db)).toHaveLength(0)
      expect(db.rows('parent_access')).toHaveLength(0)
    })

    it('succès avec enfants : le rôle parent est inséré APRÈS le dernier lien parent_access', async () => {
      const { db, calls } = setup()
      expect(await (await handlerOf(path))(createMockEvent({ body: body(twoChildren) }))).toEqual({ success: true })
      expect(parentRoles(db)).toHaveLength(1)
      expect(childProfiles(db)).toHaveLength(2)
      const roleAt = calls.findIndex(c => c.table === 'user_roles' && c.op === 'insert')
      const lastLinkAt = calls.map(c => `${c.table}:${c.op}`).lastIndexOf('parent_access:insert')
      expect(roleAt).toBeGreaterThanOrEqual(0)
      expect(lastLinkAt).toBeGreaterThanOrEqual(0)
      expect(roleAt).toBeGreaterThan(lastLinkAt)
    })

    it('succès sans enfant : aucun rôle parent', async () => {
      const { db, calls } = setup()
      expect(await (await handlerOf(path))(createMockEvent({ body: body([]) }))).toEqual({ success: true })
      expect(calls.filter(c => c.table === 'user_roles' && c.op === 'insert')).toHaveLength(0)
      expect(db.rows('user_roles', r => r.user_id === U)).toHaveLength(0)
    })

    it('re-soumission (enfants déjà liés) : le rôle parent est accordé, sans doublon d\'enfant', async () => {
      const { db } = setup({
        tables: { parent_access: [{ id: 'pa-1', parent_id: U, child_id: 'enfant-existant', access_type: 'full' }] },
      })
      expect(await (await handlerOf(path))(createMockEvent({ body: body([child]) }))).toEqual({ success: true })
      expect(parentRoles(db)).toHaveLength(1)
      expect(childProfiles(db)).toHaveLength(0)
      expect(db.rows('parent_access')).toHaveLength(1)
    })

    it('échec à l\'attribution du rôle (après les enfants) : 500, enfants et liens supprimés, profil non marqué complété', async () => {
      const { db } = setup({
        rules: [{ table: 'user_roles', op: 'insert', error: { message: 'rôle refusé (simulé)' } }],
      })
      const err = await catchErr(async () => (await handlerOf(path))(createMockEvent({ body: body(twoChildren) })))
      expect(err?.statusCode).toBe(500)
      expect(parentRoles(db)).toHaveLength(0)
      expect(childProfiles(db)).toHaveLength(0)
      expect(db.rows('parent_access')).toHaveLength(0)
      expect(db.row('profiles', U)!.profile_completed_at).toBeNull()
    })
  })

  describe('Q2 — la compensation journalise chaque étape en échec', () => {
    // Échec initial : le lien parent-enfant du 1er enfant. La compensation doit alors supprimer le lien, supprimer
    // le profil enfant et libérer la réservation (3 étapes).
    const initialFailure: Rule = { table: 'parent_access', op: 'insert', error: { message: 'lien refusé (simulé)' } }
    const compensationLogs = (spy: ReturnType<typeof vi.spyOn>) =>
      spy.mock.calls.filter(args => /compensation/i.test(args.map(a => (a instanceof Error ? a.message : String(a))).join(' ')))

    it('une étape en échec (suppression des liens) : une entrée console.error, les étapes suivantes s\'exécutent, erreur client inchangée', async () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const { db } = setup({
        rules: [initialFailure, { table: 'parent_access', op: 'delete', error: { message: 'suppression refusée (simulé)' } }],
      })
      const err = await catchErr(async () => (await handlerOf(path))(createMockEvent({ body: body([child]) })))

      expect(err?.statusCode).toBe(500)
      expect(err?.statusMessage).toContain('Erreur lien parent-enfant')
      expect(compensationLogs(spy)).toHaveLength(1)
      // Les étapes suivantes ont bien eu lieu malgré l'échec de la première.
      expect(childProfiles(db)).toHaveLength(0)
      expect(db.row('profiles', U)!.profile_completed_at).toBeNull()
    })

    it('les trois étapes en échec : trois entrées console.error distinctes, erreur client toujours la 500 d\'origine', async () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const { calls } = setup({
        rules: [
          initialFailure,
          { table: 'parent_access', op: 'delete', error: { message: 'suppression des liens refusée (simulé)' } },
          { table: 'profiles', op: 'delete', error: { message: 'suppression des enfants refusée (simulé)' } },
          { table: 'profiles', op: 'update', error: { message: 'libération refusée (simulé)' }, when: p => p?.profile_completed_at === null },
        ],
      })
      const err = await catchErr(async () => (await handlerOf(path))(createMockEvent({ body: body([child]) })))

      expect(err?.statusCode).toBe(500)
      expect(err?.statusMessage).toContain('Erreur lien parent-enfant')
      // Les trois étapes ont toutes été tentées (aucune n'interrompt la suivante).
      expect(calls.filter(c => c.failed && c.op === 'delete' && c.table === 'parent_access')).toHaveLength(1)
      expect(calls.filter(c => c.failed && c.op === 'delete' && c.table === 'profiles')).toHaveLength(1)
      expect(calls.filter(c => c.failed && c.op === 'update' && c.table === 'profiles' && c.payload?.profile_completed_at === null)).toHaveLength(1)

      const logs = compensationLogs(spy)
      expect(logs).toHaveLength(3)
      // Étape nommée : les trois messages (premier argument) sont différents.
      expect(new Set(logs.map(args => String(args[0]))).size).toBe(3)
    })

    it('la compensation réussie ne journalise rien', async () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const { db } = setup({ rules: [initialFailure] })
      const err = await catchErr(async () => (await handlerOf(path))(createMockEvent({ body: body([child]) })))
      expect(err?.statusCode).toBe(500)
      expect(compensationLogs(spy)).toHaveLength(0)
      expect(childProfiles(db)).toHaveLength(0)
    })
  })

  describe('Q3 — insertion du profil refusée par une violation de clé (23505)', () => {
    const duplicateKey: Rule = {
      table: 'profiles',
      op: 'insert',
      error: { code: '23505', message: 'duplicate key value violates unique constraint "profiles_pkey"' },
      when: p => p?.id === U,
    }

    it('23505 sur l\'insertion du profil : 409 (pas 500), aucune compensation ni autre écriture', async () => {
      const { db, calls } = setup({ profiles: [], rules: [duplicateKey] })
      const err = await catchErr(async () => (await handlerOf(path))(createMockEvent({ body: body([child]) })))
      expect(err?.statusCode).toBe(409)
      expect(err?.statusMessage).toBe('Cette adresse email est déjà inscrite.')
      const writes = calls.filter(c => c.op !== 'select')
      expect(writes).toHaveLength(1) // seulement l'insertion refusée
      expect(writes[0]).toMatchObject({ table: 'profiles', op: 'insert', failed: true })
      expect(db.rows('user_roles')).toHaveLength(0)
      expect(db.rows('parent_access')).toHaveLength(0)
    })

    it('une autre erreur sur l\'insertion du profil reste une 500', async () => {
      setup({
        profiles: [],
        rules: [{ ...duplicateKey, error: { code: '42501', message: 'permission denied (simulé)' } }],
      })
      const err = await catchErr(async () => (await handlerOf(path))(createMockEvent({ body: body([child]) })))
      expect(err?.statusCode).toBe(500)
    })

    it('deux complétions simultanées sans ligne du trigger : un succès, un 409, un seul jeu d\'enfants', async () => {
      // La seconde insertion de la ligne du parent viole la clé primaire (la première a réussi).
      const { db } = setup({
        profiles: [],
        rules: [{ ...duplicateKey, when: (p, nth) => p?.id === U && nth >= 2 }],
      })
      const handler = await handlerOf(path)
      const results = await Promise.allSettled([
        handler(createMockEvent({ body: body(twoChildren) })),
        handler(createMockEvent({ body: body(twoChildren) })),
      ])
      const ok = results.filter(r => r.status === 'fulfilled') as PromiseFulfilledResult<any>[]
      const ko = results.filter(r => r.status === 'rejected') as PromiseRejectedResult[]
      expect(ok).toHaveLength(1)
      expect(ko).toHaveLength(1)
      expect(ko[0]!.reason?.statusCode).toBe(409)
      expect(childProfiles(db)).toHaveLength(2)
      expect(db.rows('parent_access', r => r.parent_id === U)).toHaveLength(2)
      expect(parentRoles(db)).toHaveLength(1)
    })
  })
})
