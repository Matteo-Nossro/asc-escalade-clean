/**
 * GET /api/admin/members
 * Retourne tous les profils avec rôles et inscriptions groupes.
 * Utilise serverSupabaseServiceRole pour bypasser les RLS.
 *
 * Query params :
 *   exportAll=true  → lève la limite PostgREST par défaut (10 000 lignes max)
 */
import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = serverSupabaseServiceRole(event)
  const { exportAll } = getQuery(event)

  let q = client
    .from('profiles')
    .select(`
      *,
      roles:user_roles!user_id(role_code),
      memberships:group_members!user_id(
        status,
        group:groups!group_id(id, name)
      )
    `)
    .order('full_name')

  if (exportAll === 'true') {
    q = q.limit(10000)
  }

  const { data, error } = await q

  if (error) {
    console.error('[api/admin/members] Supabase error:', error)
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return data ?? []
})
