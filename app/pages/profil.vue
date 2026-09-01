<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 py-12 page-content">
    <div class="w-full max-w-xl mx-auto">

      <!-- Titre -->
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">
          {{ isEditingChild ? 'Profil enfant' : 'Mon profil' }}
        </h1>
        <p class="text-gray-600">
          {{ isEditingChild ? `Modifier le profil de ${form.first_name}` : 'Gérez vos informations personnelles' }}
        </p>
      </div>

      <!-- Loader -->
      <div v-if="!ready" class="flex justify-center py-20">
        <div class="w-8 h-8 border-3 border-gray-200 border-t-[#7FD857] rounded-full animate-spin" />
      </div>

      <!-- Contenu -->
      <div v-else class="space-y-6">

        <!-- Réinitialisation mot de passe -->
        <div v-if="showResetPassword" class="bg-white rounded-3xl shadow-2xl p-8 border-2 border-[#7FD857]">
          <h3 class="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <UIcon name="i-lucide-key" class="w-5 h-5 text-[#7FD857]" />
            Définir un nouveau mot de passe
          </h3>

          <UAlert
            v-if="resetSuccess"
            color="success"
            variant="soft"
            title="Mot de passe mis à jour avec succès !"
            icon="i-lucide-check-circle"
            class="mb-4"
          />

          <UAlert
            v-if="resetError"
            color="error"
            variant="soft"
            :title="resetError"
            icon="i-lucide-alert-circle"
            class="mb-4"
            :close-button="{ icon: 'i-lucide-x', color: 'error', variant: 'ghost' }"
            @close="resetError = ''"
          />

          <form v-if="!resetSuccess" @submit.prevent="handleResetPassword" class="space-y-4">
            <UFormField label="Nouveau mot de passe" required :error="resetErrors.password">
              <UInput
                v-model="resetForm.password"
                type="password"
                placeholder="••••••••"
                icon="i-lucide-lock"
                size="lg"
                :disabled="resetLoading"
                class="w-full"
              />
            </UFormField>

            <UFormField label="Confirmer le mot de passe" required :error="resetErrors.confirm">
              <UInput
                v-model="resetForm.confirm"
                type="password"
                placeholder="••••••••"
                icon="i-lucide-lock-keyhole"
                size="lg"
                :disabled="resetLoading"
                class="w-full"
              />
            </UFormField>

            <p class="text-xs text-gray-400">Minimum 8 caractères.</p>

            <UButton
              type="submit"
              size="lg"
              block
              :loading="resetLoading"
              :disabled="resetLoading"
              class="bg-[#7FD857] hover:bg-[#6bc546] text-[#0F1729] font-bold"
            >
              <template #leading>
                <UIcon name="i-lucide-shield-check" class="w-5 h-5" />
              </template>
              {{ resetLoading ? 'Mise à jour...' : 'Mettre à jour le mot de passe' }}
            </UButton>
          </form>
        </div>

        <!-- Card famille (sélecteur + ajout enfant) -->
        <div v-if="children.length > 0 || userRoles.includes('parent')" class="bg-white rounded-3xl shadow-2xl p-6 border border-gray-100">
          <h3 class="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
            <UIcon name="i-lucide-users" class="w-4 h-4 text-[#7FD857]" />
            Profils famille
          </h3>
          <div class="flex flex-wrap gap-2">
            <UButton
              :variant="!isEditingChild ? 'solid' : 'soft'"
              :class="!isEditingChild ? 'bg-[#7FD857] text-[#0F1729] hover:bg-[#6bc546]' : ''"
              size="sm"
              @click="switchToOwnProfile"
            >
              <template #leading>
                <div class="w-6 h-6 rounded-md bg-[#0F1729]/10 flex items-center justify-center text-xs font-bold">
                  {{ ownInitials }}
                </div>
              </template>
              Moi
            </UButton>

            <UButton
              v-for="child in children"
              :key="child.child_id"
              :variant="editingChildId === child.child_id ? 'solid' : 'soft'"
              :class="editingChildId === child.child_id ? 'bg-[#7FD857] text-[#0F1729] hover:bg-[#6bc546]' : ''"
              size="sm"
              @click="switchToChildProfile(child.child_id)"
            >
              <template #leading>
                <div class="w-6 h-6 rounded-md bg-[#0F1729]/10 flex items-center justify-center text-xs font-bold">
                  {{ getChildInitials(child) }}
                </div>
              </template>
              {{ child.child?.full_name || 'Enfant' }}
            </UButton>

            <UButton
              size="sm"
              variant="soft"
              icon="i-lucide-plus"
              @click="showAddChildForm = !showAddChildForm"
            >
              Ajouter un enfant
            </UButton>
          </div>

          <!-- Formulaire d'ajout d'enfant -->
          <div v-if="showAddChildForm" class="mt-5 pt-5 border-t border-gray-100 space-y-4">
            <p class="text-sm font-semibold text-gray-700">Nouvel enfant</p>

            <UAlert
              v-if="addChildError"
              color="error"
              variant="soft"
              :title="addChildError"
              icon="i-lucide-alert-circle"
            />

            <div class="grid grid-cols-2 gap-3">
              <UFormField label="Prénom" required :error="addChildErrors.first_name">
                <UInput v-model="addChildForm.first_name" placeholder="Marie" size="md" class="w-full" />
              </UFormField>
              <UFormField label="Nom" required :error="addChildErrors.last_name">
                <UInput v-model="addChildForm.last_name" placeholder="Dupont" size="md" class="w-full" />
              </UFormField>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <UFormField label="Date de naissance">
                <UInput v-model="addChildForm.birth_date" type="date" size="md" class="w-full" />
              </UFormField>
              <UFormField label="Sexe" required :error="addChildErrors.gender">
                <select
                  v-model="addChildForm.gender"
                  class="w-full h-[38px] px-3 rounded-lg border text-sm text-gray-900 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#7FD857] focus:border-transparent transition-all"
                  :class="addChildErrors.gender ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white'"
                >
                  <option value="">Sélectionner…</option>
                  <option value="Homme">Garçon</option>
                  <option value="Femme">Fille</option>
                </select>
              </UFormField>
            </div>

            <div class="flex gap-2 justify-end">
              <UButton variant="soft" size="sm" @click="cancelAddChild">Annuler</UButton>
              <UButton
                size="sm"
                :loading="addingChild"
                class="bg-[#7FD857] text-[#0F1729] hover:bg-[#6bc546]"
                @click="submitAddChild"
              >
                Ajouter
              </UButton>
            </div>
          </div>
        </div>

        <!-- Card Avatar -->
        <div class="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
          <div class="flex flex-col items-center gap-4">
            <div class="relative group">
              <div v-if="form.avatar_url" class="w-24 h-24 rounded-2xl overflow-hidden shadow-lg">
                <img :src="form.avatar_url" alt="Avatar" class="w-full h-full object-cover" />
              </div>
              <div v-else class="w-24 h-24 rounded-2xl bg-[#7FD857] flex items-center justify-center shadow-lg">
                <span class="text-3xl font-bold text-[#0F1729]">{{ initials }}</span>
              </div>
            </div>

            <div class="text-center">
              <h2 class="text-xl font-bold text-gray-900">
                {{ form.first_name || form.last_name
                  ? `${form.first_name} ${form.last_name}`.trim()
                  : 'Sans nom' }}
              </h2>
              <p class="text-sm text-gray-500">{{ form.email }}</p>
              <div v-if="userRoles.length && !isEditingChild" class="flex gap-2 justify-center mt-2">
                <UBadge
                  v-for="role in userRoles"
                  :key="role"
                  :color="getRoleColor(role)"
                  variant="soft"
                  size="sm"
                  class="font-bold"
                >
                  {{ getRoleLabel(role) }}
                </UBadge>
              </div>
              <UBadge v-if="isEditingChild" color="info" variant="soft" size="sm" class="mt-2 font-bold">
                Profil enfant
              </UBadge>
            </div>

            <div v-if="form.licence_number" class="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl">
              <UIcon name="i-lucide-id-card" class="w-4 h-4 text-gray-400" />
              <span class="text-sm text-gray-600">Licence FFME :</span>
              <span class="text-sm font-mono font-bold text-gray-900">{{ form.licence_number }}</span>
            </div>
          </div>
        </div>

        <!-- Card Informations personnelles -->
        <div class="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
          <h3 class="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <UIcon name="i-lucide-user" class="w-5 h-5 text-[#7FD857]" />
            Informations personnelles
          </h3>

          <div class="space-y-5">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <UFormField label="Prénom">
                <UInput
                  v-model="form.first_name"
                  placeholder="Jean"
                  icon="i-lucide-user"
                  size="lg"
                  :disabled="saving"
                  class="w-full"
                />
              </UFormField>

              <UFormField label="Nom">
                <UInput
                  v-model="form.last_name"
                  placeholder="Dupont"
                  icon="i-lucide-user"
                  size="lg"
                  :disabled="saving"
                  class="w-full"
                />
              </UFormField>
            </div>

            <UFormField label="Sexe">
              <USelect
                v-model="form.gender"
                :items="[{ label: 'Homme', value: 'M' }, { label: 'Femme', value: 'F' }]"
                placeholder="Non renseigné"
                size="lg"
                :disabled="saving"
                class="w-full"
              />
            </UFormField>

            <UFormField label="Adresse email" required :error="formErrors.email">
              <UInput
                v-model="form.email"
                type="email"
                placeholder="votre@email.com"
                icon="i-lucide-mail"
                size="lg"
                :disabled="saving"
                class="w-full"
              />
            </UFormField>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <UFormField label="Téléphone fixe" :error="formErrors.phone">
                <UInput
                  v-model="form.phone"
                  type="tel"
                  placeholder="03 80 00 00 00"
                  icon="i-lucide-phone"
                  size="lg"
                  :disabled="saving"
                  class="w-full"
                />
              </UFormField>

              <UFormField label="Portable" :error="formErrors.mobile">
                <UInput
                  v-model="form.mobile"
                  type="tel"
                  placeholder="06 00 00 00 00"
                  icon="i-lucide-smartphone"
                  size="lg"
                  :disabled="saving"
                  class="w-full"
                />
              </UFormField>
            </div>
          </div>
        </div>

        <!-- Card Adresse -->
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
                  :disabled="saving"
                  :loading="addressLoading"
                  autocomplete="off"
                  class="w-full"
                  @input="onAddressInput"
                  @focus="showSuggestions = addressSuggestions.length > 0"
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
                    v-if="showSuggestions && addressSuggestions.length"
                    class="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden"
                  >
                    <button
                      v-for="(suggestion, index) in addressSuggestions"
                      :key="suggestion.id || index"
                      type="button"
                      class="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-start gap-3 border-b border-gray-100 last:border-0 transition-colors cursor-pointer"
                      @mousedown.prevent="selectAddress(suggestion)"
                    >
                      <UIcon name="i-lucide-map-pin" class="w-4 h-4 text-[#7FD857] mt-0.5 shrink-0" />
                      <div class="min-w-0">
                        <p class="text-sm font-medium text-gray-900 truncate">{{ suggestion.name }}</p>
                        <p class="text-xs text-gray-500">{{ suggestion.postcode }} {{ suggestion.city }}</p>
                      </div>
                    </button>

                    <div class="px-4 py-2 bg-gray-50 border-t border-gray-100 flex items-center gap-1">
                      <span class="text-xs text-gray-400">Données :</span>
                      <span class="text-xs font-medium text-gray-500">Base Adresse Nationale</span>
                    </div>
                  </div>
                </Transition>
              </div>
            </UFormField>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <UFormField label="Code postal" :error="formErrors.postal_code">
                <UInput
                  v-model="form.postal_code"
                  placeholder="21000"
                  icon="i-lucide-hash"
                  size="lg"
                  :disabled="saving"
                  class="w-full"
                />
              </UFormField>

              <UFormField label="Ville">
                <UInput
                  v-model="form.city"
                  placeholder="Dijon"
                  icon="i-lucide-building-2"
                  size="lg"
                  :disabled="saving"
                  class="w-full"
                />
              </UFormField>
            </div>

            <p class="text-xs text-gray-400 flex items-center gap-1">
              <UIcon name="i-lucide-info" class="w-3 h-3" />
              Tapez votre adresse pour obtenir des suggestions, ou saisissez manuellement.
            </p>
          </div>
        </div>

        <!-- Card Photo de profil -->
        <div class="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
          <h3 class="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <UIcon name="i-lucide-camera" class="w-5 h-5 text-[#7FD857]" />
            Photo de profil
          </h3>

          <UFormField label="URL de la photo" :error="formErrors.avatar_url">
            <UInput
              v-model="form.avatar_url"
              type="url"
              placeholder="https://exemple.com/ma-photo.jpg"
              icon="i-lucide-link"
              size="lg"
              :disabled="saving"
              class="w-full"
            />
          </UFormField>
          <p class="text-xs text-gray-400 mt-2">
            Collez l'URL d'une photo en ligne. L'upload direct sera disponible prochainement.
          </p>
        </div>

        <!-- Infos club (lecture seule) -->
        <div
          v-if="form.licence_type || form.club_group || form.passport"
          class="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100"
        >
          <h3 class="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <UIcon name="i-lucide-mountain" class="w-5 h-5 text-[#7FD857]" />
            Informations club
            <UBadge color="neutral" variant="soft" size="xs">Lecture seule</UBadge>
          </h3>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div v-if="form.licence_type" class="p-4 bg-gray-50 rounded-xl">
              <p class="text-xs text-gray-500 mb-1">Type de licence</p>
              <p class="font-medium text-gray-900">{{ form.licence_type }}</p>
            </div>
            <div v-if="form.club_group" class="p-4 bg-gray-50 rounded-xl">
              <p class="text-xs text-gray-500 mb-1">Groupe / Créneau</p>
              <p class="font-medium text-gray-900">{{ form.club_group }}</p>
            </div>
            <div v-if="form.passport" class="p-4 bg-gray-50 rounded-xl">
              <p class="text-xs text-gray-500 mb-1">Passeport escalade</p>
              <p class="font-medium text-gray-900">{{ form.passport }}</p>
            </div>
            <div v-if="form.birth_date" class="p-4 bg-gray-50 rounded-xl">
              <p class="text-xs text-gray-500 mb-1">Date de naissance</p>
              <p class="font-medium text-gray-900">{{ formatDate(form.birth_date) }}</p>
            </div>
          </div>
        </div>

        <!-- Bouton sauvegarder -->
        <div class="flex gap-3">
          <UButton
            block
            size="xl"
            :loading="saving"
            :disabled="saving || !hasChanges"
            class="bg-[#7FD857] hover:bg-[#6bc546] text-[#0F1729] font-bold shadow-lg hover:shadow-xl transition-all"
            @click="saveProfile"
          >
            <template #leading>
              <UIcon name="i-lucide-save" class="w-5 h-5" />
            </template>
            {{ saving ? 'Enregistrement…' : 'Enregistrer les modifications' }}
          </UButton>
        </div>

        <!-- Messages -->
        <UAlert
          v-if="successMessage"
          color="success"
          variant="soft"
          :title="successMessage"
          icon="i-lucide-check-circle"
          class="transition-all"
        />

        <UAlert
          v-if="errorMessage"
          color="error"
          variant="soft"
          :title="errorMessage"
          icon="i-lucide-alert-circle"
        />

        <!-- Footer -->
        <div class="text-center text-sm text-gray-400 pb-4">
          <p>Les informations de licence et de club sont gérées par le secrétariat.</p>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { Profile, RoleCode, ParentAccessLink } from '~/types/auth'

definePageMeta({
  layout: false,
  ssr: false,
})

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const route = useRoute()
const router = useRouter()

const ready = ref(false)
const saving = ref(false)
const successMessage = ref('')
const errorMessage = ref('')
const userRoles = ref<RoleCode[]>([])
const formErrors = ref({ email: '', phone: '', mobile: '', postal_code: '', avatar_url: '' })

function validate(): boolean {
  const e = { email: '', phone: '', mobile: '', postal_code: '', avatar_url: '' }
  if (!form.value.email.trim()) {
    e.email = "L'email est requis"
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) {
    e.email = "Format d'email invalide"
  }
  if (form.value.phone) {
    const digits = form.value.phone.replace(/\D/g, '')
    if (digits.length < 10 || digits.length > 11) e.phone = 'Numéro de téléphone invalide'
  }
  if (form.value.mobile) {
    const digits = form.value.mobile.replace(/\D/g, '')
    if (digits.length < 10 || digits.length > 11) e.mobile = 'Numéro de portable invalide'
  }
  if (form.value.postal_code && !/^\d{5}$/.test(form.value.postal_code)) {
    e.postal_code = 'Code postal invalide (5 chiffres)'
  }
  if (form.value.avatar_url && !/^https?:\/\/.+/.test(form.value.avatar_url)) {
    e.avatar_url = "L'URL doit commencer par http:// ou https://"
  }
  formErrors.value = e
  return !Object.values(e).some(v => v)
}

// ─── Réinitialisation mot de passe ───────────────────────────────────────────

const showResetPassword = computed(() => route.query.resetPassword === 'true' && !isEditingChild.value)
const resetForm = ref({ password: '', confirm: '' })
const resetLoading = ref(false)
const resetSuccess = ref(false)
const resetError = ref('')
const resetErrors = ref({ password: '', confirm: '' })

async function handleResetPassword() {
  resetErrors.value = { password: '', confirm: '' }
  resetError.value = ''
  let valid = true

  if (!resetForm.value.password) {
    resetErrors.value.password = 'Le mot de passe est requis'
    valid = false
  } else if (resetForm.value.password.length < 8) {
    resetErrors.value.password = 'Le mot de passe doit contenir au moins 8 caractères'
    valid = false
  }
  if (!resetForm.value.confirm) {
    resetErrors.value.confirm = 'La confirmation est requise'
    valid = false
  } else if (resetForm.value.password !== resetForm.value.confirm) {
    resetErrors.value.confirm = 'Les mots de passe ne correspondent pas'
    valid = false
  }
  if (!valid) return

  resetLoading.value = true
  try {
    const { error } = await supabase.auth.updateUser({ password: resetForm.value.password })
    if (error) throw error
    resetSuccess.value = true
    resetForm.value = { password: '', confirm: '' }
    setTimeout(() => {
      router.replace({ query: {} })
    }, 3000)
  } catch (e: any) {
    resetError.value = e.message || 'Erreur lors de la mise à jour du mot de passe'
  } finally {
    resetLoading.value = false
  }
}

// ─── Gestion parent / enfant ──────────────────────────────────────────────────

const children = ref<ParentAccessLink[]>([])
const editingChildId = ref<string | null>(null)
const ownProfileData = ref<Profile | null>(null)

// Ajout d'un enfant
const showAddChildForm = ref(false)
const addingChild = ref(false)
const addChildError = ref('')
const addChildErrors = ref({ first_name: '', last_name: '', gender: '' })
const addChildForm = ref({ first_name: '', last_name: '', birth_date: '', gender: '' })

function cancelAddChild() {
  showAddChildForm.value = false
  addChildError.value = ''
  addChildErrors.value = { first_name: '', last_name: '', gender: '' }
  addChildForm.value = { first_name: '', last_name: '', birth_date: '', gender: '' }
}

async function submitAddChild() {
  addChildErrors.value = { first_name: '', last_name: '', gender: '' }
  addChildError.value = ''

  if (!addChildForm.value.first_name.trim()) {
    addChildErrors.value.first_name = 'Le prénom est requis'
    return
  }
  if (!addChildForm.value.last_name.trim()) {
    addChildErrors.value.last_name = 'Le nom est requis'
    return
  }
  if (!addChildForm.value.gender) {
    addChildErrors.value.gender = 'Le sexe est requis'
    return
  }

  addingChild.value = true
  try {
    const res = await fetch('/api/add-child', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        first_name: addChildForm.value.first_name.trim(),
        last_name: addChildForm.value.last_name.trim(),
        birth_date: addChildForm.value.birth_date || null,
        gender: addChildForm.value.gender || null,
        address: null,
        postal_code: null,
        city: null,
      }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      addChildError.value = err?.statusMessage || err?.message || `Erreur ${res.status}`
      return
    }

    const { childId } = await res.json()

    // Recharger la liste des enfants
    const fullName = `${addChildForm.value.first_name.trim()} ${addChildForm.value.last_name.trim()}`.trim()
    children.value.push({
      id: '',
      parent_id: user.value?.id ?? '',
      child_id: childId,
      access_type: 'full',
      created_at: new Date().toISOString(),
      child: {
        id: childId,
        first_name: addChildForm.value.first_name.trim(),
        last_name: addChildForm.value.last_name.trim(),
        full_name: fullName,
        avatar_url: null,
        birth_date: addChildForm.value.birth_date || null,
      },
    } as ParentAccessLink)

    cancelAddChild()
  } catch (err: any) {
    addChildError.value = err?.message || 'Une erreur est survenue'
  } finally {
    addingChild.value = false
  }
}

const isEditingChild = computed(() => editingChildId.value !== null)

const ownInitials = computed(() => {
  if (!ownProfileData.value) return '?'
  const name = ownProfileData.value.first_name && ownProfileData.value.last_name
    ? `${ownProfileData.value.first_name} ${ownProfileData.value.last_name}`
    : ownProfileData.value.full_name || ownProfileData.value.email || '?'
  return name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
})

function getChildInitials(child: ParentAccessLink): string {
  const name = child.child?.full_name || '?'
  return name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
}

async function switchToOwnProfile() {
  if (!isEditingChild.value) return
  editingChildId.value = null
  successMessage.value = ''
  errorMessage.value = ''
  if (ownProfileData.value) {
    populateForm(ownProfileData.value)
  }
}

async function switchToChildProfile(childId: string) {
  editingChildId.value = childId
  ready.value = false
  successMessage.value = ''
  errorMessage.value = ''

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', childId as string)
    .single()

  if (error || !data) {
    errorMessage.value = 'Impossible de charger le profil enfant'
    ready.value = true
    return
  }

  populateForm(data as Profile)
  ready.value = true
}

// ─── Formulaire ───────────────────────────────────────────────────────────────

const originalData = ref<string>('')

const form = ref({
  first_name: '',
  last_name: '',
  gender: '',
  email: '',
  phone: '',
  mobile: '',
  address: '',
  postal_code: '',
  city: '',
  avatar_url: '',
  // Lecture seule
  licence_number: null as number | null,
  licence_type: '',
  club_group: '',
  passport: '',
  birth_date: '',
})

function populateForm(p: Profile) {
  form.value = {
    first_name: p.first_name || '',
    last_name: p.last_name || '',
    gender: p.gender || '',
    email: p.email || '',
    phone: p.phone || '',
    mobile: p.mobile || '',
    address: p.address || '',
    postal_code: p.postal_code || '',
    city: p.city || '',
    avatar_url: p.avatar_url || '',
    licence_number: p.licence_number,
    licence_type: p.licence_type || '',
    club_group: p.club_group || '',
    passport: p.passport || '',
    birth_date: p.birth_date || '',
  }
  originalData.value = editableFieldsJSON()
}

function editableFieldsJSON(): string {
  return JSON.stringify({
    first_name: form.value.first_name,
    last_name: form.value.last_name,
    gender: form.value.gender,
    email: form.value.email,
    phone: form.value.phone,
    mobile: form.value.mobile,
    address: form.value.address,
    postal_code: form.value.postal_code,
    city: form.value.city,
    avatar_url: form.value.avatar_url,
  })
}

// ─── Autocomplétion adresse ──────────────────────────────────────────────────

interface AddressSuggestion {
  id: string
  label: string
  name: string
  postcode: string
  city: string
}

const addressSuggestions = ref<AddressSuggestion[]>([])
const addressLoading = ref(false)
const showSuggestions = ref(false)
let addressDebounceTimer: ReturnType<typeof setTimeout> | null = null

function onAddressInput() {
  if (addressDebounceTimer) clearTimeout(addressDebounceTimer)

  const query = form.value.address.trim()
  if (query.length < 3) {
    addressSuggestions.value = []
    showSuggestions.value = false
    return
  }

  addressDebounceTimer = setTimeout(() => fetchAddressSuggestions(query), 200)
}

async function fetchAddressSuggestions(query: string) {
  addressLoading.value = true
  try {
    const url = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=8&autocomplete=1`
    const response = await fetch(url)
    const data = await response.json()

    addressSuggestions.value = (data.features ?? []).map((f: any): AddressSuggestion => ({
      id: f.properties.id ?? '',
      label: f.properties.label ?? '',
      name: f.properties.name ?? '',
      postcode: f.properties.postcode ?? '',
      city: f.properties.city ?? '',
    }))

    showSuggestions.value = addressSuggestions.value.length > 0
  }
  catch {
    addressSuggestions.value = []
  }
  finally {
    addressLoading.value = false
  }
}

function selectAddress(suggestion: AddressSuggestion) {
  form.value.address = suggestion.name
  form.value.postal_code = suggestion.postcode
  form.value.city = suggestion.city
  addressSuggestions.value = []
  showSuggestions.value = false
}

function hideAddressSuggestions() {
  setTimeout(() => {
    showSuggestions.value = false
  }, 150)
}

// ─── Logique principale ──────────────────────────────────────────────────────

const getUserId = () => {
  // Toujours un string simple, jamais un objet user complet
  return (user.value as any)?.id ?? (user.value as any)?.sub ?? null
}

const initials = computed(() => {
  const name = form.value.first_name || form.value.last_name
    ? `${form.value.first_name} ${form.value.last_name}`.trim()
    : form.value.email || '?'
  return name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
})

const editableFields = computed(() => editableFieldsJSON())
const hasChanges = computed(() => editableFields.value !== originalData.value)

// ─── Chargement initial ──────────────────────────────────────────────────────

onMounted(async () => {
  let attempts = 0
  while (!user.value && attempts < 20) {
    await new Promise(resolve => setTimeout(resolve, 100))
    attempts++
  }

  const uid = getUserId()
  if (!uid) {
    await navigateTo('/login', { query: { redirect: '/profil' } })
    return
  }

  // Charger mon profil
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', uid)
    .single()

  if (profileError || !profileData) {
    errorMessage.value = 'Impossible de charger votre profil'
    ready.value = true
    return
  }

  const p = profileData as Profile
  ownProfileData.value = p
  populateForm(p)

  // Charger mes rôles
  const { data: rolesData } = await supabase
    .from('user_roles')
    .select('role_code')
    .eq('user_id', uid)

  if (rolesData) {
    userRoles.value = rolesData.map((r: any) => r.role_code as RoleCode)
  }

  // Si parent → charger les enfants liés
  if (userRoles.value.includes('parent')) {
    const { data: childrenData } = await supabase
      .from('parent_access')
      .select(`
        id, parent_id, child_id, access_type, created_at,
        child:profiles!child_id (id, first_name, last_name, avatar_url, birth_date)
      `)
      .eq('parent_id', uid)

    if (childrenData) {
      children.value = childrenData as ParentAccessLink[]
    }
  }

  ready.value = true
})

// ─── Sauvegarde ──────────────────────────────────────────────────────────────

async function saveProfile() {
  if (!validate()) return
  // Si enfant, on update le profil enfant. Sinon, le sien.
  const targetId = (editingChildId.value as string) || (getUserId() as string)
  if (!targetId) return

  saving.value = true
  successMessage.value = ''
  errorMessage.value = ''

  try {
    const fullName = `${form.value.first_name} ${form.value.last_name}`.trim()

    const { error } = await supabase
      .from('profiles')
      .update({
        first_name: form.value.first_name || null,
        last_name: form.value.last_name || null,
        full_name: fullName || null,
        gender: form.value.gender || null,
        email: form.value.email,
        phone: form.value.phone || null,
        mobile: form.value.mobile || null,
        address: form.value.address || null,
        postal_code: form.value.postal_code || null,
        city: form.value.city || null,
        avatar_url: form.value.avatar_url || null,
      })
      .eq('id', targetId)

    if (error) throw error

    originalData.value = editableFieldsJSON()

    // Mettre à jour le cache local
    if (isEditingChild.value) {
      const child = children.value.find(c => c.child_id === editingChildId.value)
      if (child?.child) {
        child.child.first_name = form.value.first_name
        child.child.last_name = form.value.last_name
      }
    } else if (ownProfileData.value) {
      ownProfileData.value.first_name = form.value.first_name
      ownProfileData.value.last_name = form.value.last_name
      ownProfileData.value.full_name = fullName
    }

    successMessage.value = 'Profil mis à jour avec succès'
    setTimeout(() => { successMessage.value = '' }, 3000)
  }
  catch (e: any) {
    errorMessage.value = e.message || 'Erreur lors de la sauvegarde'
  }
  finally {
    saving.value = false
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getRoleLabel(role: RoleCode): string {
  const labels: Record<string, string> = {
    admin: 'Administrateur',
    secretary: 'Secrétaire',
    parent: 'Parent',
  }
  return labels[role] || role
}

function getRoleColor(role: RoleCode): string {
  const colors: Record<string, string> = {
    admin: 'error',
    secretary: 'info',
    parent: 'success',
  }
  return colors[role] || 'neutral'
}

function formatDate(date: string): string {
  if (!date) return ''
  try {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }
  catch {
    return date
  }
}
</script>