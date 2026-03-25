// app/middleware/auth.ts
export default defineNuxtRouteMiddleware(async (to) => {
  const user = useSupabaseUser()

  const protectedPrefixes = ['/admin', '/profil', '/mes-inscriptions']
  const needsAuth = protectedPrefixes.some((p) => to.path.startsWith(p))

  if (needsAuth && !user.value) {
    return navigateTo('/login', { query: { redirect: to.fullPath } })
  }
})