// Cible d'alias de `#supabase/server` pour Vitest.
//
// `#supabase/server` n'est qu'un alias Nitro posé par @nuxtjs/supabase : Vite ne sait pas
// le résoudre, donc toute route `server/` qui l'importe ne se charge pas sous Vitest, même
// avec `vi.mock('#supabase/server', factory)` (l'analyse des imports échoue avant le mock).
// Ce module sert de cible à `resolve.alias['#supabase/server']` dans vitest.config.ts ;
// chaque test le remplace par `vi.mock('#supabase/server', factory)`.
//
// Aucune de ces fonctions ne doit être appelée pour de vrai : elles lèvent une erreur explicite.

const interdit = (nom: string) => () => {
  throw new Error(`#supabase/server.${nom} appelé sans vi.mock('#supabase/server', …) dans le test`)
}

export const serverSupabaseServiceRole = interdit('serverSupabaseServiceRole')
export const serverSupabaseUser = interdit('serverSupabaseUser')
export const serverSupabaseClient = interdit('serverSupabaseClient')
export const serverSupabaseSession = interdit('serverSupabaseSession')
