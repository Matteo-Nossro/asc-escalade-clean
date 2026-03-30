<template>
  <UModal
    :open="open"
    :title="editMode ? 'Modifier un adhérent' : 'Ajouter un adhérent'"
    :ui="{ content: 'w-[calc(100vw-2rem)] sm:w-[60vw] max-w-full' }"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <form @submit.prevent="emit('save')" class="space-y-4 w-full">
        <div class="grid grid-cols-2 gap-4">
          <UFormField label="Prénom" required>
            <UInput v-model="form.first_name" placeholder="Marie" required class="w-full" />
          </UFormField>
          <UFormField label="Nom" required>
            <UInput v-model="form.last_name" placeholder="Dupont" required class="w-full" />
          </UFormField>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <UFormField label="N° Licence FFME">
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

        <UFormField label="Email" required>
          <UInput v-model="form.email" type="email" placeholder="email@exemple.com" required class="w-full" />
        </UFormField>

        <div class="grid grid-cols-2 gap-4">
          <UFormField label="Type de licence">
            <USelect v-model="form.formule" :items="licenceTypeOptions" class="w-full" />
          </UFormField>
          <UFormField label="Groupe">
            <USelect v-model="form.groupId" :items="groupSelectOptions" class="w-full" />
          </UFormField>
        </div>

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
        <div v-if="form.roles.includes('parent') && editMode" class="space-y-3">
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
          @click="emit('save')"
        >
          {{ editMode ? 'Mettre à jour' : 'Enregistrer' }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
defineProps<{
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
    groupId: string | null
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

function getRoleBadgeColor(role: string): string {
  return ({ admin: 'error', secretary: 'info', parent: 'success' } as Record<string, string>)[role] || 'neutral'
}
</script>
