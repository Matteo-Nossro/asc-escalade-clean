/**
 * POST /api/register
 * Inscription publique : crée le profil parent + rôle + profils enfants.
 * Le compte auth est créé côté client via supabase.auth.signUp().
 * Cette route utilise le service role pour bypasser les RLS.
 *
 * Sécurité :
 *  - Si une session est présente, le userId du body DOIT correspondre à la
 *    session. Sinon, un attaquant connaissant un UUID auth pourrait écraser
 *    le profil de cet utilisateur.
 *  - Le profil est créé via INSERT (et non UPSERT) : impossible d'écraser
 *    un profil existant. La détection de l'email déjà utilisé est faite
 *    côté client via signUpData.user.identities (anti-énumération Supabase).
 */
import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

interface ChildPayload {
  first_name: string
  last_name: string
  birth_date: string | null
  address: string | null
  postal_code: string | null
  city: string | null
}

interface ParentPayload {
  first_name: string
  last_name: string
  email: string
  birth_date: string | null
  gender: string | null
  phone: string | null
  address: string | null
  postal_code: string | null
  city: string | null
}

export default defineEventHandler(async (event) => {
  const client = serverSupabaseServiceRole(event)

  const body = await readBody(event) as {
    userId: string
    parent: ParentPayload
    children: ChildPayload[]
  }

  const { userId, parent, children = [] } = body

  if (!userId || !parent?.email) {
    throw createError({ statusCode: 400, statusMessage: 'Données manquantes' })
  }

  // Si une session existe, exiger qu'elle corresponde au userId fourni.
  // Empêche un attaquant connaissant un UUID auth d'écraser le profil cible.
  const sessionUser = await serverSupabaseUser(event)
  if (sessionUser && sessionUser.id !== userId) {
    throw createError({ statusCode: 403, statusMessage: 'Identifiant utilisateur incohérent avec la session' })
  }

  // Vérifier que le userId correspond à un compte auth existant
  const { data: authUser, error: authCheckError } = await client.auth.admin.getUserById(userId)
  if (authCheckError || !authUser?.user) {
    throw createError({ statusCode: 400, statusMessage: 'Compte utilisateur introuvable' })
  }

  // Refuser l'écrasement d'un profil déjà initialisé.
  // (Le client gère le cas anti-énumération Supabase via signUpData.user.identities.)
  const { data: existingProfile } = await client
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle()
  if (existingProfile) {
    throw createError({ statusCode: 409, statusMessage: 'Profil déjà initialisé' })
  }

  const fullName = `${parent.first_name ?? ''} ${parent.last_name ?? ''}`.trim()

  // ── 1. Créer le profil parent ─────────────────────────────────────────────
  const { error: profileError } = await client.from('profiles').insert({
    id: userId,
    email: parent.email,
    first_name: parent.first_name || null,
    last_name: parent.last_name || null,
    full_name: fullName || '',
    birth_date: parent.birth_date || null,
    gender: parent.gender || null,
    phone: parent.phone || null,
    address: parent.address || null,
    postal_code: parent.postal_code || null,
    city: parent.city || null,
    status: 'En attente',
  })

  if (profileError) {
    throw createError({ statusCode: 500, statusMessage: profileError.message })
  }

  // ── 2. Assigner le rôle parent (si pas encore présent) ───────────────────
  const { data: existingRole } = await client
    .from('user_roles')
    .select('id')
    .eq('user_id', userId)
    .eq('role_code', 'parent')
    .maybeSingle()

  if (!existingRole) {
    const { error: roleError } = await client.from('user_roles').insert({
      user_id: userId,
      role_code: 'parent',
    })
    if (roleError) {
      throw createError({ statusCode: 500, statusMessage: roleError.message })
    }
  }

  // ── 3. Créer les profils enfants (sans compte auth) ───────────────────────
  // On ne crée les enfants que s'il n'en existe pas déjà pour ce parent,
  // afin d'éviter les doublons en cas de re-soumission du formulaire.
  if (children.length > 0) {
    const { data: existingChild } = await client
      .from('parent_access')
      .select('id')
      .eq('parent_id', userId)
      .limit(1)
      .maybeSingle()

    if (!existingChild) {
      for (const child of children) {
        const childId = crypto.randomUUID()
        const childFullName = `${child.first_name ?? ''} ${child.last_name ?? ''}`.trim()

        const { error: childError } = await client.from('profiles').insert({
          id: childId,
          email: null,
          first_name: child.first_name || null,
          last_name: child.last_name || null,
          full_name: childFullName || '',
          birth_date: child.birth_date || null,
          address: child.address || null,
          postal_code: child.postal_code || null,
          city: child.city || null,
          status: 'En attente',
        })

        if (childError) {
          throw createError({ statusCode: 500, statusMessage: `Erreur profil enfant : ${childError.message}` })
        }

        const { error: accessError } = await client.from('parent_access').insert({
          parent_id: userId,
          child_id: childId,
          access_type: 'full',
        })

        if (accessError) {
          throw createError({ statusCode: 500, statusMessage: `Erreur lien parent-enfant : ${accessError.message}` })
        }
      }
    }
  }

  return { success: true }
})
