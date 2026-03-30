<template>
  <div
    v-if="requests.length > 0"
    class="bg-white rounded-xl shadow-sm border border-orange-200 overflow-hidden mb-8"
  >
    <div class="p-4 border-b border-orange-100 bg-orange-50/50 flex justify-between items-center">
      <h2 class="text-lg font-bold text-gray-900 flex items-center gap-2">
        <UIcon name="i-lucide-bell-ring" class="w-5 h-5 text-orange-500" />
        Demandes d'inscription
        <UBadge color="warning" variant="solid" size="sm" class="font-bold">
          {{ requests.length }}
        </UBadge>
      </h2>
    </div>

    <div class="divide-y divide-gray-100">
      <div
        v-for="request in requests"
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
                {{ request.user_name.split(' ').map((w: string) => w[0]).join('').slice(0, 2) }}
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

          <div class="flex items-start gap-2">
            <UButton
              icon="i-lucide-check"
              color="success"
              variant="soft"
              size="sm"
              :loading="processingRequestId === request.id"
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
import type { EnrollmentRequest } from '~/composables/useEnrollmentRequests'

defineProps<{
  requests: EnrollmentRequest[]
  processingRequestId: string | null
}>()

const emit = defineEmits<{
  'open-review': [request: EnrollmentRequest, action: 'approve' | 'reject']
}>()

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch { return dateStr }
}
</script>
