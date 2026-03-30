<template>
  <UModal
    :open="open"
    :title="action === 'approve' ? 'Accepter la demande' : 'Refuser la demande'"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <div class="space-y-4">
        <!-- Résumé de la demande -->
        <div class="bg-gray-50 rounded-xl p-4">
          <div class="flex items-center gap-2 mb-2">
            <UBadge
              :color="request?.type === 'group' ? 'info' : 'success'"
              variant="soft"
              size="xs"
              class="font-bold"
            >
              {{ request?.type === 'group' ? 'Groupe' : 'Événement' }}
            </UBadge>
            <span class="font-bold text-gray-900">{{ request?.target_name }}</span>
          </div>
          <p class="text-sm text-gray-600">
            Demandeur : <strong>{{ request?.user_name }}</strong>
            <span v-if="request?.enrolled_by_name" class="text-gray-400">
              (inscrit par {{ request.enrolled_by_name }})
            </span>
          </p>
        </div>

        <!-- Note admin -->
        <UFormField :label="action === 'approve' ? 'Message de confirmation (optionnel)' : 'Motif du refus (recommandé)'">
          <UTextarea
            :model-value="note"
            :placeholder="action === 'approve'
              ? 'Ex: Bienvenue dans le groupe ! N\'oubliez pas vos chaussons.'
              : 'Ex: Le groupe est complet, nous vous proposons le créneau du mardi.'"
            :rows="3"
            @update:model-value="emit('update:note', $event)"
          />
        </UFormField>

        <!-- Aperçu email -->
        <div class="border border-gray-200 rounded-xl p-4">
          <div class="flex items-center gap-2 mb-2">
            <UIcon name="i-lucide-mail" class="w-4 h-4 text-gray-400" />
            <span class="text-xs font-bold text-gray-500 uppercase tracking-wide">Aperçu email</span>
            <UBadge color="warning" variant="soft" size="xs">Envoi SMTP à configurer</UBadge>
          </div>
          <p class="text-xs text-gray-500 mb-1">
            À : <strong>{{ request?.user_email }}</strong>
          </p>
          <p class="text-xs text-gray-500 mb-2">
            Objet : <strong>Inscription {{ action === 'approve' ? 'confirmée' : 'refusée' }} — {{ request?.target_name }}</strong>
          </p>
          <div class="text-xs text-gray-600 bg-white rounded-lg p-3 whitespace-pre-line border border-gray-100">{{ emailPreview }}</div>
        </div>
      </div>
    </template>

    <template #footer="{ close }">
      <div class="flex justify-end gap-3">
        <UButton color="neutral" variant="soft" @click="close">Annuler</UButton>
        <UButton
          :color="action === 'approve' ? 'success' : 'error'"
          :loading="processing"
          @click="emit('confirm')"
        >
          <template #leading>
            <UIcon :name="action === 'approve' ? 'i-lucide-check' : 'i-lucide-x'" class="w-4 h-4" />
          </template>
          {{ action === 'approve' ? 'Confirmer l\'inscription' : 'Refuser la demande' }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { EnrollmentRequest } from '~/composables/useEnrollmentRequests'

defineProps<{
  open: boolean
  request: EnrollmentRequest | null
  action: 'approve' | 'reject'
  note: string
  processing: boolean
  emailPreview: string
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'update:note': [value: string]
  'confirm': []
}>()
</script>
