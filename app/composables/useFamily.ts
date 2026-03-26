// app/composables/useFamily.ts
import { ref } from 'vue'
import type { ParentAccessLink } from '~/types/auth'

export const useFamily = () => {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()
  const children = ref<ParentAccessLink[]>([])
  const loading = ref(false)

  async function fetchChildren() {
    if (!user.value) return
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('parent_access')
        .select(`
          id, parent_id, child_id, access_type, created_at,
          child:profiles!child_id (id, full_name, avatar_url, birth_date)
        `)
        .eq('parent_id', user.value.id)
      if (error) throw error
      children.value = data as ParentAccessLink[]
    } finally {
      loading.value = false
    }
  }

  async function linkChild(childId: string, accessType: 'read' | 'register' | 'full' = 'register') {
    if (!user.value) throw new Error('Non authentifié')
    const { error } = await supabase
      .from('parent_access')
      .insert({ parent_id: user.value.id, child_id: childId, access_type: accessType })
    if (error) throw error
    await fetchChildren()
  }

  async function updateAccess(linkId: string, accessType: 'read' | 'register' | 'full') {
    const { error } = await supabase
      .from('parent_access')
      .update({ access_type: accessType })
      .eq('id', linkId)
    if (error) throw error
    await fetchChildren()
  }

  async function unlinkChild(linkId: string) {
    const { error } = await supabase.from('parent_access').delete().eq('id', linkId)
    if (error) throw error
    await fetchChildren()
  }

  return { children, loading, fetchChildren, linkChild, updateAccess, unlinkChild }
}