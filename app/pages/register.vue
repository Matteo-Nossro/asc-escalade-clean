<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 py-12 page-content">
    <div class="w-full max-w-xl mx-auto">

      <!-- ── En-tête ── -->
      <div class="text-center mb-8">
        <NuxtLink
          to="/"
          class="inline-flex items-center justify-center w-16 h-16 bg-vp-green rounded-2xl mb-4 shadow-lg transition-transform hover:scale-105"
        >
          <UIcon name="i-lucide-mountain" class="w-8 h-8 text-vp-dark" />
        </NuxtLink>
        <h1 class="text-3xl font-bold text-gray-900 mb-2">ASC Escalade</h1>
        <p class="text-gray-600">Créer votre compte</p>
      </div>

      <!-- ══════════════════════════════════════════════════════
           ÉTAPE 1 — Choix du type
      ══════════════════════════════════════════════════════ -->
      <div v-if="currentStep === 1" class="space-y-4">
        <div class="text-center mb-6">
          <h2 class="text-xl font-bold text-gray-900">Qui souhaitez-vous inscrire ?</h2>
          <p class="text-sm text-gray-500 mt-1">Sélectionnez votre situation</p>
        </div>

        <button
          type="button"
          class="w-full bg-white rounded-3xl shadow-xl border-2 p-6 text-left transition-all hover:shadow-2xl"
          :class="typeChoice === 'adult' ? 'border-vp-green' : 'border-transparent hover:border-vp-green'"
          data-testid="btn-type-adult"
          @click="typeChoice = 'adult'"
        >
          <div class="flex items-start gap-4">
            <div class="w-12 h-12 rounded-2xl bg-vp-green/10 flex items-center justify-center shrink-0">
              <UIcon name="i-lucide-user" class="w-6 h-6 text-vp-green" />
            </div>
            <div class="flex-1">
              <p class="font-bold text-gray-900 text-lg">Je suis majeur et je souhaite m'inscrire</p>
              <p class="text-sm text-gray-500 mt-1">Créer mon compte personnel.</p>
            </div>
            <UIcon v-if="typeChoice === 'adult'" name="i-lucide-check-circle-2" class="w-5 h-5 text-vp-green shrink-0 mt-1" />
          </div>
        </button>

        <button
          type="button"
          class="w-full bg-white rounded-3xl shadow-xl border-2 p-6 text-left transition-all hover:shadow-2xl"
          :class="typeChoice === 'minor' ? 'border-amber-400' : 'border-transparent hover:border-amber-400'"
          data-testid="btn-type-minor"
          @click="typeChoice = 'minor'"
        >
          <div class="flex items-start gap-4">
            <div class="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center shrink-0">
              <UIcon name="i-lucide-users" class="w-6 h-6 text-amber-500" />
            </div>
            <div class="flex-1">
              <p class="font-bold text-gray-900 text-lg">Je souhaite inscrire mon enfant (mineur)</p>
              <p class="text-sm text-gray-500 mt-1">Un mineur ne peut pas s'inscrire seul.</p>
            </div>
            <UIcon v-if="typeChoice === 'minor'" name="i-lucide-check-circle-2" class="w-5 h-5 text-amber-500 shrink-0 mt-1" />
          </div>
        </button>

        <UAlert
          v-if="typeChoice === 'minor'"
          color="warning"
          variant="soft"
          icon="i-lucide-info"
          title="Inscription d'un mineur"
          description="Vous devez d'abord créer votre compte parent. Une fois connecté, vous pourrez ajouter vos enfants directement depuis votre profil."
        />

        <UButton
          block
          size="xl"
          :disabled="!typeChoice"
          class="bg-vp-green hover:bg-vp-green-hover text-vp-dark font-bold shadow-lg hover:shadow-xl transition-all"
          data-testid="btn-register-continue"
          @click="currentStep = 2"
        >
          Continuer
          <template #trailing>
            <UIcon name="i-lucide-arrow-right" class="w-5 h-5" />
          </template>
        </UButton>

        <p class="text-center text-sm text-gray-500">
          Déjà un compte ?
          <NuxtLink to="/login" class="text-vp-green hover:text-vp-green-hover font-bold ml-1">Se connecter</NuxtLink>
        </p>
      </div>

      <!-- ══════════════════════════════════════════════════════
           ÉTAPE 2 — Formulaire d'inscription
      ══════════════════════════════════════════════════════ -->
      <form v-if="currentStep === 2" class="space-y-6" @submit.prevent="handleSubmit">

        <UAlert
          v-if="stepError"
          color="error"
          variant="soft"
          :title="stepError"
          icon="i-lucide-alert-circle"
          :close-button="{ icon: 'i-lucide-x', color: 'error', variant: 'ghost' }"
          @close="stepError = ''"
        />

        <p v-if="stepError && children.length" class="-mt-3 text-xs text-gray-500">
          Les {{ children.length }} enfant{{ children.length > 1 ? 's' : '' }} déjà ajouté{{ children.length > 1 ? 's' : '' }}
          sont conservé{{ children.length > 1 ? 's' : '' }} — corrigez le champ signalé puis continuez.
        </p>

        <!-- Identité + Adresse (champs partagés avec /completer-profil) ; Connexion s'intercale entre les deux -->
        <AuthProfileFieldsForm v-model="form" :errors="errors">
          <template #after-identity>
            <!-- Connexion -->
            <div class="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
              <h3 class="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <UIcon name="i-lucide-lock" class="w-5 h-5 text-vp-green" />
                Connexion
              </h3>
              <div class="space-y-5">
                <UFormField label="Adresse email" required :error="errors.email">
                  <UInput
                    v-model="form.email"
                    data-testid="input-register-email"
                    type="email"
                    placeholder="votre@email.com"
                    icon="i-lucide-mail"
                    size="lg"
                    class="w-full"
                  />
                </UFormField>

                <UFormField label="Mot de passe" required :error="errors.password">
                  <UInput
                    v-model="form.password"
                    data-testid="input-register-password"
                    :type="showPassword ? 'text' : 'password'"
                    placeholder="••••••••"
                    icon="i-lucide-lock"
                    size="lg"
                    class="w-full"
                  >
                    <template #trailing>
                      <UButton
                        :icon="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                        color="neutral"
                        variant="ghost"
                        size="sm"
                        type="button"
                        @click="showPassword = !showPassword"
                      />
                    </template>
                  </UInput>
                </UFormField>

                <ul class="space-y-1">
                  <li
                    v-for="check in passwordChecks"
                    :key="check.label"
                    class="flex items-center gap-2 text-xs transition-colors"
                    :class="check.ok ? 'text-vp-green-check' : 'text-gray-400'"
                  >
                    <UIcon
                      :name="check.ok ? 'i-lucide-check-circle-2' : 'i-lucide-circle'"
                      class="w-3.5 h-3.5 shrink-0"
                    />
                    {{ check.label }}
                  </li>
                </ul>

                <UFormField label="Confirmer le mot de passe" required :error="errors.passwordConfirm">
                  <UInput
                    v-model="form.passwordConfirm"
                    data-testid="input-register-password-confirm"
                    :type="showPasswordConfirm ? 'text' : 'password'"
                    placeholder="••••••••"
                    icon="i-lucide-lock"
                    size="lg"
                    class="w-full"
                  >
                    <template #trailing>
                      <UButton
                        :icon="showPasswordConfirm ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                        color="neutral"
                        variant="ghost"
                        size="sm"
                        type="button"
                        @click="showPasswordConfirm = !showPasswordConfirm"
                      />
                    </template>
                  </UInput>
                </UFormField>
              </div>
            </div>
          </template>
        </AuthProfileFieldsForm>


        <!-- Navigation -->
        <div class="flex gap-3">
          <UButton variant="soft" size="xl" :disabled="submitting" type="button" @click="currentStep = 1">
            <template #leading>
              <UIcon name="i-lucide-arrow-left" class="w-5 h-5" />
            </template>
            Retour
          </UButton>
          <UButton
            type="submit"
            data-testid="btn-register-submit"
            block
            size="xl"
            :loading="submitting"
            :disabled="submitting"
            class="bg-vp-green hover:bg-vp-green-hover text-vp-dark font-bold shadow-lg hover:shadow-xl transition-all"
          >
            <template v-if="!submitting" #leading>
              <UIcon :name="typeChoice === 'minor' ? 'i-lucide-arrow-right' : 'i-lucide-check'" class="w-5 h-5" />
            </template>
            {{ submitting ? 'Inscription en cours…' : typeChoice === 'minor' ? 'Continuer' : "M'inscrire" }}
          </UButton>
        </div>
      </form>

      <!-- ══════════════════════════════════════════════════════
           ÉTAPE 3 — Enfants (parcours mineur uniquement)
      ══════════════════════════════════════════════════════ -->
      <div v-if="currentStep === 3" class="space-y-6">

        <UAlert
          v-if="stepError"
          color="error"
          variant="soft"
          :title="stepError"
          icon="i-lucide-alert-circle"
          :close-button="{ icon: 'i-lucide-x', color: 'error', variant: 'ghost' }"
          @close="stepError = ''"
        />

        <!-- Introduction -->
        <div class="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100 text-center">
          <div class="w-14 h-14 rounded-2xl bg-vp-green/10 flex items-center justify-center mx-auto mb-4">
            <UIcon name="i-lucide-users" class="w-7 h-7 text-vp-green" />
          </div>
          <h3 class="text-lg font-bold text-gray-900 mb-2">Inscrire un enfant</h3>
          <p class="text-sm text-gray-500">
            Ajoutez un ou plusieurs enfants. Vous pourrez également en ajouter d'autres plus tard depuis votre profil.
          </p>
        </div>

        <!-- Enfants (liste + formulaire d'ajout, partagés avec /completer-profil) -->
        <AuthChildrenForm
          ref="childrenForm"
          v-model="children"
          v-model:draft="childDraft"
          v-model:draftErrors="childDraftErrors"
          :parent-address="{ address: form.address, postal_code: form.postal_code, city: form.city }"
        />


        <!-- Navigation + soumission -->
        <div class="flex gap-3">
          <UButton variant="soft" size="xl" :disabled="submitting" type="button" @click="currentStep = 2">
            <template #leading>
              <UIcon name="i-lucide-arrow-left" class="w-5 h-5" />
            </template>
            Retour
          </UButton>
          <UButton
            block
            size="xl"
            :loading="submitting"
            :disabled="submitting"
            class="bg-vp-green hover:bg-vp-green-hover text-vp-dark font-bold shadow-lg hover:shadow-xl transition-all"
            data-testid="btn-register-finish"
            @click="submitRegistration"
          >
            <template #leading>
              <UIcon name="i-lucide-check" class="w-5 h-5" />
            </template>
            {{ submitting ? 'Inscription en cours…' : "Terminer l'inscription" }}
          </UButton>
        </div>
      </div>

      <!-- ══════════════════════════════════════════════════════
           ÉTAPE 4 — Succès
      ══════════════════════════════════════════════════════ -->
      <div v-if="currentStep === 4" class="text-center">
        <div class="bg-white rounded-3xl shadow-2xl p-10 border border-gray-100">
          <div class="w-20 h-20 rounded-full bg-vp-green/10 flex items-center justify-center mx-auto mb-6">
            <UIcon name="i-lucide-check-circle-2" class="w-10 h-10 text-vp-green" />
          </div>
          <h2 class="text-2xl font-bold text-gray-900 mb-3">Inscription envoyée !</h2>
          <p class="text-sm text-gray-500 mb-8">
            Vous pouvez maintenant accéder à votre profil pour gérer vos informations et vous inscrire aux activités proposées par l'ASC Escalade.
          </p>
          <div class="flex flex-col gap-3">
            <UButton
              block
              size="xl"
              to="/login?redirect=/profil"
              class="bg-vp-green hover:bg-vp-green-hover text-vp-dark font-bold shadow-lg"
            >
              <template #leading>
                <UIcon name="i-lucide-user-circle" class="w-5 h-5" />
              </template>
              Accéder à mon profil
            </UButton>
            <UButton
              block
              size="xl"
              variant="outline"
              to="/login?redirect=/mes-inscriptions"
              class="border-vp-green text-vp-green hover:bg-vp-green/10 font-bold"
            >
              <template #leading>
                <UIcon name="i-lucide-calendar-check" class="w-5 h-5" />
              </template>
              Gérer mes inscriptions
            </UButton>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { signupConfirmationRedirect } from '~/utils/authRedirect'
import {
  emptyParentFields,
  emptyParentErrors,
  emptyChild,
  emptyChildErrors,
  validateParent,
  hasErrors,
  buildParentPayload,
  buildChildrenPayload,
} from '~/utils/profileForm'
import type { ChildData } from '~/utils/profileForm'

definePageMeta({
  layout: false,
  middleware: 'guest',
  ssr: false,
})

const supabase = useSupabaseClient()

// ── État global ───────────────────────────────────────────────────────────────
const currentStep = ref(1)
const typeChoice = ref<'adult' | 'minor' | null>(null)
const showPassword = ref(false)
const showPasswordConfirm = ref(false)
const stepError = ref('')
const submitting = ref(false)

// ── Formulaire (champs du profil partagés + identifiants de connexion) ───────
const form = ref({
  ...emptyParentFields(),
  email: '',
  password: '',
  passwordConfirm: '',
})

const errors = ref({
  ...emptyParentErrors(),
  email: '',
  password: '',
  passwordConfirm: '',
})

// ── Enfants (étape 3) ─────────────────────────────────────────────────────────
const children = ref<ChildData[]>([])
const childDraft = ref<ChildData>(emptyChild())
const childDraftErrors = ref(emptyChildErrors())
const childrenForm = ref<{ flushPending: () => { ok: boolean, error?: string } } | null>(null)

// ── Exigences de mot de passe ─────────────────────────────────────────────────
// Alignées sur la politique Supabase (min/maj, chiffre, caractère spécial).
// Vérifiées en direct pour éviter un rejet au moment de la création du compte
// (parcours mineur : après avoir déjà saisi les enfants à l'étape 3).
const passwordChecks = computed(() => {
  const p = form.value.password
  return [
    { label: 'Au moins 8 caractères', ok: p.length >= 8 },
    { label: 'Une lettre minuscule', ok: /[a-z]/.test(p) },
    { label: 'Une lettre majuscule', ok: /[A-Z]/.test(p) },
    { label: 'Un chiffre', ok: /\d/.test(p) },
    { label: 'Un caractère spécial (! ? @ # …)', ok: /[^A-Za-z0-9]/.test(p) },
  ]
})
const passwordValid = computed(() => passwordChecks.value.every(c => c.ok))

// ── Validation ────────────────────────────────────────────────────────────────
function validate(): boolean {
  const e = { ...validateParent(form.value), email: '', password: '', passwordConfirm: '' }

  if (!form.value.email.trim()) {
    e.email = "L'email est requis"
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) {
    e.email = "Format d'email invalide"
  }

  if (!form.value.password) {
    e.password = 'Le mot de passe est requis'
  } else if (!passwordValid.value) {
    e.password = 'Le mot de passe ne respecte pas toutes les exigences indiquées'
  }

  if (!form.value.passwordConfirm) {
    e.passwordConfirm = 'Veuillez confirmer le mot de passe'
  } else if (form.value.password !== form.value.passwordConfirm) {
    e.passwordConfirm = 'Les mots de passe ne correspondent pas'
  }

  errors.value = e
  return !hasErrors(e)
}

// ── Soumission ────────────────────────────────────────────────────────────────

// Étape 2 → valide le formulaire parent, puis :
//   adulte  → soumet directement (sans enfants)
//   mineur  → passe à l'étape 3 (ajout enfants)
async function handleSubmit() {
  if (!validate()) return
  stepError.value = ''
  if (typeChoice.value === 'minor') {
    currentStep.value = 3
    return
  }
  await submitWithChildren([])
}

// Étape 3 → auto-ajoute l'enfant en cours de saisie si complet, puis soumet
async function submitRegistration() {
  stepError.value = ''
  const pending = childrenForm.value?.flushPending() ?? { ok: true }
  if (!pending.ok) {
    stepError.value = pending.error ?? ''
    return
  }
  await submitWithChildren(children.value)
}

async function submitWithChildren(childrenToRegister: ChildData[]) {
  submitting.value = true
  try {
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: form.value.email,
      password: form.value.password,
      options: {
        data: { full_name: `${form.value.first_name} ${form.value.last_name}`.trim() },
        emailRedirectTo: signupConfirmationRedirect(),
      },
    })

    if (signUpError) {
      currentStep.value = 2
      stepError.value = translateAuthError(signUpError.message)
      return
    }

    const userId = signUpData?.user?.id
    if (!userId) {
      currentStep.value = 2
      stepError.value = "Impossible de récupérer l'identifiant utilisateur."
      return
    }

    const identities = signUpData.user?.identities
    if (!identities || identities.length === 0) {
      currentStep.value = 2
      stepError.value = 'Cette adresse email est déjà utilisée. Essayez de vous connecter.'
      return
    }

    // Sécurité : /api/register exige l'UUID renvoyé par signUp ET l'e-mail du même compte
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        parent: {
          ...buildParentPayload(form.value),
          email: form.value.email,
        },
        children: buildChildrenPayload(childrenToRegister),
      }),
    })

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      const msg: string = errData?.statusMessage || errData?.message || `Erreur ${res.status}`
      currentStep.value = 2
      stepError.value = res.status === 409 || msg.toLowerCase().includes('déjà')
        ? 'Cette adresse email est déjà utilisée. Essayez de vous connecter.'
        : msg
      return
    }

    currentStep.value = 4
  } catch (err: any) {
    stepError.value = err?.message || 'Une erreur réseau est survenue.'
  } finally {
    submitting.value = false
  }
}

function translateAuthError(msg: string): string {
  if (msg.includes('already registered') || msg.includes('User already registered')) {
    return 'Cette adresse email est déjà utilisée. Essayez de vous connecter.'
  }
  if (msg.includes('Password should be')) {
    return 'Le mot de passe ne respecte pas les exigences de sécurité.'
  }
  if (msg.includes('Unable to validate email')) {
    return "Format d'email invalide."
  }
  if (msg.includes('rate limit')) {
    return 'Trop de tentatives. Veuillez patienter quelques minutes.'
  }
  return msg
}
</script>
