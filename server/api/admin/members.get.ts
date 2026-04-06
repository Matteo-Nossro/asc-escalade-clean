/**
 * GET /api/admin/members
 * Retourne tous les profils avec rôles et inscriptions groupes.
 * Utilise serverSupabaseServiceRole pour bypasser les RLS.
 */
import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = serverSupabaseServiceRole(event)

  const { data, error } = await client
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

  if (error) {
    console.error('[api/admin/members] Supabase error:', error)
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return data ?? []
})
