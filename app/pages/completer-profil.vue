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
        <p class="text-gray-600">Compléter votre profil</p>
      </div>

      <!-- ── Formulaire ── -->
      <form v-if="!done" class="space-y-6" data-testid="form-complete-profile" @submit.prevent="handleSubmit">
        <div class="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100 text-center">
          <div class="w-14 h-14 rounded-2xl bg-vp-green/10 flex items-center justify-center mx-auto mb-4">
            <UIcon name="i-lucide-clipboard-list" class="w-7 h-7 text-vp-green" />
          </div>
          <h2 class="text-lg font-bold text-gray-900 mb-2">Plus que quelques informations</h2>
          <p class="text-sm text-gray-500">
            Votre compte est créé. Complétez votre profil pour finaliser votre inscription : le bureau validera ensuite votre adhésion.
          </p>
        </div>

        <UAlert
          v-if="stepError"
          color="error"
          variant="soft"
          :title="stepError"
          icon="i-lucide-alert-circle"
          :close-button="{ icon: 'i-lucide-x', color: 'error', variant: 'ghost' }"
          @close="stepError = ''"
        />

        <AuthProfileFieldsForm v-model="form" :errors="errors" />

        <!-- Enfants (facultatif) -->
        <div class="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
          <h3 class="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
            <UIcon name="i-lucide-users" class="w-5 h-5 text-vp-green" />
            Vos enfants (facultatif)
          </h3>
          <p class="text-sm text-gray-500">
            Vous inscrivez aussi un ou plusieurs enfants mineurs ? Ajoutez-les ci-dessous. Vous pourrez en ajouter d'autres plus tard depuis votre profil.
          </p>
        </div>
        <AuthChildrenForm
          ref="childrenForm"
          v-model="children"
          v-model:draft="childDraft"
          v-model:draftErrors="childDraftErrors"
          :parent-address="{ address: form.address, postal_code: form.postal_code, city: form.city }"
        />

        <UButton
          type="submit"
          block
          size="xl"
          data-testid="btn-complete-submit"
          :loading="submitting"
          :disabled="submitting"
          class="bg-vp-green hover:bg-vp-green-hover text-vp-dark font-bold shadow-lg hover:shadow-xl transition-all"
        >
          <template v-if="!submitting" #leading>
            <UIcon name="i-lucide-check" class="w-5 h-5" />
          </template>
          {{ submitting ? 'Envoi en cours…' : 'Valider mon profil' }}
        </UButton>
      </form>

      <!-- ── Succès ── -->
      <div v-else class="text-center" data-testid="complete-profile-done">
        <div class="bg-white rounded-3xl shadow-2xl p-10 border border-gray-100">
          <div class="w-20 h-20 rounded-full bg-vp-green/10 flex items-center justify-center mx-auto mb-6">
            <UIcon name="i-lucide-check-circle-2" class="w-10 h-10 text-vp-green" />
          </div>
          <h2 class="text-2xl font-bold text-gray-900 mb-3">Profil envoyé !</h2>
          <p class="text-sm text-gray-500 mb-8" data-testid="msg-complete-pending">
            Votre inscription est en attente de validation par le bureau. Vous serez prévenu une fois votre adhésion validée.
          </p>
          <UButton
            block
            size="xl"
            to="/profil"
            class="bg-vp-green hover:bg-vp-green-hover text-vp-dark font-bold shadow-lg"
          >
            <template #leading>
              <UIcon name="i-lucide-user-circle" class="w-5 h-5" />
            </template>
            Accéder à mon profil
          </UButton>
        </div>
      </div>

      <!-- ── Déconnexion ── -->
      <p class="text-center text-sm text-gray-500 mt-6">
        Ce n'est pas votre compte ?
        <button
          type="button"
          class="text-vp-green hover:text-vp-green-hover font-bold ml-1 cursor-pointer"
          data-testid="btn-complete-logout"
          @click="logout"
        >
          Déconnexion
        </button>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
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

// Pas de middleware `guest` : la page demande d'être connecté (liste dans auth.global.ts)
definePageMeta({
  layout: false,
  ssr: false,
})

const { profile, fetchProfile, logout } = useAuth()

const form = ref(emptyParentFields())
const errors = ref(emptyParentErrors())
const children = ref<ChildData[]>([])
const childDraft = ref<ChildData>(emptyChild())
const childDraftErrors = ref(emptyChildErrors())
const childrenForm = ref<{ flushPending: () => { ok: boolean, error?: string } } | null>(null)
const stepError = ref('')
const submitting = ref(false)
const done = ref(false)

// Pré-remplissage depuis le profil (enrichissement FFME, nom du compte Google / Microsoft…), une seule fois par profil
let prefilledFor: string | null = null
watch(profile, (p) => {
  if (!p || prefilledFor === p.id) return
  prefilledFor = p.id
  const [firstWord, ...others] = (p.full_name ?? '').trim().split(/\s+/)
  form.value = {
    first_name: p.first_name || firstWord || '',
    last_name: p.last_name || others.join(' '),
    birth_date: (p.birth_date ?? '').slice(0, 10),
    gender: p.gender ?? '',
    phone: p.phone || p.mobile || '',
    address: p.address ?? '',
    postal_code: p.postal_code ?? '',
    city: p.city ?? '',
  }
}, { immediate: true })

async function handleSubmit() {
  stepError.value = ''

  const e = validateParent(form.value)
  errors.value = e
  if (hasErrors(e)) return

  // Ajoute l'enfant en cours de saisie s'il est complet
  const pending = childrenForm.value?.flushPending() ?? { ok: true }
  if (!pending.ok) {
    stepError.value = pending.error ?? ''
    return
  }

  submitting.value = true
  try {
    // L'identité (id, e-mail) vient de la session côté serveur : ni userId ni e-mail dans le corps
    await $fetch('/api/profile/complete', {
      method: 'POST',
      body: {
        parent: buildParentPayload(form.value),
        children: buildChildrenPayload(children.value),
      },
    })
    done.value = true
    // Relit le profil partagé : le middleware ne renvoie plus vers /completer-profil
    await fetchProfile()
  }
  catch (err: any) {
    if (err?.statusCode === 409 || err?.status === 409) {
      // Déjà complété (autre onglet…) : on relit le profil et on continue
      await fetchProfile()
      await navigateTo('/profil')
      return
    }
    stepError.value = err?.data?.statusMessage || err?.statusMessage || err?.message || 'Une erreur est survenue.'
  }
  finally {
    submitting.value = false
  }
}
</script>
