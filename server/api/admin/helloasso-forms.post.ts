import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAdmin } from '../../utils/requireAdmin'

import { isValidSeason } from '../../utils/helloasso-season'

export default defineEventHandler(async (event) => {
  await requireAdmin(event, { requiredRole: 'admin' })
  const client = serverSupabaseServiceRole(event)

  const body = await readBody(event)
  const { form_slug, label, form_type, season } = body ?? {}

  if (!form_slug?.trim() || !label?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'form_slug et label sont requis' })
  }
  if (!isValidSeason(season)) {
    throw createError({ statusCode: 400, statusMessage: 'season requise au format AAAA-AAAA (années consécutives, ex. 2026-2027)' })
  }

  const { data, error } = await client
    .from('helloasso_forms')
    .insert({
      form_slug: form_slug.trim(),
      label: label.trim(),
      form_type: form_type ?? 'Membership',
      season,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      throw createError({ statusCode: 409, statusMessage: 'Un formulaire de ce type avec ce slug existe déjà.' })
    }
    console.error('[helloasso-forms] insertion refusée par la base, code', error.code)
    throw createError({ statusCode: 500, statusMessage: 'Erreur lors de l’enregistrement du formulaire.' })
  }

  return data
})
