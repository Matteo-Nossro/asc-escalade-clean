import { requireAdmin } from '../../utils/requireAdmin'
import { HelloAssoError, useHelloAsso } from '../../utils/helloasso'

// « Tester la connexion » : 2 étapes, arrêt à la première erreur, réponse 200 dans tous les cas.
//  1. publicData    : GET /organizations/<slug>/formTypes        (privilège AccessPublicData)
//  2. transactions  : GET /organizations/<slug>/items?pageSize=1 (privilège AccessTransactions)
// Jamais de secret, de jeton ni de donnée d'item dans la réponse : seul le statut de l'étape 2 compte.

type Step = 'config' | 'publicData' | 'transactions'

const TRANSACTIONS_FORBIDDEN_MESSAGE
  = 'Accès aux transactions refusé : privilège AccessTransactions manquant. '
    + 'Pour corriger, vérifiez les droits du client API dans le back-office HelloAsso.'

export default defineEventHandler(async (event) => {
  await requireAdmin(event, { requiredRole: 'admin' })

  let client: ReturnType<typeof useHelloAsso>
  try {
    client = useHelloAsso(event)
  }
  catch (err) {
    return failure('config', err)
  }

  const { environment, orgSlug } = client.config
  const base = `/organizations/${encodeURIComponent(orgSlug)}`
  const checks: { publicData?: 'ok', transactions?: 'ok' } = {}

  let formTypes: unknown
  try {
    formTypes = await client.get(`${base}/formTypes`)
    checks.publicData = 'ok'
  }
  catch (err) {
    return failure('publicData', err, { environment, orgSlug, checks })
  }

  try {
    await client.get(`${base}/items`, { pageSize: 1 })
    checks.transactions = 'ok'
  }
  catch (err) {
    return failure('transactions', err, { environment, orgSlug, checks })
  }

  return {
    ok: true,
    environment,
    orgSlug,
    // Les types de formulaires ne sont renvoyés que s'il s'agit d'une liste de textes.
    ...(Array.isArray(formTypes) && formTypes.every(t => typeof t === 'string') ? { formTypes } : {}),
    checks,
  }
})

function failure(
  step: Step,
  err: unknown,
  extra: { environment?: string, orgSlug?: string, checks?: Record<string, string> } = {},
) {
  // Une erreur qui n'est pas celle du client est inattendue : on la laisse remonter.
  if (!(err instanceof HelloAssoError)) throw err

  const message = step === 'transactions' && err.code === 'forbidden'
    ? TRANSACTIONS_FORBIDDEN_MESSAGE
    : err.message

  return {
    ok: false,
    ...(extra.environment ? { environment: extra.environment } : {}),
    ...(extra.orgSlug ? { orgSlug: extra.orgSlug } : {}),
    step,
    code: err.code,
    message,
    ...(extra.checks ? { checks: extra.checks } : {}),
  }
}
