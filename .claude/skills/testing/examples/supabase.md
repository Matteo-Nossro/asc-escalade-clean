# Accès Supabase dans les tests (stratégie DB-2 : mocks centralisés)

Helper : `tests/utils/supabase-mock.ts`. Aucun Supabase local, et **jamais** la base réelle depuis Vitest.

| Besoin | Pattern |
|---|---|
| Client et utilisateur côté app | `const { client, from, user } = createSupabaseMock({ user: { id: 'u1' } })`, puis `mockNuxtImport('useSupabaseClient', () => () => client)` et `mockNuxtImport('useSupabaseUser', () => () => user)` |
| `auth.signOut` | `createSupabaseMock({ withAuth: true })`, puis `signOut` est un `vi.fn()` |
| Lecture réussie | `from.mockReturnValue(mockChain({ data: [...], error: null }))` |
| `.single()` | `mockChain({ data: { id: 'x' }, error: null })` : toute méthode chaînée renvoie la chaîne |
| Écriture observée | `const insert = vi.fn().mockResolvedValue({ error: null })`, puis `mockChain({ insert })` et `expect(insert).toHaveBeenCalledWith(...)` |
| Erreur | `mockChain({ data: null, error: { message: 'violates row-level security' } })` |
| Comptage | `mockChain({ count: 12, error: null })` |
| Plusieurs tables | `from.mockImplementation((table) => table === 'profiles' ? mockChain({...}) : mockChain({...}))` |
| Côté serveur | `vi.mock('#supabase/server', () => ({ serverSupabaseServiceRole: () => client, serverSupabaseUser: async () => user.value }))` |
| Utilisateur SSR | `user.value = { sub: 'u1' }` pour tester le repli `id ?? sub` |

Limites, à signaler dans le compte rendu si la feature en dépend :
- les contraintes SQL, les triggers et les RLS **ne sont pas testés** ;
- ils se vérifient en revue (skill `supabase-db`), ou manuellement dans `docs/test-plan.md`.
