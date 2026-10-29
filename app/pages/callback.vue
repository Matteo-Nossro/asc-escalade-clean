<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">

    <!-- R2-c : lien d'e-mail invalide, expiré ou déjà utilisé -->
    <div v-if="view === 'link-error'" class="w-full max-w-md">
      <div class="text-center mb-6">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-[#7FD857] rounded-2xl mb-4 shadow-lg">
          <UIcon name="i-lucide-mail-warning" class="w-8 h-8 text-[#0F1729]" />
        </div>
      </div>

      <div class="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 border border-gray-100">
        <div data-testid="callback-link-error" role="alert" class="text-center">
          <h1 class="text-xl font-bold text-[#0F1729] mb-3">Ce lien n'est plus valide</h1>
          <p class="text-sm text-gray-600">
            Il a peut-être déjà servi (votre adresse est alors confirmée), il a expiré,
            ou un e-mail plus récent l'a remplacé.
          </p>
        </div>

        <UButton
          to="/login"
          size="xl"
          block
          class="mt-6 bg-[#7FD857] hover:bg-[#6bc546] text-[#0F1729] font-bold"
          data-testid="btn-callback-login"
        >
          Se connecter
        </UButton>

        <!-- Pas de renvoi pour un lien de réinitialisation : « Mot de passe oublié » est sur /login -->
        <form v-if="!isRecovery" class="mt-8 pt-6 border-t border-gray-100 space-y-4" novalidate @submit.prevent="handleResend">
          <p class="text-sm text-gray-600">
            Vous n'avez pas encore confirmé votre adresse ? Recevez un nouvel e-mail de confirmation.
          </p>

          <UFormField label="Adresse email" :error="resendFieldError">
            <UInput
              v-model="resendEmail"
              type="email"
              inputmode="email"
              autocomplete="email"
              placeholder="votre.email@exemple.com"
              icon="i-lucide-mail"
              size="lg"
              :disabled="resendLoading"
              class="w-full"
              data-testid="input-resend-email"
              :ui="{ root: 'w-full', base: 'w-full' }"
            />
          </UFormField>

          <UButton
            type="button"
            size="lg"
            block
            variant="outline"
            color="neutral"
            :loading="resendLoading"
            :disabled="resendLoading"
            data-testid="btn-resend-confirmation"
            @click="handleResend"
          >
            Renvoyer l'e-mail de confirmation
          </UButton>

          <p
            v-if="resendStatus === 'sent'"
            role="status"
            class="text-sm text-[#0F1729] bg-[#7FD857]/15 rounded-xl p-3"
            data-testid="msg-resend-sent"
          >
            Si une inscription non confirmée existe pour cette adresse, un nouvel e-mail vient d'être envoyé.
            Si votre adresse est déjà confirmée, connectez-vous.
          </p>
          <p
            v-else-if="resendStatus === 'rate_limited' || resendStatus === 'error'"
            role="alert"
            class="text-sm text-red-700 bg-red-50 rounded-xl p-3"
            data-testid="msg-resend-error"
          >
            {{ resendStatus === 'rate_limited'
              ? 'Trop de demandes pour le moment : patientez quelques instants avant de réessayer.'
              : "L'e-mail n'a pas pu être envoyé. Réessayez dans quelques instants." }}
          </p>
        </form>
      </div>
    </div>

    <!-- R2b-3 : échec autre qu'un lien expiré (refus OAuth, erreur serveur…) -->
    <div v-else-if="view === 'auth-error'" class="w-full max-w-md">
      <div class="text-center mb-6">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-[#7FD857] rounded-2xl mb-4 shadow-lg">
          <UIcon name="i-lucide-circle-alert" class="w-8 h-8 text-[#0F1729]" />
        </div>
      </div>

      <div class="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 border border-gray-100">
        <div data-testid="callback-auth-error" role="alert" class="text-center">
          <h1 class="text-xl font-bold text-[#0F1729] mb-3">La connexion n'a pas abouti</h1>
          <p class="text-sm text-gray-600">
            Un problème est survenu pendant la connexion. Réessayez depuis la page de connexion.
          </p>
        </div>

        <UButton
          to="/login"
          size="xl"
          block
          class="mt-6 bg-[#7FD857] hover:bg-[#6bc546] text-[#0F1729] font-bold"
          data-testid="btn-callback-login"
        >
          Se connecter
        </UButton>
      </div>
    </div>

    <!-- R2-d : adresse confirmée, mais pas de session ouverte -->
    <div v-else-if="view === 'confirmed'" class="w-full max-w-md">
      <div class="text-center mb-6">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-[#7FD857] rounded-2xl mb-4 shadow-lg">
          <UIcon name="i-lucide-mail-check" class="w-8 h-8 text-[#0F1729]" />
        </div>
      </div>

      <div class="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 border border-gray-100">
        <div data-testid="callback-email-confirmed" class="text-center">
          <h1 class="text-xl font-bold text-[#0F1729] mb-3">Adresse e-mail confirmée</h1>
          <p class="text-sm text-gray-600">
            Merci ! Connectez-vous avec votre adresse et votre mot de passe.
            Votre inscription reste en attente de validation par le bureau.
          </p>
        </div>

        <UButton
          to="/login"
          size="xl"
          block
          class="mt-6 bg-[#7FD857] hover:bg-[#6bc546] text-[#0F1729] font-bold"
          data-testid="btn-callback-login"
        >
          Se connecter
        </UButton>
      </div>
    </div>

    <!-- Attente / redirection -->
    <div v-else class="text-center">
      <div class="inline-flex items-center justify-center w-16 h-16 bg-[#7FD857] rounded-2xl mb-4 shadow-lg animate-pulse">
        <UIcon name="i-lucide-mountain" class="w-8 h-8 text-[#0F1729]" />
      </div>
      <p class="text-gray-600 mt-4">Connexion en cours…</p>
    </div>

  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

definePageMeta({ layout: false })

const { ensureProfile, authStatus, isProfileComplete, hasRole, resendSignupConfirmation } = useAuth()
const route = useRoute()

type View = 'loading' | 'link-error' | 'auth-error' | 'confirmed'
const view = ref<View>('loading')
const isRecovery = ref(false)

// Renvoi de l'e-mail de confirmation
const resendEmail = ref('')
const resendLoading = ref(false)
const resendFieldError = ref('')
const resendStatus = ref<'' | 'sent' | 'rate_limited' | 'error'>('')

const first = (v: unknown): string => String((Array.isArray(v) ? v[0] : v) ?? '')

/** Paramètres du lien : query, complétés par le hash (#error=…&error_code=…). */
function readLinkParams() {
  const hash = (route.hash || (import.meta.client ? window.location.hash : '') || '').replace(/^#/, '')
  const fromHash = new URLSearchParams(hash)
  const pick = (key: string) => first(route.query[key]) || fromHash.get(key) || ''
  return { error: pick('error'), errorCode: pick('error_code'), type: pick('type') }
}

async function handleResend() {
  resendStatus.value = ''
  resendFieldError.value = ''
  const email = resendEmail.value.trim()
  if (!email) {
    resendFieldError.value = "L'adresse email est requise"
    return
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    resendFieldError.value = "Format d'email invalide"
    return
  }
  resendLoading.value = true
  try {
    resendStatus.value = await resendSignupConfirmation(email)
  } finally {
    resendLoading.value = false
  }
}

/** Délai maximal d'attente de la session (ms). */
const SESSION_WAIT_MS = 3000

let disposed = false
let settled = false
let stopWatch: (() => void) | null = null
let timer: ReturnType<typeof setTimeout> | null = null

function cleanup() {
  stopWatch?.()
  stopWatch = null
  if (timer) clearTimeout(timer)
  timer = null
}

onBeforeUnmount(() => {
  disposed = true
  cleanup()
})

async function redirectConnected(type: string) {
  await ensureProfile()
  if (disposed) return
  if (type === 'recovery') {
    await navigateTo('/profil?resetPassword=true')
  } else if (authStatus.value === 'ready' && !isProfileComplete.value) {
    await navigateTo('/completer-profil')
  } else if (['admin', 'secretary', 'initiateur'].some((r) => hasRole(r as any))) {
    await navigateTo('/admin/dashboard')
  } else {
    await navigateTo('/profil')
  }
}

onMounted(async () => {
  const { error, errorCode, type } = readLinkParams()
  const code = first(route.query.code)

  // Lien invalide : on l'explique tout de suite, sans rediriger (même si une session est ouverte)
  if (error || errorCode) {
    isRecovery.value = type === 'recovery'
    view.value = errorCode === 'otp_expired' ? 'link-error' : 'auth-error'
    return
  }

  const user = useSupabaseUser()

  // R2c-2 : retour PKCE. getSession laisse le client finir son échange automatique ;
  // sans session, un seul échange manuel. Son échec n'est jamais affiché.
  if (code && !user.value) {
    try {
      const supabase = useSupabaseClient()
      const { data } = await supabase.auth.getSession()
      if (!data?.session && !user.value) await supabase.auth.exchangeCodeForSession(code)
    } catch {
      // volontairement ignoré : l'attente de session ci-dessous tranche
    }
    if (disposed) return
  }

  if (user.value) {
    settled = true
    await redirectConnected(type)
    return
  }

  // Pas encore de session : on l'attend (au plus SESSION_WAIT_MS), sans attente fixe
  stopWatch = watch(user, (value) => {
    if (!value || settled || disposed) return
    settled = true
    cleanup()
    void redirectConnected(type)
  })
  timer = setTimeout(async () => {
    timer = null
    if (settled || disposed) return
    settled = true
    cleanup()
    if (type === 'signup') {
      view.value = 'confirmed'
    } else {
      await navigateTo('/login')
    }
  }, SESSION_WAIT_MS)
})
</script>
