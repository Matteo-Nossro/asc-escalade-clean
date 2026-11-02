/**
 * POST /api/register
 * Inscription publique : complète le profil parent créé par le trigger `handle_new_user`,
 * crée les profils enfants (rôle parent seulement s'il y en a, voir completeProfile).
 * Le compte auth est créé côté client via supabase.auth.signUp().
 * Cette route utilise le service role pour bypasser les RLS : l'identité est donc vérifiée d'abord.
 *
 * Sécurité (l'e-mail seul ne suffit jamais) :
 *  - Avec une session : son id doit correspondre à `userId`.
 *  - Sans session : `userId` (UUID renvoyé par signUp) ET l'e-mail doivent désigner le même compte,
 *    jamais connecté (`last_sign_in_at` vide) et créé il y a moins d'une heure.
 *  - Dans les deux cas, l'e-mail du compte auth doit égaler `parent.email` (insensible à la casse).
 *  - 409 uniquement si le profil est déjà complété (`profile_completed_at`).
 */
import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'
import { completeProfile, validateProfileInput } from '../utils/completeProfile'
import type { ChildPayload, ParentPayload } from '../utils/completeProfile'

const MAX_ACCOUNT_AGE_MS = 60 * 60 * 1000
// Message unique et neutre : ne révèle pas l'état du compte.
const NEUTRAL_MESSAGE = 'Impossible de finaliser l\'inscription. Si vous avez déjà un compte, connectez-vous ; sinon, recommencez l\'inscription.'

export default defineEventHandler(async (event) => {
  const client = serverSupabaseServiceRole(event)

  const body = await readBody(event) as {
    userId?: string
    parent?: ParentPayload
    children?: ChildPayload[]
  } | null

  const { userId, parent, children = [] } = body ?? {}

  if (!userId || typeof userId !== 'string' || !parent?.email || typeof parent.email !== 'string' || !parent.email.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Données manquantes' })
  }
  validateProfileInput(parent, children)

  // Si une session existe, exiger qu'elle corresponde au userId fourni.
  const sessionUser = await serverSupabaseUser(event)
  const sessionId = sessionUser ? (sessionUser.id || (sessionUser as any).sub) : null
  if (sessionUser && sessionId !== userId) {
    throw createError({ statusCode: 403, statusMessage: NEUTRAL_MESSAGE })
  }

  // Le userId doit désigner un compte auth existant dont l'e-mail est celui du formulaire.
  const { data: authData, error: authCheckError } = await client.auth.admin.getUserById(userId)
  const authUser = authData?.user
  if (authCheckError || !authUser) {
    throw createError({ statusCode: 400, statusMessage: NEUTRAL_MESSAGE })
  }
  const authEmail = (authUser.email ?? '').trim().toLowerCase()
  if (!authEmail || authEmail !== parent.email.trim().toLowerCase()) {
    throw createError({ statusCode: 403, statusMessage: NEUTRAL_MESSAGE })
  }

  // Sans session : seulement un compte tout juste créé et jamais utilisé.
  if (!sessionUser) {
    const createdAt = Date.parse(authUser.created_at)
    const tooOld = Number.isNaN(createdAt) || Date.now() - createdAt > MAX_ACCOUNT_AGE_MS
    if (authUser.last_sign_in_at || tooOld) {
      throw createError({ statusCode: 403, statusMessage: NEUTRAL_MESSAGE })
    }
  }

  await completeProfile(client, {
    userId,
    email: authUser.email as string,
    parent,
    children,
  })

  return { success: true }
})
