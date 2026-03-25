// app/composables/useAuth.ts
import { ref, computed } from 'vue'
import type { Profile, RoleCode, UserRole } from '~/types/auth'

export const useAuth = () => {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  const profile = ref<Profile | null>(null)
  const roles = ref<RoleCode[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isLoggedIn = computed(() => !!user.value)
  const isAdmin = computed(() => roles.value.includes('admin'))
  const isSecretary = computed(() => roles.value.includes('secretary'))
  const isStaff = computed(() => isAdmin.value || isSecretary.value)
  const isParent = computed(() => roles.value.includes('parent'))
  const displayName = computed(() =>
    profile.value?.full_name || user.value?.email || ''
  )
  const initials = computed(() => {
    const name = profile.value?.full_name || user.value?.email || '?'
    return name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
  })

  async function fetchProfile() {
    if (!user.value) {
      profile.value = null
      roles.value = []
      return
    }
    loading.value = true
    error.value = null
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.value.id)
        .single()
      if (profileError) throw profileError
      profile.value = profileData as Profile

      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('role_code')
        .eq('user_id', user.value.id)
      if (rolesError) throw rolesError
      roles.value = (rolesData as UserRole[]).map((r) => r.role_code)
    } catch (e: any) {
      error.value = e.message
      profile.value = null
      roles.value = []
    } finally {
      loading.value = false
    }
  }

  async function updateProfile(updates: Partial<Profile>) {
    if (!user.value) throw new Error('Non authentifié')
    loading.value = true
    error.value = null
    const { id, created_at, updated_at, ...safeUpdates } = updates as any
    try {
      const { data, error: updateError } = await supabase
        .from('profiles')
        .update(safeUpdates)
        .eq('id', user.value.id)
        .select()
        .single()
      if (updateError) throw updateError
      profile.value = data as Profile
      return data
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function loginWithEmail(email: string, password: string) {
    loading.value = true
    error.value = null
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (authError) throw authError
      await fetchProfile()
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function loginWithOAuth(provider: 'google' | 'azure') {
    loading.value = true
    error.value = null
    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/callback`,
        },
      })
      if (authError) throw authError
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function signUp(email: string, password: string, fullName: string) {
    loading.value = true
    error.value = null
    try {
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      })
      if (authError) throw authError
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    await supabase.auth.signOut()
    profile.value = null
    roles.value = []
    await navigateTo('/login')
  }

  function hasRole(role: RoleCode): boolean {
    return roles.value.includes(role)
  }

  return {
    user, profile, roles, loading, error,
    isLoggedIn, isAdmin, isSecretary, isStaff, isParent,
    displayName, initials,
    fetchProfile, updateProfile,
    loginWithEmail, loginWithOAuth, signUp, logout, hasRole,
  }
}