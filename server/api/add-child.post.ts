/**
 * POST /api/add-child
 * Ajoute un profil enfant (sans compte Auth) et le lie au parent connecté.
 * Utilise le service role pour bypasser les RLS.
 */
import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = serverSupabaseServiceRole(event)
  const user = await serverSupabaseUser(event)

  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Non authentifié' })
  }

  const body = await readBody(event) as {
    first_name: string
    last_name: string
    birth_date: string | null
    gender: string | null
    address: string | null
    postal_code: string | null
    city: string | null
  }

  if (!body.first_name?.trim() || !body.last_name?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Le prénom et le nom sont requis' })
  }

  const childId = crypto.randomUUID()
  const fullName = `${body.first_name.trim()} ${body.last_name.trim()}`.trim()

  const { error: profileError } = await client.from('profiles').insert({
    id: childId,
    email: null,
    first_name: body.first_name.trim(),
    last_name: body.last_name.trim(),
    full_name: fullName,
    birth_date: body.birth_date || null,
    gender: body.gender || null,
    address: body.address || null,
    postal_code: body.postal_code || null,
    city: body.city || null,
    status: 'En attente',
  })

  if (profileError) {
    throw createError({ statusCode: 500, statusMessage: profileError.message })
  }

  const { error: accessError } = await client.from('parent_access').insert({
    parent_id: user.id,
    child_id: childId,
    access_type: 'full',
  })

  if (accessError) {
    throw createError({ statusCode: 500, statusMessage: accessError.message })
  }

  // S'assurer que le rôle "parent" est bien assigné
  const { data: existingRole } = await client
    .from('user_roles')
    .select('id')
    .eq('user_id', user.id)
    .eq('role_code', 'parent')
    .maybeSingle()

  if (!existingRole) {
    await client.from('user_roles').insert({ user_id: user.id, role_code: 'parent' })
  }

  return { success: true, childId }
})
