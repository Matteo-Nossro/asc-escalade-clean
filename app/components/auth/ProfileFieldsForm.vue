<template>
  <div class="space-y-6 lg:space-y-0 lg:flex lg:gap-6 lg:items-start">
    <div class="space-y-6 lg:flex-1 lg:min-w-0">
      <!-- Identité -->
      <div class="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
      <h3 class="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
        <UIcon name="i-lucide-user" class="w-5 h-5 text-vp-green" />
        Identité
      </h3>
      <div class="space-y-5">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UFormField label="Prénom" required :error="errors.first_name">
            <UInput v-model="model.first_name" data-testid="input-first-name" placeholder="Jean" icon="i-lucide-user" size="lg" class="w-full" />
          </UFormField>
          <UFormField label="Nom" required :error="errors.last_name">
            <UInput v-model="model.last_name" data-testid="input-last-name" placeholder="Dupont" icon="i-lucide-user" size="lg" class="w-full" />
          </UFormField>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UFormField label="Date de naissance" required :error="errors.birth_date">
            <UInput
              v-model="model.birth_date"
              data-testid="input-birth-date"
              type="date"
              icon="i-lucide-calendar"
              size="lg"
              class="w-full"
              :max="maxBirthDate"
            />
          </UFormField>
          <UFormField label="Sexe" required :error="errors.gender">
            <select
              :value="genderDisplay"
              data-testid="select-gender"
              class="w-full h-[46px] px-3 rounded-lg border text-sm text-gray-900 cursor-pointer focus:outline-none focus:ring-2 focus:ring-vp-green focus:border-transparent transition-all"
              :class="errors.gender ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white'"
              @change="onGenderChange"
            >
              <option value="">Sélectionner…</option>
              <option value="Homme">Homme</option>
              <option value="Femme">Femme</option>
            </select>
          </UFormField>
        </div>

        <UFormField label="Téléphone" :error="errors.phone">
          <UInput
            v-model="model.phone"
            data-testid="input-phone"
            type="tel"
            placeholder="06 00 00 00 00"
            icon="i-lucide-smartphone"
            size="lg"
            class="w-full"
          />
        </UFormField>
      </div>
    </div>

      <!-- Emplacement pour des champs propres à la page (ex. identifiants de connexion) -->
      <slot name="after-identity" />
    </div>

    <!-- Adresse -->
    <div class="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100 lg:flex-1 lg:min-w-0">
      <h3 class="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
        <UIcon name="i-lucide-map-pin" class="w-5 h-5 text-vp-green" />
        Adresse
      </h3>
      <div class="space-y-5">
        <UFormField label="Adresse">
          <div class="relative w-full">
            <UInput
              v-model="model.address"
              data-testid="input-address"
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
                  <UIcon name="i-lucide-map-pin" class="w-4 h-4 text-vp-green mt-0.5 shrink-0" />
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
            <UInput v-model="model.postal_code" data-testid="input-postal-code" placeholder="21000" icon="i-lucide-hash" size="lg" class="w-full" />
          </UFormField>
          <UFormField label="Ville">
            <UInput v-model="model.city" data-testid="input-city" placeholder="Dijon" icon="i-lucide-building-2" size="lg" class="w-full" />
          </UFormField>
        </div>

        <p class="text-xs text-gray-400 flex items-center gap-1">
          <UIcon name="i-lucide-info" class="w-3 h-3" />
          Tapez votre adresse pour obtenir des suggestions.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from 'vue'
import { adultMaxBirthDate } from '~/utils/profileForm'
import type { ParentFields, ParentErrors } from '~/utils/profileForm'

defineProps<{ errors: Partial<ParentErrors> }>()
const model = defineModel<ParentFields>({ required: true })

const maxBirthDate = computed(() => adultMaxBirthDate())

// Le profil peut contenir 'M' / 'F' (page profil) : on les affiche comme Homme / Femme sans les réécrire.
const genderDisplay = computed(() => {
  if (model.value.gender === 'M') return 'Homme'
  if (model.value.gender === 'F') return 'Femme'
  return model.value.gender
})

function onGenderChange(e: Event) {
  model.value.gender = (e.target as HTMLSelectElement).value
}

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
  const q = (model.value.address ?? '').trim()
  if (q.length < 3) { addressSuggestions.value = []; showAddressSuggestions.value = false; return }
  addressDebounce = setTimeout(() => fetchAddressSuggestions(q), 200)
}

function hideAddressSuggestions() {
  setTimeout(() => { showAddressSuggestions.value = false }, 150)
}

function selectAddress(s: AddressSuggestion) {
  model.value.address = s.name
  model.value.postal_code = s.postcode
  model.value.city = s.city
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
  }
  catch {
    // silent fail — l'utilisateur peut saisir manuellement
  }
  finally {
    addressLoading.value = false
  }
}

onBeforeUnmount(() => {
  if (addressDebounce) clearTimeout(addressDebounce)
})
</script>
