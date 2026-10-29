/**
 * POST /api/admin/create-member
 * Crée un compte Supabase Auth + profil + rôles + inscription groupe.
 * Utilise serverSupabaseServiceRole pour bypasser les RLS.
 * Garde d'accès : requireAdmin() — refuse les appels non admin/secretary/initiateur.
 * L'octroi du rôle "admin" exige en plus que l'appelant soit lui-même admin.
 */
import { serverSupabaseServiceRole } from '#supabase/server'
import {requireAdmin} from '../../utils/requireAdmin'

const ASSIGNABLE_ROLES = ['parent', 'initiateur', 'secretary', 'admin'] as const

export default defineEventHandler(async (event) => {
  const { roles: callerRoles } = await requireAdmin(event)

  const client = serverSupabaseServiceRole(event)

  const body = await readBody(event)
  const { email, first_name, last_name, phone, mobile, birth_date, gender, status, licence, formule, roles, groupIds } = body

  if (Array.isArray(roles) && roles.length) {
    const invalid = roles.find((r: string) => !ASSIGNABLE_ROLES.includes(r as typeof ASSIGNABLE_ROLES[number]))
    if (invalid) {
      throw createError({ statusCode: 400, statusMessage: `Rôle invalide : ${invalid}` })
    }
    if (roles.includes('admin') && !callerRoles.includes('admin')) {
      throw createError({ statusCode: 403, statusMessage: 'Seul un admin peut octroyer le rôle admin' })
    }
  }

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

  // 2. Upsert le profil : seules les valeurs non vides sont écrites, pour ne pas écraser
  //    la ligne créée par handle_new_user / on_profile_enrich (téléphone, licence FFME…).
  //    Le statut (« Actif » par défaut) et profile_completed_at sont toujours posés.
  // Un profil déjà complété garde sa date d'origine.
  const { data: existingProfile } = await client
    .from('profiles')
    .select('profile_completed_at')
    .eq('id', userId)
    .maybeSingle<{ profile_completed_at: string | null }>()
  const payload: Record<string, unknown> = {
    id: userId,
    status: status || 'Actif',
    profile_completed_at: existingProfile?.profile_completed_at || new Date().toISOString(),
  }
  const optional: Record<string, unknown> = {
    email: email?.trim(),
    first_name,
    last_name,
    full_name: fullName,
    phone,
    mobile,
    birth_date,
    gender,
    licence_type: formule && formule !== '-' ? formule : null,
  }
  for (const [key, value] of Object.entries(optional)) {
    if (value !== null && value !== undefined && value !== '') payload[key] = value
  }
  if (licence && licence !== '-') {
    const licenceNumber = parseInt(licence)
    if (!Number.isNaN(licenceNumber)) payload.licence_number = licenceNumber
  }
  const { error: profileError } = await client.from('profiles').upsert(payload)
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
