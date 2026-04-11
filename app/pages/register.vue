<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 py-12 page-content">
    <div class="w-full max-w-xl mx-auto">

      <!-- ── En-tête ── -->
      <div class="text-center mb-8">
        <NuxtLink
          to="/"
          class="inline-flex items-center justify-center w-16 h-16 bg-[#7FD857] rounded-2xl mb-4 shadow-lg transition-transform hover:scale-105"
        >
          <UIcon name="i-lucide-mountain" class="w-8 h-8 text-[#0F1729]" />
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
          :class="typeChoice === 'adult' ? 'border-[#7FD857]' : 'border-transparent hover:border-[#7FD857]'"
          @click="typeChoice = 'adult'"
        >
          <div class="flex items-start gap-4">
            <div class="w-12 h-12 rounded-2xl bg-[#7FD857]/10 flex items-center justify-center shrink-0">
              <UIcon name="i-lucide-user" class="w-6 h-6 text-[#7FD857]" />
            </div>
            <div class="flex-1">
              <p class="font-bold text-gray-900 text-lg">Je suis majeur et je souhaite m'inscrire</p>
              <p class="text-sm text-gray-500 mt-1">Créer mon compte personnel.</p>
            </div>
            <UIcon v-if="typeChoice === 'adult'" name="i-lucide-check-circle-2" class="w-5 h-5 text-[#7FD857] shrink-0 mt-1" />
          </div>
        </button>

        <button
          type="button"
          class="w-full bg-white rounded-3xl shadow-xl border-2 p-6 text-left transition-all hover:shadow-2xl"
          :class="typeChoice === 'minor' ? 'border-amber-400' : 'border-transparent hover:border-amber-400'"
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
          class="bg-[#7FD857] hover:bg-[#6bc546] text-[#0F1729] font-bold shadow-lg hover:shadow-xl transition-all"
          @click="currentStep = 2"
        >
          Continuer
          <template #trailing>
            <UIcon name="i-lucide-arrow-right" class="w-5 h-5" />
          </template>
        </UButton>

        <p class="text-center text-sm text-gray-500">
          Déjà un compte ?
          <NuxtLink to="/login" class="text-[#7FD857] hover:text-[#6bc546] font-bold ml-1">Se connecter</NuxtLink>
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

        <!-- Identité -->
        <div class="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
          <h3 class="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <UIcon name="i-lucide-user" class="w-5 h-5 text-[#7FD857]" />
            Identité
          </h3>
          <div class="space-y-5">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <UFormField label="Prénom" required :error="errors.first_name">
                <UInput v-model="form.first_name" placeholder="Jean" icon="i-lucide-user" size="lg" class="w-full" />
              </UFormField>
              <UFormField label="Nom" required :error="errors.last_name">
                <UInput v-model="form.last_name" placeholder="Dupont" icon="i-lucide-user" size="lg" class="w-full" />
              </UFormField>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <UFormField label="Date de naissance" required :error="errors.birth_date">
                <UInput
                  v-model="form.birth_date"
                  type="date"
                  icon="i-lucide-calendar"
                  size="lg"
                  class="w-full"
                  :max="maxBirthDate"
                />
              </UFormField>
              <UFormField label="Sexe" required :error="errors.gender">
                <select
                  v-model="form.gender"
                  class="w-full h-[46px] px-3 rounded-lg border text-sm text-gray-900 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#7FD857] focus:border-transparent transition-all"
                  :class="errors.gender ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white'"
                >
                  <option value="">Sélectionner…</option>
                  <option value="Homme">Homme</option>
                  <option value="Femme">Femme</option>
                </select>
              </UFormField>
            </div>

            <UFormField label="Téléphone" :error="errors.phone">
              <UInput
                v-model="form.phone"
                type="tel"
                placeholder="06 00 00 00 00"
                icon="i-lucide-smartphone"
                size="lg"
                class="w-full"
              />
            </UFormField>
          </div>
        </div>

        <!-- Connexion -->
        <div class="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
          <h3 class="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <UIcon name="i-lucide-lock" class="w-5 h-5 text-[#7FD857]" />
            Connexion
          </h3>
          <div class="space-y-5">
            <UFormField label="Adresse email" required :error="errors.email">
              <UInput
                v-model="form.email"
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

            <UFormField label="Confirmer le mot de passe" required :error="errors.passwordConfirm">
              <UInput
                v-model="form.passwordConfirm"
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

        <!-- Adresse -->
        <div class="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
          <h3 class="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <UIcon name="i-lucide-map-pin" class="w-5 h-5 text-[#7FD857]" />
            Adresse
          </h3>
          <div class="space-y-5">
            <UFormField label="Adresse">
              <div class="relative w-full">
                <UInput
                  v-model="form.address"
                  placeholder="12 rue de l'Escalade"
                  icon="i-lucide-home"
                  size="lg"
                  :loading="addressLoading"
                  autocomplete="off"
                  class="w-full"
                  @input="onAddressInput"
                  @focus="showAddressSuggestions = addressSuggestions.length > 0"
                  @blur="hideAddressSuggestions"
                />
                <Transition
                  enter-active-class="transition ease-out duration-100"
                  enter-from-class="opacity-0 -translate-y-1"
                  enter-to-class="opacity-100 translate-y-0"
                  leave-active-class="transition ease-in duration-75"
                  leave-from-class="opacity-100 translate-y-0"
                  leave-to-class="opacity-0 -translate-y-1"
                >
                  <div
                    v-if="showAddressSuggestions && addressSuggestions.length"
                    class="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden"
                  >
                    <button
                      v-for="(s, i) in addressSuggestions"
                      :key="s.id || i"
                      type="button"
                      class="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-start gap-3 border-b border-gray-100 last:border-0 transition-colors cursor-pointer"
                      @mousedown.prevent="selectAddress(s)"
                    >
                      <UIcon name="i-lucide-map-pin" class="w-4 h-4 text-[#7FD857] mt-0.5 shrink-0" />
                      <div class="min-w-0">
                        <p class="text-sm font-medium text-gray-900 truncate">{{ s.name }}</p>
                        <p class="text-xs text-gray-500">{{ s.postcode }} {{ s.city }}</p>
                      </div>
                    </button>
                    <div class="px-4 py-2 bg-gray-50 border-t border-gray-100">
                      <span class="text-xs text-gray-400">Base Adresse Nationale</span>
                    </div>
                  </div>
                </Transition>
              </div>
            </UFormField>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <UFormField label="Code postal" :error="errors.postal_code">
                <UInput v-model="form.postal_code" placeholder="21000" icon="i-lucide-hash" size="lg" class="w-full" />
              </UFormField>
              <UFormField label="Ville">
                <UInput v-model="form.city" placeholder="Dijon" icon="i-lucide-building-2" size="lg" class="w-full" />
              </UFormField>
            </div>

            <p class="text-xs text-gray-400 flex items-center gap-1">
              <UIcon name="i-lucide-info" class="w-3 h-3" />
              Tapez votre adresse pour obtenir des suggestions.
            </p>
          </div>
        </div>

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
            block
            size="xl"
            :loading="submitting"
            :disabled="submitting"
            class="bg-[#7FD857] hover:bg-[#6bc546] text-[#0F1729] font-bold shadow-lg hover:shadow-xl transition-all"
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
          <div class="w-14 h-14 rounded-2xl bg-[#7FD857]/10 flex items-center justify-center mx-auto mb-4">
            <UIcon name="i-lucide-users" class="w-7 h-7 text-[#7FD857]" />
          </div>
          <h3 class="text-lg font-bold text-gray-900 mb-2">Inscrire un enfant</h3>
          <p class="text-sm text-gray-500">
            Ajoutez un ou plusieurs enfants. Vous pourrez également en ajouter d'autres plus tard depuis votre profil.
          </p>
        </div>

        <!-- Cartes enfants déjà ajoutés -->
        <div v-if="children.length > 0" class="space-y-3">
          <div
            v-for="(child, i) in children"
            :key="i"
            class="bg-white rounded-2xl shadow p-4 border border-gray-100 flex items-center justify-between gap-4"
          >
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-[#7FD857]/10 flex items-center justify-center font-bold text-[#7FD857] text-sm shrink-0">
                {{ getChildInitials(child) }}
              </div>
              <div>
                <p class="font-semibold text-gray-900">{{ child.first_name }} {{ child.last_name }}</p>
                <p class="text-xs text-gray-500">{{ formatDate(child.birth_date) }}</p>
              </div>
            </div>
            <UButton icon="i-lucide-trash-2" color="error" variant="ghost" size="sm" @click="removeChild(i)" />
          </div>
        </div>

        <!-- Formulaire ajout enfant -->
        <div class="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
          <h3 class="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <UIcon name="i-lucide-user-plus" class="w-5 h-5 text-[#7FD857]" />
            Ajouter un enfant
          </h3>
          <div class="space-y-5">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <UFormField label="Prénom" :error="childErrors.first_name">
                <UInput v-model="childForm.first_name" placeholder="Marie" icon="i-lucide-user" size="lg" class="w-full" />
              </UFormField>
              <UFormField label="Nom" :error="childErrors.last_name">
                <UInput v-model="childForm.last_name" placeholder="Dupont" icon="i-lucide-user" size="lg" class="w-full" />
              </UFormField>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <UFormField label="Date de naissance" required :error="childErrors.birth_date">
                <UInput
                  v-model="childForm.birth_date"
                  type="date"
                  icon="i-lucide-calendar"
                  size="lg"
                  class="w-full"
                  :max="today"
                />
              </UFormField>
              <UFormField label="Sexe" required :error="childErrors.gender">
                <select
                  v-model="childForm.gender"
                  class="w-full h-[46px] px-3 rounded-lg border text-sm text-gray-900 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#7FD857] focus:border-transparent transition-all"
                  :class="childErrors.gender ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white'"
                >
                  <option value="">Sélectionner…</option>
                  <option value="Homme">Garçon</option>
                  <option value="Femme">Fille</option>
                </select>
              </UFormField>
            </div>

            <div class="space-y-3">
              <UCheckbox v-model="childForm.sameAddress" label="Même adresse que le parent" />
              <template v-if="!childForm.sameAddress">
                <UFormField label="Adresse">
                  <UInput v-model="childForm.address" placeholder="12 rue de l'Escalade" icon="i-lucide-home" size="lg" class="w-full" />
                </UFormField>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <UFormField label="Code postal">
                    <UInput v-model="childForm.postal_code" placeholder="21000" icon="i-lucide-hash" size="lg" class="w-full" />
                  </UFormField>
                  <UFormField label="Ville">
                    <UInput v-model="childForm.city" placeholder="Dijon" icon="i-lucide-building-2" size="lg" class="w-full" />
                  </UFormField>
                </div>
              </template>
              <template v-else>
                <div class="px-4 py-3 bg-gray-50 rounded-xl text-sm text-gray-600 flex items-center gap-2">
                  <UIcon name="i-lucide-map-pin" class="w-4 h-4 text-gray-400 shrink-0" />
                  <span>{{ [form.address, form.postal_code, form.city].filter(Boolean).join(', ') || 'Adresse du parent' }}</span>
                </div>
              </template>
            </div>

            <UButton variant="soft" size="lg" class="w-full" icon="i-lucide-plus" type="button" @click="addChild">
              Ajouter cet enfant
            </UButton>
          </div>
        </div>

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
            class="bg-[#7FD857] hover:bg-[#6bc546] text-[#0F1729] font-bold shadow-lg hover:shadow-xl transition-all"
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
          <div class="w-20 h-20 rounded-full bg-[#7FD857]/10 flex items-center justify-center mx-auto mb-6">
            <UIcon name="i-lucide-check-circle-2" class="w-10 h-10 text-[#7FD857]" />
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
              class="bg-[#7FD857] hover:bg-[#6bc546] text-[#0F1729] font-bold shadow-lg"
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
              class="border-[#7FD857] text-[#7FD857] hover:bg-[#7FD857]/10 font-bold"
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
import { ref, computed, watch } from 'vue'

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

// ── Formulaire ────────────────────────────────────────────────────────────────
const form = ref({
  first_name: '',
  last_name: '',
  email: '',
  password: '',
  passwordConfirm: '',
  birth_date: '',
  gender: '',
  phone: '',
  address: '',
  postal_code: '',
  city: '',
})

const errors = ref({
  first_name: '',
  last_name: '',
  email: '',
  password: '',
  passwordConfirm: '',
  birth_date: '',
  gender: '',
  phone: '',
  postal_code: '',
})

// ── Formulaire enfant ─────────────────────────────────────────────────────────
interface ChildData {
  first_name: string
  last_name: string
  birth_date: string
  gender: string
  address: string
  postal_code: string
  city: string
  sameAddress: boolean
}

const children = ref<ChildData[]>([])
const childForm = ref<ChildData>({
  first_name: '', last_name: '', birth_date: '', gender: '',
  address: '', postal_code: '', city: '', sameAddress: false,
})
const childErrors = ref({ first_name: '', last_name: '', birth_date: '', gender: '' })

watch(() => childForm.value.sameAddress, (checked) => {
  if (checked) {
    childForm.value.address = form.value.address
    childForm.value.postal_code = form.value.postal_code
    childForm.value.city = form.value.city
  } else {
    childForm.value.address = ''
    childForm.value.postal_code = ''
    childForm.value.city = ''
  }
})

function validateChild(): boolean {
  const e = { first_name: '', last_name: '', birth_date: '', gender: '' }
  if (!childForm.value.first_name.trim()) e.first_name = 'Le prénom est requis'
  if (!childForm.value.last_name.trim()) e.last_name = 'Le nom est requis'
  if (!childForm.value.birth_date) e.birth_date = 'La date de naissance est requise'
  if (!childForm.value.gender) e.gender = 'Le sexe est requis'
  childErrors.value = e
  return !Object.values(e).some(v => v)
}

function addChild() {
  if (!validateChild()) return
  children.value.push({
    first_name: childForm.value.first_name,
    last_name: childForm.value.last_name,
    birth_date: childForm.value.birth_date,
    gender: childForm.value.gender,
    address: childForm.value.sameAddress ? form.value.address : childForm.value.address,
    postal_code: childForm.value.sameAddress ? form.value.postal_code : childForm.value.postal_code,
    city: childForm.value.sameAddress ? form.value.city : childForm.value.city,
    sameAddress: childForm.value.sameAddress,
  })
  childForm.value = { first_name: '', last_name: '', birth_date: '', gender: '', address: '', postal_code: '', city: '', sameAddress: false }
  childErrors.value = { first_name: '', last_name: '', birth_date: '', gender: '' }
}

function removeChild(index: number) {
  children.value.splice(index, 1)
}

function getChildInitials(child: ChildData): string {
  return [child.first_name, child.last_name].filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'
}

function formatDate(d: string): string {
  if (!d) return ''
  try { return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) }
  catch { return d }
}

// ── Dates ─────────────────────────────────────────────────────────────────────
const today = computed(() => new Date().toISOString().split('T')[0])

// Date max : l'utilisateur doit avoir 18 ans révolus
const maxBirthDate = computed(() => {
  const d = new Date()
  d.setFullYear(d.getFullYear() - 18)
  return d.toISOString().split('T')[0]
})

// ── Autocomplétion adresse (Base Adresse Nationale) ───────────────────────────
interface AddressSuggestion {
  id: string
  name: string
  postcode: string
  city: string
}

const addressSuggestions = ref<AddressSuggestion[]>([])
const addressLoading = ref(false)
const showAddressSuggestions = ref(false)
let addressDebounce: ReturnType<typeof setTimeout> | null = null

function onAddressInput() {
  if (addressDebounce) clearTimeout(addressDebounce)
  const q = form.value.address.trim()
  if (q.length < 3) { addressSuggestions.value = []; showAddressSuggestions.value = false; return }
  addressDebounce = setTimeout(() => fetchAddressSuggestions(q), 200)
}

function hideAddressSuggestions() {
  setTimeout(() => { showAddressSuggestions.value = false }, 150)
}

function selectAddress(s: AddressSuggestion) {
  form.value.address = s.name
  form.value.postal_code = s.postcode
  form.value.city = s.city
  addressSuggestions.value = []
  showAddressSuggestions.value = false
}

async function fetchAddressSuggestions(query: string) {
  addressLoading.value = true
  try {
    const url = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=8&autocomplete=1`
    const res = await fetch(url)
    const data = await res.json()
    addressSuggestions.value = (data.features ?? []).map((f: any) => ({
      id: f.properties.id ?? '',
      name: f.properties.name ?? '',
      postcode: f.properties.postcode ?? '',
      city: f.properties.city ?? '',
    }))
    showAddressSuggestions.value = addressSuggestions.value.length > 0
  } catch {
    // silent fail — l'utilisateur peut saisir manuellement
  } finally {
    addressLoading.value = false
  }
}

// ── Validation ────────────────────────────────────────────────────────────────
function validate(): boolean {
  const e = {
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    passwordConfirm: '',
    birth_date: '',
    gender: '',
    phone: '',
    postal_code: '',
  }

  if (!form.value.first_name.trim()) e.first_name = 'Le prénom est requis'
  if (!form.value.last_name.trim()) e.last_name = 'Le nom est requis'

  if (!form.value.email.trim()) {
    e.email = "L'email est requis"
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) {
    e.email = "Format d'email invalide"
  }

  if (!form.value.password) {
    e.password = 'Le mot de passe est requis'
  } else if (form.value.password.length < 8) {
    e.password = 'Le mot de passe doit contenir au moins 8 caractères'
  }

  if (!form.value.passwordConfirm) {
    e.passwordConfirm = 'Veuillez confirmer le mot de passe'
  } else if (form.value.password !== form.value.passwordConfirm) {
    e.passwordConfirm = 'Les mots de passe ne correspondent pas'
  }

  if (!form.value.birth_date) {
    e.birth_date = 'La date de naissance est requise'
  } else {
    const birth = new Date(form.value.birth_date)
    const cutoff = new Date()
    cutoff.setFullYear(cutoff.getFullYear() - 18)
    if (birth > cutoff) e.birth_date = 'Vous devez avoir au moins 18 ans'
  }

  if (!form.value.gender) e.gender = 'Le sexe est requis'

  if (form.value.phone) {
    const digits = form.value.phone.replace(/\D/g, '')
    if (digits.length < 10 || digits.length > 11) e.phone = 'Numéro de téléphone invalide'
  }

  if (form.value.postal_code && !/^\d{5}$/.test(form.value.postal_code)) {
    e.postal_code = 'Code postal invalide (5 chiffres)'
  }

  errors.value = e
  return !Object.values(e).some(v => v)
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
  const cf = childForm.value
  const hasRequired = cf.first_name.trim() && cf.last_name.trim() && cf.birth_date
  const hasAny = cf.first_name.trim() || cf.last_name.trim() || cf.birth_date || cf.address.trim()

  if (hasRequired) {
    addChild()
  } else if (hasAny) {
    stepError.value = 'Le formulaire enfant est incomplet. Complétez le prénom, le nom et la date de naissance, ou videz-le avant de terminer.'
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
      options: { data: { full_name: `${form.value.first_name} ${form.value.last_name}`.trim() } },
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

    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        parent: {
          first_name: form.value.first_name,
          last_name: form.value.last_name,
          email: form.value.email,
          birth_date: form.value.birth_date || null,
          gender: form.value.gender || null,
          phone: form.value.phone || null,
          address: form.value.address || null,
          postal_code: form.value.postal_code || null,
          city: form.value.city || null,
        },
        children: childrenToRegister.map(c => ({
          first_name: c.first_name,
          last_name: c.last_name,
          birth_date: c.birth_date || null,
          address: c.address || null,
          postal_code: c.postal_code || null,
          city: c.city || null,
        })),
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
