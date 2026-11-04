// Lecture seule du DEV : noms attendus des référents et moniteurs de groupes
// (feature securite-bdd). Clé service role uniquement pour LIRE ; aucune écriture.
import { adminClient } from './dev-db'

export interface ExpectedDirectory {
  referents: string[]
  instructors: string[]
}

/** Noms (profiles.full_name) des référents (groups.referent_id) et moniteurs (group_instructors.user_id). */
export async function expectedDirectoryNames(): Promise<ExpectedDirectory> {
  const admin = adminClient()

  const { data: groups, error: gErr } = await admin.from('groups').select('referent_id')
  if (gErr) throw new Error(`lecture groups : ${gErr.message}`)
  const { data: links, error: iErr } = await admin.from('group_instructors').select('user_id')
  if (iErr) throw new Error(`lecture group_instructors : ${iErr.message}`)

  const referentIds = [...new Set((groups ?? []).map(g => g.referent_id as string | null).filter(Boolean) as string[])]
  const instructorIds = [...new Set((links ?? []).map(l => l.user_id as string | null).filter(Boolean) as string[])]
  const allIds = [...new Set([...referentIds, ...instructorIds])]
  if (!allIds.length) return { referents: [], instructors: [] }

  const { data: profiles, error: pErr } = await admin.from('profiles').select('id, full_name').in('id', allIds)
  if (pErr) throw new Error(`lecture profiles : ${pErr.message}`)
  const nameOf = new Map((profiles ?? []).map(p => [p.id as string, (p.full_name as string | null)?.trim() || '']))

  const names = (ids: string[]) => [...new Set(ids.map(id => nameOf.get(id) ?? '').filter(Boolean))]
  return { referents: names(referentIds), instructors: names(instructorIds) }
}
