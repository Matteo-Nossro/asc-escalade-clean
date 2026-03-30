<template>
  <UModal
    :open="open"
    :title="`Membres — ${title}`"
    :ui="{ content: 'w-[calc(100vw-2rem)] sm:w-[60vw] max-w-full' }"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <div v-if="loading" class="flex justify-center py-8">
        <div class="w-6 h-6 border-2 border-gray-200 border-t-[#7FD857] rounded-full animate-spin" />
      </div>

      <div v-else>
        <p class="text-sm text-gray-500 mb-4">
          {{ members.length }} membre(s) inscrit(s)
        </p>

        <div v-if="members.length === 0" class="text-center py-6">
          <UIcon name="i-lucide-users" class="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p class="text-gray-400">Aucun membre dans ce groupe</p>
        </div>

        <div v-else class="space-y-2 max-h-96 overflow-y-auto">
          <div
            v-for="member in members"
            :key="member.id"
            class="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-[#7FD857] flex items-center justify-center text-xs font-bold text-[#0F1729]">
                {{ getInitials(member.profile?.full_name || '') }}
              </div>
              <div>
                <p class="text-sm font-medium text-gray-900">{{ member.profile?.full_name || 'Inconnu' }}</p>
                <p class="text-xs text-gray-400">
                  Inscrit le {{ formatDate(member.enrolled_at) }}
                  <span v-if="member.enrolled_by"> · par un parent</span>
                </p>
              </div>
            </div>
            <UButton
              icon="i-lucide-user-minus"
              color="error"
              variant="ghost"
              size="xs"
              :loading="removingMemberId === member.id"
              @click="emit('remove-member', member.id)"
            />
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end">
        <UButton color="neutral" variant="soft" @click="emit('update:open', false)">Fermer</UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { GroupMember } from '~/types/auth'

defineProps<{
  open: boolean
  title: string
  members: GroupMember[]
  loading: boolean
  removingMemberId: string | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'remove-member': [memberId: string]
}>()

function getInitials(name: string): string {
  if (!name) return '?'
  return name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'short', year: 'numeric',
    })
  } catch { return dateStr }
}
</script>
