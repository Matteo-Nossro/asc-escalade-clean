import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAdmin } from '../../utils/requireAdmin'

export default defineEventHandler(async (event) => {
  await requireAdmin(event, { allowedRoles: ['admin', 'secretary'] })
  const client = serverSupabaseServiceRole(event)

  const { data, error } = await client
    .from('helloasso_forms')
    .select('*')
    .order('created_at')

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  return data ?? []
})
