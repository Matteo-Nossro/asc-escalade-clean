/**
 * Client Supabase avec service_role pour les tests E2E.
 * Bypass complet des RLS → seed et cleanup sans restrictions.
 * NE JAMAIS utiliser ce client côté application ou CI public.
 */
import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!url || !serviceKey) {
  throw new Error(
    'SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY doivent être définis dans .env.test'
  )
}

export const adminSupabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ─── Types internes aux fixtures ─────────────────────────────────────────────

export interface SeedProfile {
  id: string
  email: string
  full_name: string
  first_name?: string
  last_name?: string
  licence_number?: number
  licence_type?: string
}

export interface SeedGroup {
  id: string
  name: string
  max_members: number
}

// ─── Helpers seed ─────────────────────────────────────────────────────────────

/**
 * Crée un utilisateur Supabase Auth + un profil associé.
 * Email au format e2e-[feature]-[scenario]@test.asc-escalade.fr
 */
export async function seedUser(params: {
  email: string
  password?: string
  fullName: string
  firstName?: string
  lastName?: string
  roles?: Array<'admin' | 'secretary' | 'parent'>
  licenceNumber?: number
  licenceType?: string
}): Promise<SeedProfile> {
  const password = params.password ?? 'TestE2E2026!'

  // Créer le compte Auth
  const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
    email: params.email,
    password,
    email_confirm: true,
    user_metadata: { full_name: params.fullName },
  })
  if (authError) throw new Error(`seedUser auth: ${authError.message}`)

  const userId = authData.user.id

  // Upsert le profil
  const { error: profileError } = await adminSupabase.from('profiles').upsert({
    id: userId,
    email: params.email,
    full_name: params.fullName,
    first_name: params.firstName ?? params.fullName.split(' ')[0] ?? null,
    last_name: params.lastName ?? params.fullName.split(' ').slice(1).join(' ') ?? null,
    licence_number: params.licenceNumber ?? null,
    licence_type: params.licenceType ?? null,
  })
  if (profileError) throw new Error(`seedUser profile: ${profileError.message}`)

  // Assigner les rôles
  if (params.roles?.length) {
    const { error: roleError } = await adminSupabase.from('user_roles').insert(
      params.roles.map(role => ({ user_id: userId, role_code: role }))
    )
    if (roleError) throw new Error(`seedUser roles: ${roleError.message}`)
  }

  return {
    id: userId,
    email: params.email,
    full_name: params.fullName,
    first_name: params.firstName,
    last_name: params.lastName,
    licence_number: params.licenceNumber,
    licence_type: params.licenceType,
  }
}

/**
 * Crée un groupe avec ses créneaux optionnels.
 */
export async function seedGroup(params: {
  name: string
  maxMembers?: number
  level?: string
  schedules?: Array<{ day_of_week: number; start_time: string; end_time: string }>
}): Promise<SeedGroup> {
  const { data, error } = await adminSupabase
    .from('groups')
    .insert({
      name: params.name,
      max_members: params.maxMembers ?? 20,
      level: params.level ?? null,
    })
    .select()
    .single()
  if (error) throw new Error(`seedGroup: ${error.message}`)

  if (params.schedules?.length) {
    const { error: schedError } = await adminSupabase
      .from('group_schedules')
      .insert(params.schedules.map(s => ({ ...s, group_id: data.id })))
    if (schedError) throw new Error(`seedGroup schedules: ${schedError.message}`)
  }

  return { id: data.id, name: data.name, max_members: data.max_members }
}

/**
 * Crée une inscription en attente (pending) pour un user dans un groupe.
 */
export async function seedPendingEnrollment(params: {
  groupId: string
  userId: string
  enrolledBy?: string
}): Promise<string> {
  const { data, error } = await adminSupabase
    .from('group_members')
    .insert({
      group_id: params.groupId,
      user_id: params.userId,
      enrolled_by: params.enrolledBy ?? null,
      status: 'pending',
    })
    .select('id')
    .single()
  if (error) throw new Error(`seedPendingEnrollment: ${error.message}`)
  return data.id
}

// ─── Helpers cleanup ──────────────────────────────────────────────────────────

/**
 * Supprime tous les utilisateurs de test (email contenant @test.asc-escalade.fr).
 * Cascade automatique sur profiles, user_roles, group_members via FK.
 */
export async function cleanupTestUsers() {
  const { data: users } = await adminSupabase.auth.admin.listUsers()
  const testUsers = (users?.users ?? []).filter(u =>
    u.email?.endsWith('@test.asc-escalade.fr')
  )
  for (const u of testUsers) {
    await adminSupabase.auth.admin.deleteUser(u.id)
  }
}

/**
 * Supprime les groupes de test (nom commençant par [E2E]).
 */
export async function cleanupTestGroups() {
  await adminSupabase.from('groups').delete().like('name', '[E2E]%')
}

/**
 * Supprime un utilisateur de test par email.
 */
export async function cleanupUser(email: string) {
  const { data: users } = await adminSupabase.auth.admin.listUsers()
  const user = users?.users.find(u => u.email === email)
  if (user) await adminSupabase.auth.admin.deleteUser(user.id)
}

/**
 * Supprime un groupe de test par id.
 */
export async function cleanupGroup(groupId: string) {
  await adminSupabase.from('groups').delete().eq('id', groupId)
}
