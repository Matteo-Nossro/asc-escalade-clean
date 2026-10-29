import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAdmin } from '../../utils/requireAdmin'

export default defineEventHandler(async (event) => {
  await requireAdmin(event, { allowedRoles: ['admin', 'secretary'] })
  const client = serverSupabaseServiceRole(event)

  // KPI : adhérents actifs payés / non payés
  const [{ count: paid }, { count: unpaid }] = await Promise.all([
    client
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('payment_done', true)
      .eq('status', 'Actif'),
    client
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .or('payment_done.eq.false,payment_done.is.null')
      .eq('status', 'Actif'),
  ])

  // Stats par groupe : membres confirmés + nombre payés
  const { data: groupMembers, error } = await client
    .from('group_members')
    .select(`
      group_id,
      group:groups!group_id(id, name),
      profile:profiles!user_id(payment_done)
    `)
    .eq('status', 'confirmed')

  if (error) {
    console.error('[helloasso-stats] group_members error:', error)
  }

  const groupMap = new Map<string, { groupId: string; groupName: string; paid: number; total: number }>()
  for (const gm of groupMembers ?? []) {
    const gid = gm.group_id as string
    const groupName = (gm.group as any)?.name ?? ''
    if (!groupMap.has(gid)) {
      groupMap.set(gid, { groupId: gid, groupName, paid: 0, total: 0 })
    }
    const stat = groupMap.get(gid)!
    stat.total++
    if ((gm.profile as any)?.payment_done === true) stat.paid++
  }

  return {
    paid: paid ?? 0,
    unpaid: unpaid ?? 0,
    groups: Array.from(groupMap.values()),
  }
})
