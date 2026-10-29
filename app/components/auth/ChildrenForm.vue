<template>
  <div class="space-y-6">
    <!-- Cartes enfants déjà ajoutés -->
    <div v-if="model.length > 0" class="space-y-3">
      <div
        v-for="(child, i) in model"
        :key="i"
        data-testid="child-card"
        class="bg-white rounded-2xl shadow p-4 border border-gray-100 flex items-center justify-between gap-4"
      >
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-vp-green/10 flex items-center justify-center font-bold text-vp-green text-sm shrink-0">
            {{ getChildInitials(child) }}
          </div>
          <div>
            <p class="font-semibold text-gray-900">{{ child.first_name }} {{ child.last_name }}</p>
            <p class="text-xs text-gray-500">{{ formatDate(child.birth_date) }}</p>
          </div>
        </div>
        <UButton icon="i-lucide-trash-2" color="error" variant="ghost" size="sm" data-testid="btn-remove-child" @click="removeChild(i)" />
      </div>
    </div>

    <!-- Formulaire ajout enfant -->
    <div class="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
      <h3 class="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
        <UIcon name="i-lucide-user-plus" class="w-5 h-5 text-vp-green" />
        Ajouter un enfant
      </h3>
      <div class="space-y-5">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UFormField label="Prénom" :error="childErrors.first_name">
            <UInput v-model="childForm.first_name" data-testid="input-child-first-name" placeholder="Marie" icon="i-lucide-user" size="lg" class="w-full" />
          </UFormField>
          <UFormField label="Nom" :error="childErrors.last_name">
            <UInput v-model="childForm.last_name" data-testid="input-child-last-name" placeholder="Dupont" icon="i-lucide-user" size="lg" class="w-full" />
          </UFormField>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UFormField label="Date de naissance" required :error="childErrors.birth_date">
            <UInput
              v-model="childForm.birth_date"
              data-testid="input-child-birth-date"
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
              data-testid="select-child-gender"
              class="w-full h-[46px] px-3 rounded-lg border text-sm text-gray-900 cursor-pointer focus:outline-none focus:ring-2 focus:ring-vp-green focus:border-transparent transition-all"
              :class="childErrors.gender ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white'"
            >
              <option value="">Sélectionner…</option>
              <option value="Homme">Garçon</option>
              <option value="Femme">Fille</option>
            </select>
          </UFormField>
        </div>

        <div class="space-y-3">
          <UCheckbox v-model="childForm.sameAddress" data-testid="check-child-same-address" label="Même adresse que le parent" />
          <template v-if="!childForm.sameAddress">
            <UFormField label="Adresse">
              <UInput v-model="childForm.address" data-testid="input-child-address" placeholder="12 rue de l'Escalade" icon="i-lucide-home" size="lg" class="w-full" />
            </UFormField>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <UFormField label="Code postal">
                <UInput v-model="childForm.postal_code" data-testid="input-child-postal-code" placeholder="21000" icon="i-lucide-hash" size="lg" class="w-full" />
              </UFormField>
              <UFormField label="Ville">
                <UInput v-model="childForm.city" data-testid="input-child-city" placeholder="Dijon" icon="i-lucide-building-2" size="lg" class="w-full" />
              </UFormField>
            </div>
          </template>
          <template v-else>
            <div class="px-4 py-3 bg-gray-50 rounded-xl text-sm text-gray-600 flex items-center gap-2">
              <UIcon name="i-lucide-map-pin" class="w-4 h-4 text-gray-400 shrink-0" />
              <span>{{ [parentAddress.address, parentAddress.postal_code, parentAddress.city].filter(Boolean).join(', ') || 'Adresse du parent' }}</span>
            </div>
          </template>
        </div>

        <UButton variant="soft" size="lg" class="w-full" icon="i-lucide-plus" type="button" data-testid="btn-add-child" @click="() => { addChild() }">
          Ajouter cet enfant
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { emptyChild, emptyChildErrors, formatDate, getChildInitials, hasErrors, todayIso, validateChild } from '~/utils/profileForm'
import type { ChildData, ChildErrors } from '~/utils/profileForm'

const props = defineProps<{
  parentAddress: { address: string, postal_code: string, city: string }
}>()
const model = defineModel<ChildData[]>({ required: true })

const today = computed(() => todayIso())
// Saisie en cours et erreurs : état remonté à la page (survit au démontage du composant entre deux étapes)
const childForm = defineModel<ChildData>('draft', { required: true })
const childErrors = defineModel<ChildErrors>('draftErrors', { required: true })

watch(() => childForm.value.sameAddress, (checked) => {
  if (checked) {
    childForm.value.address = props.parentAddress.address
    childForm.value.postal_code = props.parentAddress.postal_code
    childForm.value.city = props.parentAddress.city
  }
  else {
    childForm.value.address = ''
    childForm.value.postal_code = ''
    childForm.value.city = ''
  }
})

function addChild(): boolean {
  const errs = validateChild(childForm.value)
  childErrors.value = errs
  if (hasErrors(errs)) return false
  const cf = childForm.value
  const same = cf.sameAddress
  model.value = [
    ...model.value,
    {
      first_name: cf.first_name,
      last_name: cf.last_name,
      birth_date: cf.birth_date,
      gender: cf.gender,
      address: same ? props.parentAddress.address : cf.address,
      postal_code: same ? props.parentAddress.postal_code : cf.postal_code,
      city: same ? props.parentAddress.city : cf.city,
      sameAddress: same,
    },
  ]
  childForm.value = emptyChild()
  childErrors.value = emptyChildErrors()
  return true
}

function removeChild(index: number) {
  model.value = model.value.filter((_, i) => i !== index)
}

/**
 * Ajoute l'enfant en cours de saisie s'il est complet. À appeler avant l'envoi.
 * Renvoie `ok: false` + un message si la saisie est incomplète ou erronée.
 */
function flushPending(): { ok: boolean, error?: string } {
  const cf = childForm.value
  const hasRequired = cf.first_name.trim() && cf.last_name.trim() && cf.birth_date
  const hasAny = cf.first_name.trim() || cf.last_name.trim() || cf.birth_date || cf.address.trim()

  if (hasRequired) {
    if (!addChild()) {
      return { ok: false, error: 'Le dernier enfant saisi comporte une erreur. Corrigez le champ signalé ou videz le formulaire avant de terminer.' }
    }
  }
  else if (hasAny) {
    return { ok: false, error: 'Le formulaire enfant est incomplet. Complétez le prénom, le nom et la date de naissance, ou videz-le avant de terminer.' }
  }
  return { ok: true }
}

defineExpose({ flushPending })
</script>
