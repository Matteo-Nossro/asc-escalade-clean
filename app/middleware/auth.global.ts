export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return

  const user = useSupabaseUser()
  const uid = user.value?.id ?? (user.value as any)?.sub    // ← AJOUTER

  const protectedPrefixes = ['/admin', '/profil', '/mes-inscriptions']
  const needsAuth = protectedPrefixes.some((p) => to.path.startsWith(p))

  if (needsAuth && !uid) {                                   // ← uid
    return navigateTo('/login', { query: { redirect: to.fullPath } })
  }

  if (to.path.startsWith('/admin') && uid) {                 // ← uid
    const supabase = useSupabaseClient()
    const { data, error } = await supabase
      .from('user_roles')
      .select('role_code')
      .eq('user_id', uid)                                    // ← uid
      .in('role_code', ['admin', 'secretary', 'initiateur'])
      .limit(1)

    if (error || !data || data.length === 0) {
      return navigateTo('/')
    }
  }
})