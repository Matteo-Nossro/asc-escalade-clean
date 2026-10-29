import { serverSupabaseServiceRole } from '#supabase/server'

function normalize(str: string): string {
  return str.toLowerCase().trim().normalize('NFD').replace(/\p{Diacritic}/gu, '')
}

export default defineEventHandler(async (event) => {
  // Fermé par défaut : sans secret configuré, toute notification est refusée (503),
  // avant toute lecture du corps ou accès base. Hors du try pour ne pas être avalé.
  // Un secret fait d'espaces vaut « non configuré ».
  const expectedSecret = String(useRuntimeConfig(event).helloasso?.webhookSecret ?? '').trim()
  if (!expectedSecret) {
    console.error('[webhook/helloasso] Secret du webhook non configuré — notification refusée')
    throw createError({ statusCode: 503, statusMessage: 'Webhook non configuré' })
  }

  // Secret configuré : toujours retourner 200 — HelloAsso abandonne si autre code HTTP
  try {
    // Vérification du secret dans l'URL : configurez l'URL HelloAsso avec
    // ?secret=<NUXT_HELLOASSO_WEBHOOK_SECRET> (HelloAsso ne fournit pas de HMAC natif)
    const { secret } = getQuery(event)
    if (secret !== expectedSecret) {
      console.warn('[webhook/helloasso] Secret invalide — requête ignorée')
      return { ok: true }
    }

    const body = await readBody(event)

    if (body.eventType !== 'Payment') return { ok: true }

    const paymentState: string = body.data?.state ?? ''
    const orderId: string | null = body.data?.id ? String(body.data.id) : null
    const order = body.data?.order

    if (order?.formType !== 'Membership') return { ok: true }

    const client = serverSupabaseServiceRole(event)

    // Vérifier que le formulaire est actif en base
    const { data: form } = await client
      .from('helloasso_forms')
      .select('id')
      .eq('form_slug', order.formSlug)
      .eq('form_type', 'Membership')
      .eq('active', true)
      .maybeSingle()

    if (!form) return { ok: true }

    // ── Paiement confirmé ──────────────────────────────────────────────────
    if (paymentState === 'Authorized') {
      const items: any[] = body.data?.items ?? []
      const membershipItem = items.find(
        (i: any) => i.type === 'Membership' && i.state === 'Processed',
      )
      if (!membershipItem) return { ok: true }

      const amount = (membershipItem.amount ?? 0) / 100
      const payer = body.data?.payer
      const normFirst = normalize(payer?.firstName ?? '')
      const normLast = normalize(payer?.lastName ?? '')

      const { data: profiles } = await client
        .from('profiles')
        .select('id, first_name, last_name')

      const match = (profiles ?? []).find(
        (p: any) =>
          normalize(p.first_name ?? '') === normFirst &&
          normalize(p.last_name ?? '') === normLast,
      )

      if (match) {
        // Upsert profile_payments (idempotent si même (profile_id, form_id))
        await client
          .from('profile_payments')
          .upsert(
            {
              profile_id: match.id,
              form_id: form.id,
              helloasso_order_id: orderId,
              amount,
              paid_at: new Date().toISOString(),
            },
            { onConflict: 'profile_id,form_id' },
          )

        // Maintenir le flag de raccourci pour KPIs / filtres existants
        await client
          .from('profiles')
          .update({ payment_done: true, payment_amount: amount })
          .eq('id', match.id)
      }
    }

    // ── Remboursement / annulation ─────────────────────────────────────────
    if (paymentState === 'Refunded' || paymentState === 'Cancelled') {
      if (!orderId) return { ok: true }

      const { data: deleted } = await client
        .from('profile_payments')
        .delete()
        .eq('helloasso_order_id', orderId)
        .select('profile_id')
        .maybeSingle()

      if (deleted) {
        // S'il ne reste aucun paiement HelloAsso pour ce profil → reset flag
        const { count } = await client
          .from('profile_payments')
          .select('*', { count: 'exact', head: true })
          .eq('profile_id', deleted.profile_id)

        if ((count ?? 0) === 0) {
          await client
            .from('profiles')
            .update({ payment_done: false, payment_amount: null })
            .eq('id', deleted.profile_id)
        }
      }
    }
  } catch (e) {
    console.error('[webhook/helloasso]', e)
  }

  return { ok: true }
})
