// app/plugins/auth-sync.client.ts
// Suit l'utilisateur Supabase : charge le profil et les rôles quand un id apparaît,
// remet l'état partagé à zéro quand il disparaît. Les composants ne chargent plus rien eux-mêmes.
import { watch } from 'vue'

export default defineNuxtPlugin(() => {
  const user = useSupabaseUser()
  const { ensureProfile, resetAuth } = useAuth()

  watch(
    () => user.value?.id ?? (user.value as any)?.sub,
    (id) => {
      if (!id) {
        resetAuth()
        return
      }
      void ensureProfile()
    },
    { immediate: true },
  )
})
