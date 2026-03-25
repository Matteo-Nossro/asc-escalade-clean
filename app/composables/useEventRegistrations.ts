// app/composables/useEventRegistrations.ts
import { ref } from 'vue'
import type { Registration } from '~/types/auth'

export const useEventRegistrations = () => {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()
  const registrations = ref<Registration[]>([])
  const loading = ref(false)

  async function fetchByEvent(eventId: string) {
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('registrations')
        .select('*, profile:profiles!user_id(full_name)')
        .eq('event_id', eventId)
        .neq('status', 'cancelled')
        .order('registered_at', { ascending: true })
      if (error) throw error
      registrations.value = data as Registration[]
    } finally {
      loading.value = false
    }
  }

  async function countByEvent(eventId: string): Promise<number> {
    const { count, error } = await supabase
      .from('registrations')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .neq('status', 'cancelled')
    if (error) return 0
    return count ?? 0
  }

  async function register(params: { eventId: string; userId?: string; notes?: string }) {
    if (!user.value) throw new Error('Non authentifié')
    const targetUserId = params.userId || user.value.id
    const isForChild = targetUserId !== user.value.id
    const { error } = await supabase
      .from('registrations')
      .insert({
        user_id: targetUserId,
        event_id: params.eventId,
        registered_by: isForChild ? user.value.id : null,
        notes: params.notes || null,
        status: 'pending',
      })
    if (error) throw error
    await fetchByEvent(params.eventId)
  }

  async function cancel(registrationId: string, eventId: string) {
    const { error } = await supabase
      .from('registrations')
      .update({ status: 'cancelled' })
      .eq('id', registrationId)
    if (error) throw error
    await fetchByEvent(eventId)
  }

  async function confirm(registrationId: string, eventId: string) {
    const { error } = await supabase
      .from('registrations')
      .update({ status: 'confirmed' })
      .eq('id', registrationId)
    if (error) throw error
    await fetchByEvent(eventId)
  }

  async function isRegistered(eventId: string, userId?: string): Promise<boolean> {
    if (!user.value) return false
    const { data } = await supabase
      .from('registrations')
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', userId || user.value.id)
      .neq('status', 'cancelled')
      .maybeSingle()
    return !!data
  }

  async function fetchMine() {
    if (!user.value) return
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('registrations')
        .select('*, event:events!event_id(title, starts_at, slug)')
        .or(`user_id.eq.${user.value.id},registered_by.eq.${user.value.id}`)
        .neq('status', 'cancelled')
        .order('registered_at', { ascending: false })
      if (error) throw error
      registrations.value = data as Registration[]
    } finally {
      loading.value = false
    }
  }

  return {
    registrations, loading,
    fetchByEvent, countByEvent, register, cancel, confirm,
    isRegistered, fetchMine,
  }
}