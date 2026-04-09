<template>
  <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mt-8 ">
    <div class="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between items-center">
      <h2 class="text-lg font-bold text-gray-900">Groupes & Créneaux</h2>
      <div class="flex gap-2">
        <UButton
          color="neutral"
          variant="ghost"
          icon="i-lucide-refresh-cw"
          :loading="loading"
          aria-label="Rafraîchir"
          @click="emit('refresh')"
        />
        <UButton
          v-if="!readonly"
          icon="i-lucide-plus"
          size="sm"
          class="bg-[#7FD857] text-[#0F1729] hover:bg-[#6bc546] font-bold"
          @click="emit('open-modal', null)"
        >
          Nouveau groupe
        </UButton>
      </div>
    </div>

    <div v-if="loading" class="p-8 flex justify-center">
      <div class="w-6 h-6 border-2 border-gray-200 border-t-[#7FD857] rounded-full animate-spin" />
    </div>

    <div v-else class="divide-y divide-gray-100 max-h-[70vh] overflow-y-auto" data-testid="groups-list">
      <div
        v-for="group in groups"
        :key="group.id"
        class="p-5 hover:bg-gray-50/50 transition-colors"
        :data-testid="`group-row-${group.id}`"
      >
        <div class="flex flex-col sm:flex-row justify-between gap-4">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-1">
              <h3 class="font-bold text-gray-900">{{ group.name }}</h3>
              <UBadge v-if="group.level" color="info" variant="soft" size="sm">
                {{ group.level }}
              </UBadge>
              <UBadge
                :color="(group._members_count || 0) >= group.max_members ? 'error' : 'success'"
                variant="soft"
                size="sm"
              >
                {{ group._members_count || 0 }} / {{ group.max_members }}
              </UBadge>
              <UBadge v-if="group.price" color="info" variant="soft" size="sm">
                {{ group.price }}€
              </UBadge>
            </div>

            <div class="flex flex-wrap gap-1 mt-2">
              <span
                v-for="sched in group.schedules"
                :key="sched.id"
                class="text-sm bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
              >
                {{ formatSchedule(sched) }}
              </span>
            </div>

            <div class="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
              <span v-if="group.referent">
                Référent : <strong class="text-gray-700">{{ group.referent.full_name }}</strong>
              </span>
              <span v-if="group.instructors?.length">
                Initiateurs :
                <strong class="text-gray-700">
                  {{ group.instructors.map(i => i.profile?.full_name).join(', ') }}
                </strong>
              </span>
            </div>
          </div>

          <div class="flex items-start gap-2">
            <UButton
              icon="i-lucide-users"
              color="neutral"
              variant="soft"
              size="sm"
              :data-testid="`btn-group-members-${group.id}`"
              @click="emit('show-members', group)"
            >
              Membres
            </UButton>
            <UButton
              v-if="!readonly"
              icon="i-lucide-edit"
              color="neutral"
              variant="ghost"
              size="sm"
              :data-testid="`btn-group-edit-${group.id}`"
              @click="emit('open-modal', group)"
            />
            <UButton
              v-if="!readonly"
              icon="i-lucide-trash"
              color="error"
              variant="ghost"
              size="sm"
              :data-testid="`btn-group-delete-${group.id}`"
              @click="emit('delete', group.id)"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Group, GroupSchedule } from '../../types/auth'

defineProps<{
  groups: Group[]
  loading: boolean
  formatSchedule: (sched: GroupSchedule) => string
  readonly?: boolean
}>()

const emit = defineEmits<{
  'open-modal': [group: Group | null]
  'show-members': [group: Group]
  'delete': [groupId: string]
  'refresh': []
}>()
</script>
