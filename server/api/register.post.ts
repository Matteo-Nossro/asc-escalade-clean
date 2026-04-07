/**
 * POST /api/register
 * Body : { eventId, name, email }
 * Appelle la RPC check_and_register (atomique).
 */
export default defineEventHandler(async (event) => {
  const body = await readBody<{ eventId: string; name: string; email: string }>(event)
  const { eventId, name, email } = body

  if (!eventId || !name || !email) {
    throw createError({ statusCode: 400, statusMessage: 'Paramètres manquants' })
  }

  const supabase = useSupabaseServiceClient()

  const { data, error } = await supabase.rpc('check_and_register', {
    p_event_id: eventId,
    p_name: name,
    p_email: email,
  })

  if (error) {
    if (error.message?.includes('event_full')) {
      throw createError({ statusCode: 409, statusMessage: 'Événement complet' })
    }
    if (error.message?.includes('event_not_found')) {
      throw createError({ statusCode: 404, statusMessage: 'Événement non trouvé' })
    }
    console.error('[register] Erreur RPC:', error)
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return { registrationId: data }
})
