// app/plugins/auth-sync.client.ts
// Suit l'utilisateur Supabase : charge le profil et les rôles quand un id apparaît,
// remet l'état partagé à zéro quand il disparaît. Les composants ne chargent plus rien eux-mêmes.
import { watch } from 'vue'

export default defineNuxtPlugin(() => {
  const user = useSupabaseUser()
  const { ensureProfile, hasFailedFor, resetAuth } = useAuth()

  watch(
    () => user.value?.id ?? (user.value as any)?.sub,
    (id) => {
      if (!id) {
        resetAuth()
        return
      }
      // Lecture déjà échouée pour cet id (middleware : 2 essais) : l'arrivée tardive de l'utilisateur ne relance rien
      if (hasFailedFor(id)) return
      void ensureProfile()
    },
    { immediate: true },
  )
})
