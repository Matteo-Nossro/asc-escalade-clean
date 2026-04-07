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

        <UFormField label="Email" required :error="errors.email">
          <UInput v-model="form.email" type="email" placeholder="email@exemple.com" class="w-full" data-testid="input-member-email" />
        </UFormField>

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

        <!-- Lien parent → enfants -->
        <div v-if="form.roles.includes('parent')" class="space-y-3">
          <UFormField label="Enfants liés">
            <div class="space-y-2">
              <div
                v-for="child in form.linkedChildren"
                :key="child.id"
                class="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2"
              >
                <span class="text-sm font-medium text-gray-700">{{ child.name }}</span>
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
            <USelect
              :model-value="childToLink"
              :items="linkableChildren"
              placeholder="Sélectionner un enfant…"
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
import { ref } from 'vue'

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
    formule: string
    creneau: string
    status: 'Actif' | 'Inactif' | 'En attente'
    roles: string[]
    groupIds: string[]
    linkedChildren: { id: string; name: string; linkId: string }[]
  }
  saving: boolean
  licenceTypeOptions: { label: string; value: string }[]
  groupSelectOptions: { label: string; value: string | null }[]
  availableRoles: { code: string; label: string }[]
  linkableChildren: { label: string; value: string }[]
  childToLink: string | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'save': []
  'update:childToLink': [value: string | null]
  'add-child': []
  'remove-child': [childId: string]
}>()

const errors = ref({ first_name: '', last_name: '', email: '', licence: '' })

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
  if (!props.form.email.trim()) {
    errors.value.email = "L'email est requis"
    valid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(props.form.email)) {
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
</script>
