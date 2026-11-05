<template>
  <div
    v-if="blocked"
    class="mx-auto flex min-h-[50vh] max-w-xl items-center px-4 py-16"
    data-testid="auth-profile-error"
    role="alert"
  >
    <div class="w-full space-y-6">
      <UAlert
        color="error"
        variant="subtle"
        icon="i-lucide-triangle-alert"
        title="Impossible de charger votre profil"
        description="Nous n'avons pas pu récupérer les informations de votre compte. Vérifiez votre connexion internet, puis réessayez. Si le problème continue, déconnectez-vous et reconnectez-vous."
      />
      <p v-if="logoutFailed" class="text-sm text-red-700" role="status">
        La déconnexion n'a pas abouti : votre session est toujours ouverte. Vérifiez votre connexion internet, puis réessayez.
      </p>
      <div class="flex flex-wrap items-center gap-4">
        <UButton
          class="bg-vp-green text-vp-dark hover:bg-vp-green-hover"
          icon="i-lucide-refresh-cw"
          :loading="reading"
          :disabled="reading"
          @click="retry"
        >
          Réessayer
        </UButton>
        <UButton
          variant="link"
          color="neutral"
          class="text-vp-dark"
          data-testid="auth-profile-logout"
          :disabled="leaving"
          @click="leave"
        >
          Se déconnecter
        </UButton>
      </div>
    </div>
  </div>
  <slot v-else />
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useAuth } from '~/composables/useAuth'
import { authRedirectFor, isAuthPage, MANAGEMENT_ROLES } from '~/utils/authPages'

// Porte des pages connectées : sur une page protégée, si la lecture du profil a échoué (après le réessai
// unique du middleware), la page n'est pas rendue et un message avec « Réessayer » prend sa place.
// Aucune redirection sur échec : l'URL ne change pas. Rendu dès le premier passage, sans attendre onMounted
// (les pages protégées sont en ssr: false ; l'état est `idle` au rendu serveur des pages publiques).
const route = useRoute()
const { isLoggedIn, authStatus, isProfileComplete, hasRole, fetchProfile, logout } = useAuth()

// Verrou : une fois en erreur, la porte reste fermée pendant toute relecture (`loading`, quel que soit
// l'appelant : bouton, ensureProfile, auth-sync) jusqu'à `ready` ou jusqu'à la disparition de l'utilisateur.
// Initialisé dès le setup : si le statut est déjà `error`, la page n'est jamais montée, même une fois.
const failed = ref(authStatus.value === 'error')

// État local : indépendant de celui de useAuth
const retrying = ref(false)
const leaving = ref(false)
const logoutFailed = ref(false)

watch(authStatus, (status) => {
  if (status === 'error') failed.value = true
  // Pendant un « Réessayer », le verrou tombe à la fin de retry(), après la décision de redirection
  else if (status === 'ready' && !retrying.value) failed.value = false
}, { flush: 'sync' })
watch(isLoggedIn, (loggedIn) => { if (!loggedIn) failed.value = false }, { flush: 'sync' })

const blocked = computed(() =>
  isLoggedIn.value
  && isAuthPage(route.path)
  && (authStatus.value === 'error' || (failed.value && authStatus.value !== 'ready'))
)

// Bouton inactif tant qu'une lecture est en cours, quel qu'en soit l'initiateur
const reading = computed(() => retrying.value || authStatus.value === 'loading')

async function retry() {
  if (reading.value) return
  retrying.value = true
  try {
    await fetchProfile()
    // Une seule redirection possible, jamais vers /login ; aucune sur un nouvel échec
    const redirect = authRedirectFor(route.path, {
      status: authStatus.value,
      isProfileComplete: isProfileComplete.value,
      canManage: MANAGEMENT_ROLES.some((r) => hasRole(r)),
    })
    if (redirect) await navigateTo(redirect)
  } finally {
    retrying.value = false
    if (authStatus.value === 'ready') failed.value = false
  }
}

async function leave() {
  if (leaving.value) return
  leaving.value = true
  logoutFailed.value = false
  try {
    // logout() ferme la session (au moins localement) puis va sur /login ; il ne lève que si la session reste ouverte
    await logout()
  } catch {
    logoutFailed.value = true
  } finally {
    leaving.value = false
  }
}
</script>
