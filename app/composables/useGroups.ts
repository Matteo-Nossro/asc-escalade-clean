// app/composables/useGroups.ts
import { ref } from 'vue'
import type { Group, GroupSchedule, GroupMember } from '~/types/auth'

export const useGroups = () => {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()
  const getUserId = () => user.value?.id ?? (user.value as any)?.sub

  const groups = ref<Group[]>([])
  const myEnrollments = ref<GroupMember[]>([])
  const loading = ref(false)

  const DAY_NAMES: Record<number, string> = {
    1: 'Lundi', 2: 'Mardi', 3: 'Mercredi', 4: 'Jeudi',
    5: 'Vendredi', 6: 'Samedi', 7: 'Dimanche',
  }

  function formatDay(day: number): string {
    return DAY_NAMES[day] || `Jour ${day}`
  }

  function formatTime(time: string): string {
    // "20:00:00" → "20h00"
    const [h, m] = time.split(':')
    return `${h}h${m}`
  }

  function formatSchedule(s: GroupSchedule): string {
    return `${formatDay(s.day_of_week)} ${formatTime(s.start_time)} – ${formatTime(s.end_time)}`
  }

  // ─── Charger tous les groupes avec créneaux + comptage membres ────────

  async function fetchGroups() {
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('groups')
        .select(`
          *,
          schedules:group_schedules(*),
          instructors:group_instructors(
            id, group_id, user_id,
            profile:profiles!user_id(id, full_name)
          ),
          referent:profiles!referent_id(id, full_name)
        `)
        .order('name')

      if (error) throw error

      // Compter les membres pour chaque groupe
      const groupList = (data || []) as Group[]

      for (const g of groupList) {
        const { count } = await supabase
          .from('group_members')
          .select('*', { count: 'exact', head: true })
          .eq('group_id', g.id)
          .eq('status', 'confirmed')
        g._members_count = count ?? 0
      }

      groups.value = groupList
    } finally {
      loading.value = false
    }
  }

  // ─── Mes inscriptions aux groupes ─────────────────────────────────────

  async function fetchMyEnrollments(userId?: string) {
    const uid = userId || getUserId()
    if (!uid) return

    loading.value = true
    try {
      const { data, error } = await supabase
        .from('group_members')
        .select(`
          *,
          group:groups!group_id(id, name, level),
          profile:profiles!user_id(id, full_name)
        `)
        .or(`user_id.eq.${uid},enrolled_by.eq.${uid}`)
        .neq('status', 'cancelled')                        
        .order('enrolled_at', { ascending: false })

      if (error) throw error
      myEnrollments.value = (data || []) as GroupMember[]
    } finally {
      loading.value = false
    }
  }

  // ─── S'inscrire à un groupe ───────────────────────────────────────────

  async function enroll(groupId: string, userId?: string) {
    const uid = getUserId()
    if (!uid) throw new Error('Non authentifié')

    const targetUser = userId || uid
    const isForChild = targetUser !== uid

    const { error } = await supabase
      .from('group_members')
      .insert({
        group_id: groupId,
        user_id: targetUser,
        enrolled_by: isForChild ? uid : null,
      })

    if (error) throw error
  }

  // ─── Se désinscrire ───────────────────────────────────────────────────

  async function unenroll(memberId: string) {
    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('id', memberId)

    if (error) throw error
  }

  // ─── Vérifier si inscrit ──────────────────────────────────────────────

  async function isEnrolled(groupId: string, userId?: string): Promise<string | null> {
    const uid = userId || getUserId()
    if (!uid) return null

    const { data } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', uid)
      .maybeSingle()

    return data?.id || null
  }

  // ─── Admin : créer / modifier / supprimer un groupe ───────────────────

  async function createGroup(group: Partial<Group>, schedules: Omit<GroupSchedule, 'id' | 'group_id'>[]) {
    const { data, error } = await supabase
      .from('groups')
      .insert({
        name: group.name,
        max_members: group.max_members || 20,
        min_birth_date: group.min_birth_date || null,
        max_birth_date: group.max_birth_date || null,
        level: group.level || null,
        referent_id: group.referent_id || null,
        description: group.description || null,
      })
      .select()
      .single()

    if (error) throw error

    // Créer les créneaux
    if (schedules.length > 0) {
      const { error: schedError } = await supabase
        .from('group_schedules')
        .insert(schedules.map(s => ({ ...s, group_id: data.id })))

      if (schedError) throw schedError
    }

    return data
  }

  async function updateGroup(groupId: string, updates: Partial<Group>) {
    const { id, created_at, updated_at, schedules, instructors, referent, _members_count, ...safe } = updates as any
    const { error } = await supabase
      .from('groups')
      .update(safe)
      .eq('id', groupId)

    if (error) throw error
  }

  async function deleteGroup(groupId: string) {
    const { error } = await supabase
      .from('groups')
      .delete()
      .eq('id', groupId)

    if (error) throw error
  }

  // ─── Admin : gérer les créneaux ───────────────────────────────────────

  async function replaceSchedules(groupId: string, schedules: Omit<GroupSchedule, 'id' | 'group_id'>[]) {
    // Supprimer les anciens
    await supabase.from('group_schedules').delete().eq('group_id', groupId)

    // Insérer les nouveaux
    if (schedules.length > 0) {
      const { error } = await supabase
        .from('group_schedules')
        .insert(schedules.map(s => ({ ...s, group_id: groupId })))

      if (error) throw error
    }
  }

  // ─── Admin : gérer les initiateurs ────────────────────────────────────

  async function setInstructors(groupId: string, userIds: string[]) {
    await supabase.from('group_instructors').delete().eq('group_id', groupId)

    if (userIds.length > 0) {
      const { error } = await supabase
        .from('group_instructors')
        .insert(userIds.map(uid => ({ group_id: groupId, user_id: uid })))

      if (error) throw error
    }
  }

  // ─── Admin : membres d'un groupe ──────────────────────────────────────

  async function fetchGroupMembers(groupId: string): Promise<GroupMember[]> {
    const { data, error } = await supabase
      .from('group_members')
      .select('*, profile:profiles!user_id(id, full_name)')
      .eq('group_id', groupId)
      .order('enrolled_at')

    if (error) throw error
    return (data || []) as GroupMember[]
  }

  return {
    groups, myEnrollments, loading,
    DAY_NAMES, formatDay, formatTime, formatSchedule,
    fetchGroups, fetchMyEnrollments,
    enroll, unenroll, isEnrolled,
    createGroup, updateGroup, deleteGroup,
    replaceSchedules, setInstructors, fetchGroupMembers,
  }
}