<template>
  <UModal
    :open="open"
    :title="editMode ? 'Modifier un adhérent' : 'Ajouter un adhérent'"
    :ui="{ content: 'w-[calc(100vw-2rem)] sm:w-[60vw] max-w-full' }"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <form @submit.prevent="handleSave" class="space-y-4 w-full">
        <div class="grid grid-cols-2 gap-4">
          <UFormField label="Prénom" required :error="errors.first_name">
            <UInput v-model="form.first_name" placeholder="Marie" class="w-full" data-testid="input-member-firstname" />
          </UFormField>
          <UFormField label="Nom" required :error="errors.last_name">
            <UInput v-model="form.last_name" placeholder="Dupont" class="w-full" data-testid="input-member-lastname" />
          </UFormField>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <UFormField label="N° Licence FFME" :error="errors.licence">
            <UInput v-model="form.licence" placeholder="Ex: 12345678" class="w-full" />
          </UFormField>
          <UFormField label="Statut" required>
            <USelect
              v-model="form.status"
              :items="['Actif', 'Inactif', 'En attente']"
              class="w-full"
            />
          </UFormField>
        </div>

        <UFormField label="Email" :error="errors.email">
          <UInput v-model="form.email" type="email" placeholder="email@exemple.com" class="w-full" data-testid="input-member-email" />
        </UFormField>

        <div class="grid grid-cols-2 gap-4">
          <UFormField label="Téléphone">
            <UInput v-model="form.phone" type="tel" placeholder="Ex: 03 80 00 00 00" class="w-full" />
          </UFormField>
          <UFormField label="Mobile">
            <UInput v-model="form.mobile" type="tel" placeholder="Ex: 06 00 00 00 00" class="w-full" />
          </UFormField>
        </div>

        <!-- Parent(s) — lecture seule, modification seulement -->
        <UFormField v-if="editMode && linkedParents.length > 0" label="Parent(s)">
          <div class="flex flex-wrap gap-2 pt-1">
            <div
              v-for="parent in linkedParents"
              :key="parent.id"
              class="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200"
            >
              <UIcon name="i-heroicons-user" class="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div>
                <div class="text-sm font-medium text-gray-700">{{ parent.name }}<template v-if="parent.birth_date"> — {{ formatBirthDate(parent.birth_date) }}</template></div>
                <div v-if="parent.phone || parent.mobile" class="text-xs text-gray-500 mt-0.5 flex gap-3">
                  <span v-if="parent.phone"><UIcon name="i-heroicons-phone" class="w-3 h-3 inline mr-0.5" />{{ parent.phone }}</span>
                  <span v-if="parent.mobile"><UIcon name="i-heroicons-device-phone-mobile" class="w-3 h-3 inline mr-0.5" />{{ parent.mobile }}</span>
                </div>
              </div>
            </div>
          </div>
        </UFormField>

        <div class="grid grid-cols-2 gap-4">
          <UFormField label="Date de naissance">
            <UInput v-model="form.birth_date" type="date" class="w-full" />
          </UFormField>
          <UFormField label="Âge">
            <div class="flex items-center pt-1">
              <span v-if="computedAge !== null" class="text-sm font-medium text-gray-700">{{ computedAge }} ans</span>
              <span v-else class="text-sm text-gray-400">—</span>
            </div>
          </UFormField>
        </div>

        <UFormField label="Type de licence">
          <USelect v-model="form.formule" :items="licenceTypeOptions" class="w-full" />
        </UFormField>

        <!-- Groupes (multi-sélection) -->
        <UFormField label="Groupe(s)">
          <div class="flex flex-wrap gap-2">
            <label
              v-for="group in groupSelectOptions"
              :key="group.value ?? '__none__'"
              class="flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors"
              :class="group.value !== null && form.groupIds.includes(group.value)
                ? 'border-[#7FD857] bg-[#7FD857]/10'
                : 'border-gray-200 hover:border-gray-300'"
            >
              <input
                v-if="group.value"
                type="checkbox"
                :value="group.value"
                v-model="form.groupIds"
                class="sr-only"
              />
              <span class="text-sm font-medium text-gray-700">{{ group.label }}</span>
            </label>
          </div>
          <p v-if="groupSelectOptions.filter(g => g.value).length === 0" class="text-xs text-gray-400 mt-1">
            Aucun groupe disponible
          </p>
        </UFormField>

        <!-- Rôles -->
        <UFormField label="Rôles">
          <div class="flex flex-wrap gap-2">
            <label
              v-for="role in availableRoles"
              :key="role.code"
              class="flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors"
              :class="form.roles.includes(role.code)
                ? 'border-[#7FD857] bg-[#7FD857]/10'
                : 'border-gray-200 hover:border-gray-300'"
            >
              <input type="checkbox" :value="role.code" v-model="form.roles" class="sr-only" />
              <UBadge :color="getRoleBadgeColor(role.code)" variant="soft" size="xs" class="font-bold">
                {{ role.label }}
              </UBadge>
            </label>
          </div>
        </UFormField>

        <!-- ── Champs administratifs ─────────────────────────────────────── -->
        <div class="border-t border-gray-100 pt-4">
          <p class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Suivi administratif</p>

          <!-- Ligne 1 : Paiement + Formulaire d'inscription -->
          <div class="grid grid-cols-2 gap-4 mb-4">
            <UFormField label="Paiement reçu">
              <div class="flex items-center gap-3 pt-1">
                <USwitch  v-model="form.payment_done" />
                <span class="text-sm text-gray-700">{{ form.payment_done ? 'Oui' : 'Non' }}</span>
              </div>
            </UFormField>
            <UFormField label="Formulaire d'inscription">
              <div class="flex items-center gap-3 pt-1">
                <USwitch  v-model="form.registration_form" />
                <span class="text-sm text-gray-700">{{ form.registration_form ? 'Oui' : 'Non' }}</span>
              </div>
            </UFormField>
          </div>

          <!-- Ligne 2 : Certificat médical + Assurance FFME -->
          <div class="grid grid-cols-2 gap-4 mb-4">
            <UFormField label="Certificat médical">
              <USelect
                v-model="form.medical_certificate"
                :items="medicalCertificateOptions"
                placeholder="Sélectionner…"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Assurance FFME">
              <USelect
                v-model="form.ffme_insurance"
                :items="ffmeInsuranceOptions"
                placeholder="Sélectionner…"
                class="w-full"
              />
            </UFormField>
          </div>

          <!-- Ligne 3 : Catégorie + T-shirt -->
          <div class="grid grid-cols-2 gap-4 mb-4">
            <UFormField label="Catégorie">
              <UInput v-model="form.category" placeholder="Ex: Adulte, U17, U14…" class="w-full" />
            </UFormField>
            <UFormField label="T-shirt">
              <UInput v-model="form.tshirt" placeholder="Ex: M, L, XL…" class="w-full" />
            </UFormField>
          </div>

          <!-- Notes -->
          <UFormField label="Notes / Observations">
            <UTextarea v-model="form.notes" placeholder="Observations libres…" class="w-full" :rows="3" />
          </UFormField>
        </div>

        <!-- Lien parent → enfants -->
        <div v-if="form.roles.includes('parent')" class="space-y-3">
          <UFormField label="Enfants liés">
            <div class="space-y-2">
              <div
                v-for="child in form.linkedChildren"
                :key="child.id"
                class="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2"
              >
                <div>
                  <span class="text-sm font-medium text-gray-700">{{ child.name }}</span>
                  <span v-if="child.birth_date" class="text-xs text-gray-400 ml-1">({{ formatBirthDate(child.birth_date) }})</span>
                </div>
                <UButton
                  icon="i-lucide-x"
                  color="error"
                  variant="ghost"
                  size="xs"
                  @click="emit('remove-child', child.id)"
                />
              </div>
              <p v-if="form.linkedChildren.length === 0" class="text-xs text-gray-400">
                Aucun enfant lié
              </p>
            </div>
          </UFormField>

          <div class="flex gap-2">
            <USelectMenu
              :model-value="childToLink"
              :items="linkableChildren"
              placeholder="Sélectionner un enfant…"
              searchable
              search-placeholder="Rechercher…"
              class="flex-1"
              size="sm"
              @update:model-value="emit('update:childToLink', $event)"
            />
            <UButton
              icon="i-lucide-plus"
              size="sm"
              variant="soft"
              :disabled="!childToLink"
              @click="emit('add-child')"
            >
              Lier
            </UButton>
          </div>
        </div>
      </form>
    </template>

    <template #footer>
      <div class="flex justify-end gap-3">
        <UButton color="neutral" variant="soft" @click="emit('update:open', false)">
          Annuler
        </UButton>
        <UButton
          color="primary"
          class="bg-[#7FD857] text-[#0F1729] hover:bg-[#6bc546]"
          :loading="saving"
          data-testid="btn-member-submit"
          @click="handleSave"
        >
          {{ editMode ? 'Mettre à jour' : 'Enregistrer' }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useGroups } from '../../../composables/useGroups'

const props = defineProps<{
  open: boolean
  editMode: boolean
  form: {
    id: string
    first_name: string
    last_name: string
    name: string
    licence: string
    email: string
    phone: string
    mobile: string
    formule: string
    creneau: string
    status: 'Actif' | 'Inactif' | 'En attente'
    roles: string[]
    groupIds: string[]
    linkedChildren: { id: string; name: string; linkId: string; birth_date?: string | null }[]
    birth_date: string | null
    payment_done: boolean
    medical_certificate: string | null
    registration_form: boolean
    ffme_insurance: string | null
    category: string
    tshirt: string
    notes: string
  }
  saving: boolean
  licenceTypeOptions: { label: string; value: string }[]
  groupSelectOptions: { label: string; value: string | null }[]
  availableRoles: { code: string; label: string }[]
  linkableChildren: { label: string; value: string }[]
  childToLink: string | null
  linkedParents: { id: string; name: string; birth_date?: string | null; phone?: string | null; mobile?: string | null }[]
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'save': []
  'update:childToLink': [value: string | null]
  'add-child': []
  'remove-child': [childId: string]
}>()

const { fetchPreviousYearEnrollments, formatSchedule } = useGroups()

const prevYear = new Date().getFullYear() - 1
const prevYearEnrollments = ref<any[]>([])
const prevYearLoading = ref(false)

onMounted(async () => {
  if (props.editMode && props.form.id) {
    prevYearLoading.value = true
    try {
      prevYearEnrollments.value = await fetchPreviousYearEnrollments(props.form.id)
    } catch {
      // silently fail
    } finally {
      prevYearLoading.value = false
    }
  }
})

const errors = ref({ first_name: '', last_name: '', email: '', licence: '' })

const medicalCertificateOptions = [
  { label: 'Non fourni', value: 'non' },
  { label: 'Fiche attestation', value: 'fiche_attestation' },
  { label: 'Certificat médical', value: 'certificat_medical' },
]

const ffmeInsuranceOptions = [
  { label: 'Non', value: 'non' },
  { label: 'Certificat de renouvellement', value: 'certificat_renouvellement' },
  { label: 'Mail de renouvellement', value: 'mail_renouvellement' },
]

const computedAge = computed(() => {
  if (!props.form.birth_date) return null
  const today = new Date()
  const birth = new Date(props.form.birth_date)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
})

function handleSave() {
  errors.value = { first_name: '', last_name: '', email: '', licence: '' }
  let valid = true
  if (!props.form.first_name.trim()) {
    errors.value.first_name = 'Le prénom est requis'
    valid = false
  }
  if (!props.form.last_name.trim()) {
    errors.value.last_name = 'Le nom est requis'
    valid = false
  }
  if (props.form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(props.form.email)) {
    errors.value.email = "Format d'email invalide"
    valid = false
  }
  if (props.form.licence && !/^\d{6,10}$/.test(props.form.licence.trim())) {
    errors.value.licence = 'Numéro de licence invalide (6 à 10 chiffres)'
    valid = false
  }
  if (!valid) return
  emit('save')
}

function getRoleBadgeColor(role: string): string {
  return ({ admin: 'error', secretary: 'info', parent: 'success' } as Record<string, string>)[role] || 'neutral'
}

function formatBirthDate(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}
</script>
