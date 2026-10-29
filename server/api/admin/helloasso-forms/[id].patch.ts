import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAdmin } from '../../../utils/requireAdmin'

import { isValidSeason } from '../../../utils/helloasso-season'

export default defineEventHandler(async (event) => {
  await requireAdmin(event, { requiredRole: 'admin' })
  const client = serverSupabaseServiceRole(event)

  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'id requis' })

  const body = await readBody(event)
  const hasActive = body?.active !== undefined
  const hasSeason = body?.season !== undefined // null compte comme présent, donc invalide

  if (!hasActive && !hasSeason) {
    throw createError({ statusCode: 400, statusMessage: 'active (boolean) ou season requis' })
  }
  if (hasActive && typeof body.active !== 'boolean') {
    throw createError({ statusCode: 400, statusMessage: 'active (boolean) requis' })
  }
  if (hasSeason && !isValidSeason(body.season)) {
    throw createError({ statusCode: 400, statusMessage: 'season au format AAAA-AAAA (années consécutives, ex. 2026-2027)' })
  }

  const patch: { active?: boolean, season?: string } = {}
  if (hasActive) patch.active = body.active
  if (hasSeason) patch.season = body.season

  const { data, error } = await client
    .from('helloasso_forms')
    .update(patch as never) // types Supabase non générés (Database = unknown)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      throw createError({ statusCode: 404, statusMessage: 'Formulaire introuvable.' })
    }
    console.error('[helloasso-forms] modification refusée par la base, code', error.code)
    throw createError({ statusCode: 500, statusMessage: 'Erreur lors de la modification du formulaire.' })
  }

  return data
})
