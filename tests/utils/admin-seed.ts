// auth-erreur-profil — valeurs reconnaissables semées pour les tests de la coquille de /admin.
// Rien de ce qui est ici ne doit apparaître dans la coquille d'une page /admin quand la lecture du profil a échoué.
import { vi } from 'vitest'

export const SEED = {
  /** Profil du compte connecté (lu dans `profiles`). */
  profileName: 'Gwendoline Seedprofil',
  profileEmail: 'gwendoline.seedprofil@test.fr',
  /** Liste des membres (renvoyée par /api/admin/members). */
  memberFirst: 'Prunelle',
  memberLast: 'Seedmembre',
  memberEmail: 'prunelle.seedmembre@test.fr',
  /** Statistique HelloAsso (renvoyée par /api/admin/helloasso-stats). */
  paid: 4242,
  total: 4343,
}

/** Fragments à ne jamais retrouver dans une coquille sans donnée. */
export const SEED_MARKERS = [
  'Seedprofil', SEED.profileEmail, 'Seedmembre', SEED.memberEmail, 'Prunelle',
]

export const MEMBERS = [{
  id: 'm-seed-1',
  first_name: SEED.memberFirst,
  last_name: SEED.memberLast,
  full_name: `${SEED.memberFirst} ${SEED.memberLast}`,
  email: SEED.memberEmail,
  status: 'Actif',
  licence_number: 987654,
  roles: [],
  memberships: [],
}]

/** Faux `fetch` : sert /api/admin/members et /api/admin/helloasso-stats avec les valeurs semées. */
export function makeFetchStub() {
  return vi.fn(async (url: string) => {
    const body = String(url).includes('helloasso-stats')
      ? { groups: [{ groupId: 'g-seed', paid: SEED.paid, total: SEED.total }] }
      : MEMBERS
    return { ok: true, status: 200, json: async () => body }
  })
}

/**
 * Après `serveAuth(from, db)` : les tables métier (groups, group_members, registrations…) répondent « vide, sans erreur »
 * et chaque lecture est enregistrée dans `db.reads` ; `profiles` et `user_roles` restent servis par la base simulée.
 */
export function serveBusinessTablesEmpty(from: ReturnType<typeof vi.fn>, db: { reads: Array<{ table: string, uid: string }> }) {
  const base = from.getMockImplementation() as (table: string) => any
  from.mockImplementation((table: string) => {
    if (table === 'profiles' || table === 'user_roles') return base(table)
    db.reads.push({ table, uid: '' })
    const q: any = new Proxy(() => {}, {
      get: (_t, prop) => prop === 'then'
        ? (ok: any, ko: any) => Promise.resolve({ data: [], error: null, count: 0 }).then(ok, ko)
        : () => q,
    })
    return q
  })
}
