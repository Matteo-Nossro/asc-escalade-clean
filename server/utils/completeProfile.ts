// Complétion du profil d'un adhérent (inscription par e-mail et comptes OAuth).
//
// Le trigger SQL `handle_new_user` a déjà créé la ligne `profiles` (statut « En attente »,
// `profile_completed_at` vide) et `on_profile_enrich` a pu la remplir (import FFME). On COMPLÈTE donc cette
// ligne avec les seules valeurs non vides saisies, sans jamais toucher au `status`.
//
// Appelé avec le client service role : l'identité (userId, email) doit avoir été vérifiée par l'appelant.
// Atomicité : `profile_completed_at` est « réservé » par une mise à jour conditionnelle (`… is null`,
// 0 ligne ⇒ 409) qui écrit aussi les champs saisis : deux envois simultanés ne donnent qu'un succès.
// En cas d'échec ensuite (rôle, enfants), la réservation est libérée et les enfants déjà créés sont supprimés :
// jamais de profil marqué complété avec des données partielles, et la reprise reste possible.
// Règle du rôle `parent` (unique, ici) : attribué si et seulement si des enfants sont déclarés.
import type { SupabaseClient } from '@supabase/supabase-js'

export interface ChildPayload {
  first_name: string
  last_name: string
  birth_date: string | null
  address?: string | null
  postal_code?: string | null
  city?: string | null
}

export interface ParentPayload {
  first_name: string
  last_name: string
  email?: string
  birth_date: string | null
  gender: string | null
  phone?: string | null
  address?: string | null
  postal_code?: string | null
  city?: string | null
}

export interface CompleteProfileInput {
  userId: string
  email: string
  parent: ParentPayload
  children: ChildPayload[]
}

const filled = (v: unknown): v is string => typeof v === 'string' && v.trim() !== ''
const clean = (v: unknown): string | null => (filled(v) ? v.trim() : null)

/** Champs obligatoires (côté serveur comme côté client). Lève une 400, sans aucune écriture. */
export function validateProfileInput(parent: Partial<ParentPayload> | null | undefined, children: unknown) {
  if (!parent || typeof parent !== 'object') {
    throw createError({ statusCode: 400, statusMessage: 'Données manquantes' })
  }
  for (const field of ['first_name', 'last_name', 'birth_date', 'gender'] as const) {
    if (!filled(parent[field])) {
      throw createError({ statusCode: 400, statusMessage: `Champ obligatoire manquant : ${field}` })
    }
  }
  if (!Array.isArray(children)) {
    throw createError({ statusCode: 400, statusMessage: 'Liste d\'enfants invalide' })
  }
  for (const child of children as Partial<ChildPayload>[]) {
    for (const field of ['first_name', 'last_name', 'birth_date'] as const) {
      if (!child || !filled(child[field])) {
        throw createError({ statusCode: 400, statusMessage: `Champ obligatoire manquant pour un enfant : ${field}` })
      }
    }
  }
}

export async function completeProfile(client: SupabaseClient, input: CompleteProfileInput) {
  const { userId, email, parent, children } = input
  validateProfileInput(parent, children)

  const fail = (message: string) => createError({ statusCode: 500, statusMessage: message })
  const alreadyCompleted = () => createError({ statusCode: 409, statusMessage: 'Cette adresse email est déjà inscrite.' })

  // ── 0. Ligne existante ? Déjà complétée ⇒ 409, avant toute écriture ───────
  const { data: existing, error: readError } = await client
    .from('profiles')
    .select('id, profile_completed_at')
    .eq('id', userId)
    .maybeSingle()
  if (readError) throw fail(readError.message)
  if (existing?.profile_completed_at) throw alreadyCompleted()

  // ── 1. Champs du parent : seulement les valeurs non vides ─────────────────
  const firstName = clean(parent.first_name)
  const lastName = clean(parent.last_name)
  const values: Record<string, string | null> = {
    email: clean(email),
    first_name: firstName,
    last_name: lastName,
    full_name: `${firstName ?? ''} ${lastName ?? ''}`.trim() || null,
    birth_date: clean(parent.birth_date),
    gender: clean(parent.gender),
    phone: clean(parent.phone),
    address: clean(parent.address),
    postal_code: clean(parent.postal_code),
    city: clean(parent.city),
  }
  const payload = Object.fromEntries(Object.entries(values).filter(([, v]) => v !== null))

  if (!existing) {
    const { error } = await client.from('profiles').insert({ id: userId, email: values.email, status: 'En attente' })
    if (error) throw error.code === '23505' ? alreadyCompleted() : fail(error.message)
  }

  // ── 2. Réservation atomique : seule la première requête passe ─────────────
  const { data: reserved, error: reserveError } = await client
    .from('profiles')
    .update({ ...payload, profile_completed_at: new Date().toISOString() })
    .eq('id', userId)
    .is('profile_completed_at', null)
    .select('id')
  if (reserveError) throw fail(reserveError.message)
  if (!reserved?.length) throw alreadyCompleted()

  const createdChildIds: string[] = []
  try {
    if (children.length > 0) {
      // ── 3. Enfants (sans compte auth) — pas de doublon à la re-soumission ─
      const { data: existingChild } = await client
        .from('parent_access')
        .select('id')
        .eq('parent_id', userId)
        .limit(1)
        .maybeSingle()

      if (!existingChild) {
        const now = new Date().toISOString()
        for (const child of children) {
          const childId = crypto.randomUUID()
          const childFirst = clean(child.first_name)
          const childLast = clean(child.last_name)

          const { error: childError } = await client.from('profiles').insert({
            id: childId,
            email: null,
            first_name: childFirst,
            last_name: childLast,
            full_name: `${childFirst ?? ''} ${childLast ?? ''}`.trim(),
            birth_date: clean(child.birth_date),
            address: clean(child.address),
            postal_code: clean(child.postal_code),
            city: clean(child.city),
            status: 'En attente',
            profile_completed_at: now,
          })
          if (childError) throw fail(`Erreur profil enfant : ${childError.message}`)
          createdChildIds.push(childId)

          const { error: accessError } = await client.from('parent_access').insert({
            parent_id: userId,
            child_id: childId,
            access_type: 'full',
          })
          if (accessError) throw fail(`Erreur lien parent-enfant : ${accessError.message}`)
        }
      }

      // ── 4. Rôle parent : en dernier, jamais accordé si les enfants échouent ─
      const { data: existingRole } = await client
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .eq('role_code', 'parent')
        .maybeSingle()
      if (!existingRole) {
        const { error } = await client.from('user_roles').insert({ user_id: userId, role_code: 'parent' })
        if (error) throw fail(error.message)
      }
    }
  }
  catch (error) {
    // Compensation (au mieux) : aucun enfant orphelin, réservation libérée pour permettre la reprise.
    // Chaque étape en échec est journalisée sans interrompre la suite ni changer l'erreur levée.
    if (createdChildIds.length > 0) {
      const { error: e1 } = await client.from('parent_access').delete().in('child_id', createdChildIds)
      if (e1) console.error('[completeProfile] compensation suppression des liens parent_access', e1)
      const { error: e2 } = await client.from('profiles').delete().in('id', createdChildIds)
      if (e2) console.error('[completeProfile] compensation suppression des profils enfants', e2)
    }
    const { error: e3 } = await client.from('profiles').update({ profile_completed_at: null }).eq('id', userId)
    if (e3) console.error('[completeProfile] compensation libération de profile_completed_at', e3)
    throw error
  }
}
