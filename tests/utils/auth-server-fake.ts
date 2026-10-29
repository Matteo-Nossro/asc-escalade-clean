// Base simulée pour les routes serveur d'auth-profils (register, profile/complete, create-member).
//
// S'appuie sur tests/utils/fake-supabase.ts (tables en mémoire : on observe l'ÉTAT final, pas la forme des appels)
// et ajoute `auth.admin.getUserById` / `createUser`. Les triggers SQL ne tournent pas : on pose à la main la ligne
// que `handle_new_user` (et `on_profile_enrich`) auraient créée.
// Limite (comme les autres faux) : ni SQL, ni RLS, ni contraintes.

import { vi } from 'vitest'
import { createFakeSupabase, type Row } from './fake-supabase'

export interface FakeAuthUser {
  id: string
  email: string
  created_at: string
  last_sign_in_at: string | null
}

export interface ServerDbOptions {
  /** Utilisateurs connus de `auth.admin.getUserById`, par id. */
  authUsers?: Record<string, FakeAuthUser>
  /** Tables dont les écritures et lectures répondent par une erreur (pour tester l'ordre des écritures). */
  failTables?: string[]
  /** Identifiant renvoyé par `auth.admin.createUser`. */
  createdUserId?: string
}

const failingQuery = () => {
  const q: any = new Proxy({}, {
    get(_t, prop) {
      if (prop === 'then') return (ok: any, ko: any) => Promise.resolve({ data: null, error: { message: 'écriture refusée (simulé)' } }).then(ok, ko)
      return () => q
    },
  })
  return q
}

export function createServerDb(tables: Record<string, Row[]> = {}, options: ServerDbOptions = {}) {
  const sb = createFakeSupabase(tables, { maxOps: 1000 })
  const authUsers = options.authUsers ?? {}
  const getUserById = vi.fn(async (id: string) => {
    const user = authUsers[id]
    return user
      ? { data: { user }, error: null }
      : { data: { user: null }, error: { message: 'User not found' } }
  })
  const createUser = vi.fn(async (attrs: { email: string }) => {
    const id = options.createdUserId ?? 'created-user-1'
    return { data: { user: { id, email: attrs.email } }, error: null }
  })
  const fail = new Set(options.failTables ?? [])
  const client = {
    from: (table: string) => (fail.has(table) ? failingQuery() : sb.from(table)),
    rpc: sb.rpc,
    auth: { admin: { getUserById, createUser } },
  }
  return {
    client,
    sb,
    getUserById,
    createUser,
    /** Tables en panne : modifiable en cours de test (`failTables.delete('parent_access')` = la panne est réparée). */
    failTables: fail,
    get tables() { return sb.tables },
    /** Écritures (tout sauf select) effectuées, dans l'ordre. */
    writes: () => sb.ops.filter(o => o.op !== 'select'),
    row: (table: string, id: string): Row | undefined => sb.tables[table]?.find(r => r.id === id),
    rows: (table: string, pred: (r: Row) => boolean = () => true): Row[] => (sb.tables[table] ?? []).filter(pred),
  }
}

export const minutesAgo = (n: number) => new Date(Date.now() - n * 60_000).toISOString()

/** Ligne telle que `handle_new_user` la crée (+ enrichissement éventuel passé en `extra`). */
export function triggerRow(id: string, email: string, extra: Row = {}): Row {
  return {
    id,
    email,
    full_name: email,
    status: 'En attente',
    profile_completed_at: null,
    first_name: null,
    last_name: null,
    birth_date: null,
    gender: null,
    phone: null,
    address: null,
    postal_code: null,
    city: null,
    ...extra,
  }
}
