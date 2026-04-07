/**
 * POST /api/create-helloasso-payment
 * Body : { registrationId, amount, name, email, eventTitle }
 * Retourne { checkoutUrl } via l'API HelloAsso (OAuth2 client_credentials).
 */
interface HelloAssoPayload {
  registrationId: string
  amount: number
  name: string
  email: string
  eventTitle: string
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const body = await readBody<HelloAssoPayload>(event)
  const { registrationId, amount, name, email, eventTitle } = body

  if (!registrationId || !amount || !name || !email || !eventTitle) {
    throw createError({ statusCode: 400, statusMessage: 'Paramètres manquants' })
  }

  const baseUrl = process.env.NODE_ENV === 'development'
    ? 'https://api.helloasso-sandbox.com'
    : 'https://api.helloasso.com'

  // --- OAuth2 : obtention du token ---
  const tokenRes = await $fetch<{ access_token: string }>(`${baseUrl}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: config.helloassoClientId,
      client_secret: config.helloassoClientSecret,
    }).toString(),
  }).catch((err) => {
    console.error('[helloasso] Erreur token:', err)
    throw createError({ statusCode: 502, statusMessage: 'Erreur authentification HelloAsso' })
  })

  const token = tokenRes.access_token

  // --- Split du nom (prénom / nom) ---
  const nameParts = name.trim().split(' ')
  const firstName = nameParts[0] ?? name
  const lastName = nameParts.slice(1).join(' ') || firstName

  const amountInCents = Math.round(amount * 100)
  const siteUrl = config.public.siteUrl

  // --- Création du checkout intent ---
  const checkoutRes = await $fetch<{ redirectUrl: string }>(
    `${baseUrl}/v5/organizations/${config.helloassoOrgSlug}/checkout-intents`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: {
        totalAmount: amountInCents,
        initialAmount: amountInCents,
        itemName: `Inscription — ${eventTitle}`,
        backUrl: `${siteUrl}/inscription/annulee`,
        errorUrl: `${siteUrl}/inscription/erreur`,
        returnUrl: `${siteUrl}/inscription/confirmee?reg=${registrationId}`,
        containsDonation: false,
        payer: {
          firstName,
          lastName,
          email,
        },
        metadata: { registrationId },
      },
    }
  ).catch((err) => {
    console.error('[helloasso] Erreur checkout:', err)
    throw createError({ statusCode: 502, statusMessage: 'Erreur création paiement HelloAsso' })
  })

  return { checkoutUrl: checkoutRes.redirectUrl }
})
