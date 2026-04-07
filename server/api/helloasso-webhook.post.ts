/**
 * POST /api/helloasso-webhook
 * Reçoit les notifications HelloAsso et confirme l'inscription si le paiement est traité.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  // On ne traite que les commandes effectivement traitées
  if (body?.eventType !== 'Order' || body?.data?.state !== 'Processed') {
    return { ok: true, skipped: true }
  }

  const registrationId: string | undefined = body.data?.metadata?.registrationId
  const helloassoOrderId: string | undefined = body.data?.id

  if (!registrationId) {
    console.warn('[helloasso-webhook] registrationId manquant dans metadata')
    return { ok: true, skipped: true }
  }

  const supabase = useSupabaseServiceClient()

  const { error } = await supabase
    .from('registrations')
    .update({
      status: 'confirmed',
      helloasso_order_id: helloassoOrderId ?? null,
    })
    .eq('id', registrationId)

  if (error) {
    console.error('[helloasso-webhook] Erreur update registration:', error)
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return { ok: true, registrationId, status: 'confirmed' }
})
