/**
 * POST /api/profile/complete
 * Complétion du profil d'un compte connecté (Google / Microsoft) dont le profil est incomplet.
 *
 * Sécurité : session obligatoire. L'id et l'e-mail viennent TOUJOURS de la session,
 * jamais du corps (un `userId` ou `parent.email` envoyé est ignoré).
 * Rôle `parent` (règle dans completeProfile) : seulement si des enfants sont déclarés.
 */
import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'
import { completeProfile } from '../../utils/completeProfile'
import type { ChildPayload, ParentPayload } from '../../utils/completeProfile'

export default defineEventHandler(async (event) => {
  const sessionUser = await serverSupabaseUser(event)
  const userId: string | undefined = sessionUser ? (sessionUser.id || (sessionUser as any).sub) : undefined
  if (!sessionUser || !userId) {
    throw createError({ statusCode: 401, statusMessage: 'Non authentifié' })
  }

  const body = await readBody(event) as { parent?: ParentPayload, children?: ChildPayload[] } | null
  const { parent, children = [] } = body ?? {}

  await completeProfile(serverSupabaseServiceRole(event), {
    userId,
    email: (sessionUser.email as string | undefined) ?? '',
    parent: parent as ParentPayload,
    children,
  })

  return { success: true }
})
