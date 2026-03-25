// app/middleware/admin.ts
export default defineNuxtRouteMiddleware(async (to) => {
  const user = useSupabaseUser()

  if (!user.value) {
    return navigateTo('/login', { query: { redirect: to.fullPath } })
  }

  const supabase = useSupabaseClient()
  const { data } = await supabase
    .from('user_roles')
    .select('role_code')
    .eq('user_id', user.value.id)
    .in('role_code', ['admin', 'secretary'])
    .limit(1)

  if (!data || data.length === 0) {
    return navigateTo('/')
  }
})