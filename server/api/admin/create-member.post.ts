/**
 * POST /api/admin/create-member
 * Crée un compte Supabase Auth + profil + rôles + inscription groupe.
 * Utilise serverSupabaseServiceRole pour bypasser les RLS.
 * Accessible uniquement depuis le dashboard admin (auth vérifiée par le middleware Nuxt).
 */
import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = serverSupabaseServiceRole(event)

  const body = await readBody(event)
  const { email, first_name, last_name, licence, formule, roles, groupId } = body

  if (!email) throw createError({ statusCode: 400, statusMessage: 'Email requis' })

  const fullName = `${first_name ?? ''} ${last_name ?? ''}`.trim()

  // 1. Créer le compte Auth (confirmation email automatique, pas de mot de passe envoyé)
  const { data: authData, error: authError } = await client.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  })
  if (authError) throw createError({ statusCode: 400, statusMessage: authError.message })

  const userId = authData.user.id

  // 2. Upsert le profil
  const { error: profileError } = await client.from('profiles').upsert({
    id: userId,
    email,
    first_name: first_name || null,
    last_name: last_name || null,
    full_name: fullName || null,
    licence_number: licence && licence !== '-' ? parseInt(licence) : null,
    licence_type: formule && formule !== '-' ? formule : null,
  })
  if (profileError) throw createError({ statusCode: 400, statusMessage: profileError.message })

  // 3. Assigner les rôles
  if (roles?.length) {
    const { error: rolesError } = await client
      .from('user_roles')
      .insert(roles.map((r: string) => ({ user_id: userId, role_code: r })))
    if (rolesError) throw createError({ statusCode: 400, statusMessage: rolesError.message })
  }

  // 4. Inscrire au groupe si sélectionné
  if (groupId) {
    const { data: existing } = await client
      .from('group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .maybeSingle()

    if (!existing) {
      await client.from('group_members').insert({
        group_id: groupId,
        user_id: userId,
        status: 'confirmed',
      })
    }
  }

  return { id: userId }
})
