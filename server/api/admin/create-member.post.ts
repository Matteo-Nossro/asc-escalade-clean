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
  const { email, first_name, last_name, phone, mobile, birth_date, status, licence, formule, roles, groupIds } = body

  if (!first_name?.trim() && !last_name?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Le prénom ou le nom est requis' })
  }

  const fullName = `${first_name ?? ''} ${last_name ?? ''}`.trim()
  let userId: string

  if (email?.trim()) {
    // Avec email → créer le compte Auth (invitation sans mot de passe)
    const { data: authData, error: authError } = await client.auth.admin.createUser({
      email: email.trim(),
      email_confirm: true,
      user_metadata: { full_name: fullName },
    })
    if (authError) throw createError({ statusCode: 400, statusMessage: authError.message })
    userId = authData.user.id
  } else {
    // Sans email → profil autonome (UUID indépendant, pas de compte Auth)
    userId = crypto.randomUUID()
  }

  // 2. Upsert le profil
  const { error: profileError } = await client.from('profiles').upsert({
    id: userId,
    email: email?.trim() || null,
    first_name: first_name || null,
    last_name: last_name || null,
    full_name: fullName || null,
    phone: phone || null,
    mobile: mobile || null,
    birth_date: birth_date || null,
    status: status || 'Actif',
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

  // 4. Inscrire aux groupes sélectionnés
  if (groupIds?.length) {
    for (const gid of groupIds as string[]) {
      const { data: existing } = await client
        .from('group_members')
        .select('id')
        .eq('group_id', gid)
        .eq('user_id', userId)
        .maybeSingle()

      if (!existing) {
        await client.from('group_members').insert({
          group_id: gid,
          user_id: userId,
          status: 'confirmed',
        })
      }
    }
  }

  return { id: userId }
})
