// Supabase simulé pour les tests qui dépendent des rôles (feature auth-profils).
//
// Sert le VRAI `useAuth` : les lectures `profiles` et `user_roles` répondent depuis une petite base en mémoire,
// et chaque lecture est enregistrée dans `reads` (pour vérifier « une seule lecture »). Une lecture peut être
// retenue (`hold`) pour tester les états intermédiaires, ou refusée (`fail`).
//
// Forme des requêtes acceptée : select(...).eq(col, id)[.in(...)][.limit()][.single()|.maybeSingle()] ou attendu directement.
// Limite (comme supabase-mock.ts) : ni SQL, ni RLS.

import { vi } from 'vitest'

export interface AuthRead { table: string, uid: string }

export interface AuthDb {
  /** Profils par id utilisateur. */
  profiles: Record<string, any>
  /** Codes de rôle par id utilisateur. */
  roles: Record<string, string[]>
  /** Quand vrai, toute lecture répond par une erreur. */
  fail: boolean
  /** Lectures effectuées (table + id), dans l'ordre. */
  reads: AuthRead[]
  /** Retient les réponses jusqu'à l'appel de la fonction renvoyée. */
  hold: () => () => void
  /** Libère toute lecture retenue (à appeler dans afterEach pour ne rien laisser en vol). */
  releaseAll: () => void
  /** Nombre de lectures d'une table. */
  count: (table: string) => number
  _gate: Promise<void> | null
}

export function createAuthDb(init: { profiles?: Record<string, any>, roles?: Record<string, string[]> } = {}): AuthDb {
  const releases: Array<() => void> = []
  const db: AuthDb = {
    profiles: { ...(init.profiles ?? {}) },
    roles: { ...(init.roles ?? {}) },
    fail: false,
    reads: [],
    _gate: null,
    hold() {
      let release!: () => void
      db._gate = new Promise<void>((r) => { release = r })
      releases.push(release)
      return () => { release(); db._gate = null }
    },
    releaseAll() {
      for (const r of releases.splice(0)) r()
      db._gate = null
    },
    count: table => db.reads.filter(r => r.table === table).length,
  }
  return db
}

function query(db: AuthDb, table: string) {
  let uid = ''
  let inCodes: string[] | null = null
  const run = async (single: boolean) => {
    db.reads.push({ table, uid })
    if (db._gate) await db._gate
    if (db.fail) return { data: null, error: { message: 'lecture refusée (simulé)' } }
    if (table === 'profiles') {
      const row = db.profiles[uid]
      if (!row) return { data: null, error: { code: 'PGRST116', message: 'aucune ligne' } }
      return { data: single ? { ...row } : [{ ...row }], error: null }
    }
    if (table === 'user_roles') {
      let codes = db.roles[uid] ?? []
      if (inCodes) codes = codes.filter(c => inCodes!.includes(c))
      return { data: codes.map(role_code => ({ role_code })), error: null }
    }
    return { data: null, error: { message: `table inattendue : ${table}` } }
  }
  const q: any = {
    select: () => q,
    eq: (_col: string, value: string) => { uid = value; return q },
    in: (_col: string, values: string[]) => { inCodes = values; return q },
    limit: () => q,
    order: () => q,
    single: () => run(true),
    maybeSingle: () => run(true),
    then: (ok: any, ko: any) => run(false).then(ok, ko),
  }
  return q
}

/** Branche `from` (le vi.fn renvoyé par createSupabaseMock) sur la base simulée. */
export function serveAuth(from: ReturnType<typeof vi.fn>, db: AuthDb) {
  from.mockReset().mockImplementation((table: string) => query(db, table))
}

/**
 * R2c-T0a : ajoute au faux client `auth.getSession` et `auth.exchangeCodeForSession` (échange PKCE d'un `?code=`).
 * Par défaut : aucune session, échange refusé. Chaque test règle les `vi.fn()` renvoyés (mockResolvedValue…).
 * N'ajoute rien d'autre : les tests qui n'appellent pas ces méthodes ne sont pas touchés.
 */
export function addCodeExchange(client: Record<string, any>) {
  const getSession = vi.fn().mockResolvedValue({ data: { session: null }, error: null })
  const exchangeCodeForSession = vi.fn().mockResolvedValue({
    data: { session: null, user: null },
    error: { message: 'invalid flow state, no valid flow state found (simulé)' },
  })
  client.auth = { ...(client.auth ?? {}), getSession, exchangeCodeForSession }
  return { getSession, exchangeCodeForSession }
}

/** Profil de test : complété par défaut. */
export function profileOf(id: string, extra: Record<string, any> = {}) {
  return {
    id,
    email: `${id}@test.fr`,
    full_name: `Compte ${id}`,
    first_name: 'Compte',
    last_name: id,
    status: 'Actif',
    profile_completed_at: '2026-01-01T10:00:00.000Z',
    ...extra,
  }
}
