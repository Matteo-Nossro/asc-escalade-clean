// app/composables/useAuth.ts
import { computed } from 'vue'
import type { Profile, RoleCode } from '~/types/auth'
import { signupConfirmationRedirect } from '~/utils/authRedirect'

export type AuthStatus = 'idle' | 'loading' | 'ready' | 'error'

interface AuthLoad { uid: string, promise: Promise<void> }

export const useAuth = () => {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()
  const nuxtApp = useNuxtApp() as any

  // L'id peut être dans .id (client) ou .sub (SSR/JWT)
  const getUserId = (): string | undefined => user.value?.id ?? (user.value as any)?.sub

  // État partagé entre tous les appels de useAuth() (un seul profil, une seule lecture en cours)
  const profile = useState<Profile | null>('auth:profile', () => null)
  const roles = useState<RoleCode[]>('auth:roles', () => [])
  const authStatus = useState<AuthStatus>('auth:status', () => 'idle')
  const loadedFor = useState<string | null>('auth:loadedFor', () => null)
  const loading = useState<boolean>('auth:loading', () => false)
  const error = useState<string | null>('auth:error', () => null)

  const isLoggedIn = computed(() => !!user.value)
  // Les rôles sont vidés tant que l'état n'est pas `ready` : rien n'est autorisé par défaut
  const isAdmin = computed(() => (roles.value ?? []).includes('admin'))
  const isSecretary = computed(() => (roles.value ?? []).includes('secretary'))
  const isStaff = computed(() => isAdmin.value || isSecretary.value)
  const isParent = computed(() => (roles.value ?? []).includes('parent'))
  const isProfileComplete = computed(() => !!profile.value?.profile_completed_at)
  const displayName = computed(() =>
    profile.value?.full_name || user.value?.email || ''
  )
  const initials = computed(() => {
    const name = profile.value?.full_name || user.value?.email || '?'
    return name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
  })

  /** Remet l'état partagé à zéro et abandonne toute lecture en cours. */
  function resetAuth() {
    nuxtApp._authLoad = null
    profile.value = null
    roles.value = []
    authStatus.value = 'idle'
    loadedFor.value = null
    loading.value = false
    error.value = null
  }

  /** Lit profil + rôles pour `uid` ; se rattache à la lecture en cours pour le même id. */
  function load(uid: string): Promise<void> {
    const current: AuthLoad | null = nuxtApp._authLoad ?? null
    if (current && current.uid === uid) return current.promise

    if (profile.value && profile.value.id !== uid) profile.value = null
    roles.value = []
    authStatus.value = 'loading'
    loadedFor.value = null
    loading.value = true
    error.value = null

    const entry = { uid } as AuthLoad
    nuxtApp._authLoad = entry
    const isCurrent = () => nuxtApp._authLoad === entry

    entry.promise = (async () => {
      try {
        const [profileRes, rolesRes] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', uid).single(),
          supabase.from('user_roles').select('role_code').eq('user_id', uid),
        ])
        if (profileRes.error) throw profileRes.error
        if (rolesRes.error) throw rolesRes.error
        if (!isCurrent()) return
        profile.value = profileRes.data as Profile
        roles.value = (rolesRes.data ?? []).map((r: any) => r.role_code as RoleCode)
        loadedFor.value = uid
        authStatus.value = 'ready'
      } catch (e: any) {
        if (!isCurrent()) return
        error.value = e?.message ?? 'Erreur de chargement du profil'
        profile.value = null
        roles.value = []
        loadedFor.value = null
        authStatus.value = 'error'
      } finally {
        if (isCurrent()) {
          nuxtApp._authLoad = null
          loading.value = false
        }
      }
    })()
    return entry.promise
  }

  /** Charge le profil si l'état n'est pas déjà `ready` pour l'utilisateur courant. */
  async function ensureProfile(): Promise<void> {
    const uid = getUserId()
    if (!uid) {
      resetAuth()
      return
    }
    if (authStatus.value === 'ready' && loadedFor.value === uid) return
    await load(uid)
  }

  /** Force une relecture (se rattache à la lecture en cours pour le même id). */
  async function fetchProfile(uid: string | undefined = getUserId()): Promise<void> {
    if (!uid) {
      resetAuth()
      return
    }
    await load(uid)
  }

  // Couvre un composant monté seul : le plugin auth-sync fait le suivi global
  if (import.meta.client && authStatus.value === 'idle' && getUserId()) {
    void ensureProfile()
  }

  async function updateProfile(updates: Partial<Profile>) {
    const uid = getUserId()
    if (!uid) throw new Error('Non authentifié')
    loading.value = true
    error.value = null
    const { id, created_at, updated_at, ...safeUpdates } = updates as any
    try {
      const { data, error: updateError } = await supabase
        .from('profiles')
        .update(safeUpdates)
        .eq('id', uid)
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
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (authError) throw authError
      // La session n'est pas encore propagée à useSupabaseUser : on utilise l'id renvoyé
      await fetchProfile(data?.user?.id ?? getUserId())
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
        options: { data: { full_name: fullName }, emailRedirectTo: signupConfirmationRedirect() },
      })
      if (authError) throw authError
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Renvoie l'e-mail de confirmation d'inscription. Ne lève jamais et ne dit pas si le compte existe :
   * 'sent' ne signifie pas qu'un e-mail est parti, seulement que Supabase n'a pas refusé la demande.
   */
  async function resendSignupConfirmation(email: string): Promise<'sent' | 'rate_limited' | 'error'> {
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: { emailRedirectTo: signupConfirmationRedirect() },
      })
      if (!resendError) return 'sent'
      const message = String((resendError as any).message ?? '').toLowerCase()
      const limited = (resendError as any).status === 429
        || ['rate limit', 'too many', 'for security purposes'].some((m) => message.includes(m))
      return limited ? 'rate_limited' : 'error'
    } catch {
      return 'error'
    }
  }

  async function logout() {
    await supabase.auth.signOut()
    resetAuth()
    await navigateTo('/login')
  }

  function hasRole(role: RoleCode): boolean {
    return (roles.value ?? []).includes(role)
  }

  return {
    user, profile, roles, loading, error, authStatus,
    isLoggedIn, isAdmin, isSecretary, isStaff, isParent, isProfileComplete,
    displayName, initials,
    ensureProfile, fetchProfile, resetAuth, updateProfile,
    loginWithEmail, loginWithOAuth, signUp, resendSignupConfirmation, logout, hasRole,
  }
}
