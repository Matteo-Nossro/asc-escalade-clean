<template>
  <UModal
    :open="open"
    :title="editingGroup ? 'Modifier le groupe' : 'Nouveau groupe'"
    :ui="{ content: 'w-[calc(100vw-2rem)] sm:w-[60vw] max-w-full' }"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <div class="space-y-4">
        <UFormField label="Nom du groupe" required :error="errors.name">
          <UInput v-model="groupForm.name" placeholder="Ex: Adultes Autonomes" class="w-full" data-testid="input-group-name" />
        </UFormField>

        <div class="grid grid-cols-2 gap-4">
          <UFormField label="Effectif max" required :error="errors.max_members">
            <UInput v-model.number="groupForm.max_members" type="number" min="1" class="w-full" />
          </UFormField>
          <UFormField label="Niveau">
            <USelect
              v-model="groupForm.level"
              :items="['Débutant', 'Intermédiaire', 'Confirmé', 'Compétition', 'Tous niveaux']"
              placeholder="Sélectionner un niveau…"
              class="w-full"
            />
          </UFormField>
        </div>

        <UFormField label="Description">
          <UInput v-model="groupForm.description" placeholder="Description du groupe" class="w-full" />
        </UFormField>

        <!-- Référent -->
        <UFormField label="Référent">
          <USelectMenu
            :model-value="memberSelectOptions.find(o => o.value === groupForm.referent_id) ?? null"
            :items="memberSelectOptions"
            placeholder="Aucun référent"
            :search-input="{ placeholder: 'Rechercher un membre…' }"
            class="w-full"
            @update:model-value="groupForm.referent_id = $event?.value ?? null"
          />
        </UFormField>

        <!-- Initiateurs -->
        <UFormField label="Initiateurs">
          <div class="flex flex-wrap gap-1 mb-2">
            <UBadge
              v-for="uid in groupForm.instructor_ids"
              :key="uid"
              color="info"
              variant="soft"
              size="sm"
              class="font-bold cursor-pointer"
              @click="emit('remove-instructor', uid)"
            >
              {{ getMemberName(uid) }} ×
            </UBadge>
          </div>
          <div class="flex gap-2">
            <USelectMenu
              :model-value="availableInstructorOptions.find(o => o.value === instructorToAdd) ?? null"
              :items="availableInstructorOptions"
              placeholder="Ajouter un initiateur…"
              :search-input="{ placeholder: 'Rechercher un membre…' }"
              class="flex-1"
              size="sm"
              @update:model-value="emit('update:instructorToAdd', $event?.value ?? null)"
            />
            <UButton
              icon="i-lucide-plus"
              size="sm"
              variant="soft"
              :disabled="!instructorToAdd"
              @click="emit('add-instructor')"
            >
              Ajouter
            </UButton>
          </div>
        </UFormField>

        <!-- Créneaux -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="text-sm font-medium text-gray-700">Créneaux horaires</label>
            <UButton icon="i-lucide-plus" size="xs" variant="soft" @click="emit('add-schedule')">
              Ajouter
            </UButton>
          </div>
          <div class="space-y-2">
            <div
              v-for="(sched, index) in groupForm.schedules"
              :key="index"
              class="flex items-center gap-2 bg-gray-50 rounded-lg p-2"
            >
              <USelect
                v-model.number="sched.day_of_week"
                :items="dayOptions"
                class="w-32"
                size="sm"
              />
              <UInput v-model="sched.start_time" type="time" size="sm" class="w-28" />
              <span class="text-gray-400 text-sm">→</span>
              <UInput v-model="sched.end_time" type="time" size="sm" class="w-28" />
              <UButton
                icon="i-lucide-x"
                color="error"
                variant="ghost"
                size="xs"
                @click="emit('remove-schedule', index)"
              />
            </div>
            <p v-if="groupForm.schedules.length === 0" class="text-sm text-gray-400 text-center py-2">
              Aucun créneau défini
            </p>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-3">
        <UButton color="neutral" variant="soft" @click="emit('update:open', false)">Annuler</UButton>
        <UButton
          class="bg-[#7FD857] text-[#0F1729] hover:bg-[#6bc546]"
          :loading="savingGroup"
          data-testid="btn-group-submit"
          @click="handleSave"
        >
          {{ editingGroup ? 'Mettre à jour' : 'Créer' }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Group } from '~/types/auth'

const props = defineProps<{
  open: boolean
  editingGroup: Group | null
  groupForm: {
    name: string
    max_members: number
    level: string | null
    description: string
    referent_id: string | null
    instructor_ids: string[]
    schedules: { day_of_week: number; start_time: string; end_time: string }[]
  }
  savingGroup: boolean
  memberSelectOptions: { label: string; value: string | null }[]
  availableInstructorOptions: { label: string; value: string | null }[]
  instructorToAdd: string | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'save': []
  'update:instructorToAdd': [value: string | null]
  'add-instructor': []
  'remove-instructor': [uid: string]
  'add-schedule': []
  'remove-schedule': [index: number]
}>()

const errors = ref({ name: '', max_members: '' })

function handleSave() {
  errors.value = { name: '', max_members: '' }
  let valid = true
  if (!props.groupForm.name.trim()) {
    errors.value.name = 'Le nom du groupe est requis'
    valid = false
  }
  if (!props.groupForm.max_members || props.groupForm.max_members < 1) {
    errors.value.max_members = "L'effectif max doit être supérieur à 0"
    valid = false
  }
  if (!valid) return
  emit('save')
}

const dayOptions = [
  { label: 'Lundi', value: 1 },
  { label: 'Mardi', value: 2 },
  { label: 'Mercredi', value: 3 },
  { label: 'Jeudi', value: 4 },
  { label: 'Vendredi', value: 5 },
  { label: 'Samedi', value: 6 },
  { label: 'Dimanche', value: 7 },
]

function getMemberName(uid: string): string {
  return props.memberSelectOptions.find(o => o.value === uid)?.label || 'Inconnu'
}
</script>
