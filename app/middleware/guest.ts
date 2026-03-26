// app/middleware/guest.ts
export default defineNuxtRouteMiddleware(async () => {
  const user = useSupabaseUser()
  if (user.value) {
    return navigateTo('/')
  }
})