// Aides e2e pour le projet Supabase de DEV uniquement (feature auth-profils).
// La clé service role ne sert qu'à confirmer puis supprimer un compte jetable.
// Elle n'est jamais affichée ni écrite ailleurs. Variables lues dans l'environnement,
// sinon dans `.env` (une variable déjà définie n'est pas écrasée).
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'

export const DEV_REF = 'ybtnnogxukfldurozqwa'

let envLoaded = false
export function loadTestEnv() {
  if (envLoaded) return
  envLoaded = true
  try {
    process.loadEnvFile('.env')
  }
  catch {
    // pas de .env : on se contente de l'environnement
  }
}

/** Compte de test existant (`TEST_USERS_EMAIL` avec suffixe `+admin`, `+adherent`…). `null` si les variables manquent. */
export function testAccount(suffix: string): { email: string, password: string } | null {
  loadTestEnv()
  const base = process.env.TEST_USERS_EMAIL
  const password = process.env.TEST_USERS_PASSWORD
  if (!base || !password || !base.includes('@')) return null
  const [local, domain] = base.split('@')
  return { email: `${local}+${suffix}@${domain}`, password }
}

/** Adresse jetable `local+e2e-<horodatage>@domaine`. Jamais `@example.com`. */
export function disposableEmail(): string | null {
  loadTestEnv()
  const base = process.env.TEST_USERS_EMAIL
  if (!base || !base.includes('@')) return null
  const [local, domain] = base.split('@')
  if (domain.toLowerCase() === 'example.com') return null
  return `${local}+e2e-${Date.now()}@${domain}`
}

/** Refuse tout projet autre que le DEV (URL, et clé JWT si c'en est une). */
export function assertDevProject() {
  loadTestEnv()
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
  if (!url || !key) throw new Error('SUPABASE_URL ou la clé service role est absente : parcours impossible')
  let hostname = ''
  try {
    hostname = new URL(url).hostname
  }
  catch {
    throw new Error('SUPABASE_URL invalide')
  }
  if (hostname !== `${DEV_REF}.supabase.co`) {
    throw new Error(`SUPABASE_URL ne désigne pas le projet de DEV (${DEV_REF}) : refus`)
  }
  const segments = key.split('.')
  if (segments.length === 3) {
    const payload = JSON.parse(Buffer.from(segments[1], 'base64url').toString('utf8'))
    if (payload.ref !== DEV_REF || payload.role !== 'service_role') {
      throw new Error('La clé service role ne correspond pas au projet de DEV : refus')
    }
  }
  return { url, key }
}

export function adminClient(): SupabaseClient {
  const { url, key } = assertDevProject()
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

export async function findAuthUserByEmail(admin: SupabaseClient, email: string): Promise<User | null> {
  const wanted = email.toLowerCase()
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw new Error(`listUsers : ${error.message}`)
    const found = data.users.find(u => u.email?.toLowerCase() === wanted)
    if (found) return found
    if (data.users.length < 200) return null
  }
  return null
}

/** Confirme l'adresse du compte (API admin, DEV uniquement). */
export async function confirmAccount(admin: SupabaseClient, userId: string) {
  const { error } = await admin.auth.admin.updateUserById(userId, { email_confirm: true })
  if (error) throw new Error(`confirmation du compte : ${error.message}`)
}

/**
 * Supprime un compte jetable : rôles, liens parent_access, profils enfants, profil, compte auth.
 * Sans effet si le compte n'existe pas. Lève une erreur s'il reste quelque chose.
 */
export async function deleteAccountByEmail(email: string) {
  if (!/\+e2e-\d+@/.test(email)) throw new Error('Suppression refusée : ce n\'est pas une adresse jetable +e2e-<horodatage>')
  const admin = adminClient()
  const problems: string[] = []

  const authUser = await findAuthUserByEmail(admin, email)
  const { data: profileRows } = await admin.from('profiles').select('id').ilike('email', email)
  const parentIds = new Set<string>([...(profileRows ?? []).map(r => r.id as string), ...(authUser ? [authUser.id] : [])])

  for (const parentId of parentIds) {
    const { data: links } = await admin.from('parent_access').select('child_id').eq('parent_id', parentId)
    const childIds = (links ?? []).map(l => l.child_id as string)
    const allIds = [parentId, ...childIds]

    for (const [table, col] of [
      ['registrations', 'user_id'],
      ['group_members', 'user_id'],
      ['group_instructors', 'user_id'],
      ['user_roles', 'user_id'],
    ] as const) {
      const { error } = await admin.from(table).delete().in(col, allIds)
      if (error && table === 'user_roles') problems.push(`${table} : ${error.message}`)
    }
    const { error: linkErr } = await admin.from('parent_access').delete().eq('parent_id', parentId)
    if (linkErr) problems.push(`parent_access : ${linkErr.message}`)
    if (childIds.length) {
      const { error } = await admin.from('profiles').delete().in('id', childIds)
      if (error) problems.push(`profils enfants : ${error.message}`)
    }
    const { error: profErr } = await admin.from('profiles').delete().eq('id', parentId)
    if (profErr) problems.push(`profil : ${profErr.message}`)
  }

  if (authUser) {
    const { error } = await admin.auth.admin.deleteUser(authUser.id)
    if (error) problems.push(`compte auth : ${error.message}`)
  }

  // Contrôle final : plus rien ne doit subsister.
  const stillThere = await findAuthUserByEmail(admin, email)
  if (stillThere) problems.push('le compte auth existe encore')
  const { data: leftovers } = await admin.from('profiles').select('id').ilike('email', email)
  if (leftovers?.length) problems.push('le profil existe encore')

  if (problems.length) throw new Error(`Nettoyage incomplet du compte jetable : ${problems.join(' ; ')}`)
  return { hadAuthUser: !!authUser }
}
