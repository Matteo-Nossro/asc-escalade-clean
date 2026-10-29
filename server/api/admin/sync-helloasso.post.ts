import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAdmin } from '../../utils/requireAdmin'
import { toH3Error, useHelloAsso } from '../../utils/helloasso'

function normalize(str: string): string {
  return str.toLowerCase().trim().normalize('NFD').replace(/\p{Diacritic}/gu, '')
}

/** Traduit l'erreur du client HelloAsso et pose l'en-tête HTTP Retry-After s'il est connu. */
function asHttpError(event: Parameters<typeof useHelloAsso>[0], err: unknown) {
  const h3 = toH3Error(err) as any
  const retryAfter = h3?.headers?.['Retry-After']
  if (retryAfter) setResponseHeader(event, 'Retry-After', retryAfter)
  return h3
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event, { requiredRole: 'admin' })
  const client = serverSupabaseServiceRole(event)

  // Récupérer les formulaires Membership actifs avec leur id en base
  const { data: forms, error: formsError } = await client
    .from('helloasso_forms')
    .select('id, form_slug')
    .eq('form_type', 'Membership')
    .eq('active', true)

  if (formsError) {
    console.error('[sync-helloasso] lecture des formulaires impossible, code', formsError.code)
    throw createError({ statusCode: 500, statusMessage: 'Lecture des formulaires impossible.' })
  }
  if (!forms?.length) return { matched: 0, unmatched: [] }

  let helloasso: ReturnType<typeof useHelloAsso>
  try {
    helloasso = useHelloAsso(event)
  }
  catch (err) {
    throw asHttpError(event, err)
  }

  // Collecter tous les items avec l'id HelloAsso (pour déduplication) et le form_id en base
  const items: Array<{
    firstName: string
    lastName: string
    amount: number
    orderId: string
    formId: string
  }> = []

  for (const form of forms) {
    let pageIndex = 1
    while (true) {
      let json: any
      try {
        json = await helloasso.get(
          `/organizations/${encodeURIComponent(helloasso.config.orgSlug)}/forms/Membership/${encodeURIComponent(form.form_slug)}/items`,
          { pageIndex, pageSize: 100 },
        )
      }
      catch (err) {
        throw asHttpError(event, err)
      }
      const pageItems: any[] = json?.data ?? []

      for (const item of pageItems) {
        items.push({
          firstName: item.user?.firstName ?? item.payer?.firstName ?? '',
          lastName: item.user?.lastName ?? item.payer?.lastName ?? '',
          amount: (item.amount ?? 0) / 100,
          orderId: String(item.id ?? ''),
          formId: form.id,
        })
      }
      if (pageItems.length < 100) break
      pageIndex++
    }
  }

  if (!items.length) return { matched: 0, unmatched: [] }

  // Index normalisé prénom|nom → profile_id
  const { data: profiles } = await client
    .from('profiles')
    .select('id, first_name, last_name')

  const profileMap = new Map<string, string>()
  for (const p of profiles ?? []) {
    const key = `${normalize(p.first_name ?? '')}|${normalize(p.last_name ?? '')}`
    profileMap.set(key, p.id)
  }

  let matchedCount = 0
  const unmatched: Array<{ firstName: string; lastName: string }> = []

  for (const item of items) {
    const key = `${normalize(item.firstName)}|${normalize(item.lastName)}`
    const profileId = profileMap.get(key)

    if (profileId) {
      // Upsert profile_payments — idempotent sur (profile_id, form_id)
      // Si le webhook a déjà créé la ligne, ON CONFLICT met simplement à jour
      await client
        .from('profile_payments')
        .upsert(
          {
            profile_id: profileId,
            form_id: item.formId,
            helloasso_order_id: item.orderId || null,
            amount: item.amount,
            paid_at: new Date().toISOString(),
          },
          { onConflict: 'profile_id,form_id' },
        )

      // Maintenir le flag de raccourci pour KPIs / filtres existants
      await client
        .from('profiles')
        .update({ payment_done: true, payment_amount: item.amount })
        .eq('id', profileId)

      matchedCount++
    } else {
      unmatched.push({ firstName: item.firstName, lastName: item.lastName })
    }
  }

  return { matched: matchedCount, unmatched }
})
