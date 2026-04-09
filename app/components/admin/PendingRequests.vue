<template>
  <div
    class="bg-white rounded-xl shadow-sm border border-orange-200 overflow-hidden mb-8"
    data-testid="section-pending-requests"
  >
    <div class="p-4 border-b border-orange-100 bg-orange-50/50 flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
      <h2 class="text-lg font-bold text-gray-900 flex items-center gap-2 shrink-0">
        <UIcon name="i-lucide-bell-ring" class="w-5 h-5 text-orange-500" />
        Demandes d'inscription
        <UBadge v-if="requests.length > 0" color="warning" variant="solid" size="sm" class="font-bold">
          {{ filteredRequests.length }}<template v-if="groupFilter.length > 0">/{{ requests.length }}</template>
        </UBadge>
      </h2>
      <div class="flex items-center gap-2 w-full sm:w-auto">
        <USelectMenu
          v-model="groupFilter"
          :items="groupFilterOptions"
          multiple
          placeholder="Tous les groupes"
          class="flex-1 sm:w-52"
          size="sm"
        />
        <UButton
          color="neutral"
          variant="ghost"
          icon="i-lucide-refresh-cw"
          :loading="loading"
          aria-label="Rafraîchir"
          @click="emit('refresh')"
        />
      </div>
    </div>

    <div v-if="filteredRequests.length === 0" class="p-6 text-center text-sm text-gray-400">
      {{ requests.length === 0 ? 'Aucune demande en attente' : 'Aucune demande pour ces groupes' }}
    </div>

    <div v-else class="divide-y divide-gray-100 max-h-[70vh] overflow-y-auto">
      <div
        v-for="request in filteredRequests"
        :key="request.id"
        class="p-5 hover:bg-gray-50/50 transition-colors"
      >
        <div class="flex flex-col sm:flex-row justify-between gap-4">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-1">
              <UBadge
                :color="request.type === 'group' ? 'info' : 'success'"
                variant="soft"
                size="xs"
                class="font-bold"
              >
                {{ request.type === 'group' ? 'Groupe' : 'Événement' }}
              </UBadge>
              <h3 class="font-bold text-gray-900">{{ request.target_name }}</h3>
            </div>

            <p v-if="request.target_detail" class="text-sm text-gray-500">
              {{ request.target_detail }}
            </p>

            <div class="flex items-center gap-2 mt-2">
              <div class="w-6 h-6 rounded-md bg-[#7FD857] flex items-center justify-center text-xs font-bold text-[#0F1729]">
                {{ request.user_name.split(' ').map(w => w[0]).join('').slice(0, 2) }}
              </div>
              <span class="text-sm text-gray-700">{{ request.user_name }}</span>
              <span class="text-xs text-gray-400">{{ request.user_email }}</span>
              <UBadge v-if="request.enrolled_by_name" color="neutral" variant="soft" size="xs">
                par {{ request.enrolled_by_name }}
              </UBadge>
            </div>

            <p class="text-xs text-gray-400 mt-1">
              Demande le {{ formatDate(request.created_at) }}
            </p>
          </div>

          <div v-if="!readonly" class="flex items-start gap-2">
            <UButton
              icon="i-lucide-check"
              color="success"
              variant="soft"
              size="sm"
              :loading="processingRequestId === request.id"
              :data-testid="`btn-approve-${request.id}`"
              @click="emit('open-review', request, 'approve')"
            >
              Accepter
            </UButton>
            <UButton
              icon="i-lucide-x"
              color="error"
              variant="soft"
              size="sm"
              :loading="processingRequestId === request.id"
              :data-testid="`btn-reject-${request.id}`"
              @click="emit('open-review', request, 'reject')"
            >
              Refuser
            </UButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { EnrollmentRequest } from '~/composables/useEnrollmentRequests'

const props = defineProps<{
  requests: EnrollmentRequest[]
  processingRequestId: string | null
  loading?: boolean
  readonly?: boolean
}>()

const emit = defineEmits<{
  'open-review': [request: EnrollmentRequest, action: 'approve' | 'reject']
  'refresh': []
}>()

const groupFilter = ref<{ label: string; value: string }[]>([])

const groupFilterOptions = computed(() => {
  const seen = new Set<string>()
  const groups: { label: string; value: string }[] = []
  for (const r of props.requests) {
    if (r.type === 'group' && !seen.has(r.target_id)) {
      seen.add(r.target_id)
      groups.push({ label: r.target_name, value: r.target_id })
    }
  }
  return groups
})

const filteredRequests = computed(() => {
  if (groupFilter.value.length === 0) return props.requests
  const ids = new Set(groupFilter.value.map(o => o.value))
  return props.requests.filter(r => r.type === 'group' && ids.has(r.target_id))
})

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch { return dateStr }
}
</script>
