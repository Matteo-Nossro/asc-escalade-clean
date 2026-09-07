import type { H3Event } from 'h3'
import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

const ADMIN_ROLES = ['admin', 'secretary', 'initiateur'] as const
type AdminRole = (typeof ADMIN_ROLES)[number]

/**
 * Garde à appeler en première ligne de chaque handler `server/api/admin/*`.
 *
 * Le middleware Nuxt (`app/middleware/auth.global.ts`) ne s'exécute que sur la
 * navigation client : un appel direct à un endpoint API n'est PAS protégé par
 * lui. Les handlers admin utilisent par ailleurs la `serverSupabaseServiceRole`
 * (qui bypass les RLS), donc l'absence de garde côté serveur expose toute la
 * base. Ce helper vérifie la session Supabase et la présence d'un rôle admin.
 *
 * Passer `requiredRole: 'admin'` pour exiger explicitement le rôle admin
 * (ex. octroi du rôle admin à un autre utilisateur).
 */
export async function requireAdmin(
  event: H3Event,
  options: { requiredRole?: AdminRole } = {},
) {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Non authentifié' })
  }

  // serverSupabaseUser peut retourner le payload JWT brut (avec `sub`) plutôt
  // qu'un objet User Supabase (avec `id`) selon la version de @nuxtjs/supabase.
  const userId: string = user.id || (user as any).sub
  if (!userId) {
    throw createError({ statusCode: 401, statusMessage: 'Non authentifié' })
  }

  const client = serverSupabaseServiceRole(event)
  const allowed = options.requiredRole ? [options.requiredRole] : [...ADMIN_ROLES]

  const { data, error } = await client
    .from('user_roles')
    .select('role_code')
    .eq('user_id', userId)
    .in('role_code', allowed)
    .limit(1)

  if (error || !data?.length) {
    throw createError({ statusCode: 403, statusMessage: 'Accès refusé' })
  }

  return { user, userId, roles: data.map(r => r.role_code as string) }
}
