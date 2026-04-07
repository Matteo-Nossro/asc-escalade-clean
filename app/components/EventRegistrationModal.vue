<template>
  <UModal v-model:open="open" :ui="{ content: 'rounded-3xl' }">
    <template #content>
      <div class="p-6 md:p-8">
        <!-- En-tête -->
        <div class="flex items-start justify-between mb-6">
          <div>
            <h2 class="text-xl font-bold text-[#0F1729]">S'inscrire à la sortie</h2>
            <p class="text-gray-500 text-sm mt-1">{{ event.title }}</p>
          </div>
          <UButton
            icon="i-heroicons-x-mark"
            color="neutral"
            variant="ghost"
            size="sm"
            @click="open = false"
          />
        </div>

        <!-- Récapitulatif -->
        <div class="bg-gray-50 rounded-2xl p-4 mb-6 space-y-2">
          <div v-if="event.event_date" class="flex justify-between text-sm">
            <span class="text-gray-500">Date</span>
            <span class="font-medium text-[#0F1729]">{{ formatDate(event.event_date) }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-500">Tarif</span>
            <span class="font-bold" :class="event.price > 0 ? 'text-[#7FD857]' : 'text-[#0F1729]'">
              {{ event.price > 0 ? `${event.price}€` : 'Gratuite' }}
            </span>
          </div>
          <div v-if="event.max_participants > 0" class="flex justify-between text-sm">
            <span class="text-gray-500">Places restantes</span>
            <span class="font-medium text-[#0F1729]">
              {{ event.max_participants - event.current_participants }}
            </span>
          </div>
        </div>

        <!-- Formulaire -->
        <form @submit.prevent="submit" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-[#0F1729] mb-1.5">
              Nom complet <span class="text-red-500">*</span>
            </label>
            <UInput
              v-model="form.name"
              placeholder="Jean Dupont"
              size="lg"
              :disabled="loading"
              required
              class="w-full"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-[#0F1729] mb-1.5">
              Email <span class="text-red-500">*</span>
            </label>
            <UInput
              v-model="form.email"
              type="email"
              placeholder="jean@exemple.fr"
              size="lg"
              :disabled="loading"
              required
              class="w-full"
            />
          </div>

          <!-- Message d'erreur -->
          <div
            v-if="registrationError"
            class="flex items-center gap-2 p-3 bg-red-50 rounded-xl text-red-700 text-sm"
          >
            <UIcon name="i-heroicons-exclamation-circle" class="w-5 h-5 flex-shrink-0" />
            {{ registrationError }}
          </div>

          <!-- Bouton de soumission -->
          <UButton
            type="submit"
            size="xl"
            block
            :loading="loading"
            :disabled="loading || !form.name.trim() || !form.email.trim()"
            class="bg-[#7FD857] hover:bg-[#6bc546] text-[#0F1729] font-bold mt-2"
            :icon="event.price > 0 ? 'i-heroicons-credit-card' : 'i-heroicons-check'"
          >
            {{ event.price > 0 ? `Payer ${event.price}€ via HelloAsso` : 'Confirmer l\'inscription' }}
          </UButton>

          <p class="text-xs text-gray-400 text-center">
            Réservé aux membres du club · Vos données sont utilisées uniquement pour la gestion des inscriptions.
          </p>
        </form>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface SupabaseEvent {
  id: string
  title: string | null
  event_date: string | null
  max_participants: number
  current_participants: number
  price: number
  location: string | null
}

const props = defineProps<{
  modelValue: boolean
  event: SupabaseEvent
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

// v-model bridge
const open = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const { loading, error: registrationError, register } = useRegistration()

const form = ref({ name: '', email: '' })

// Réinitialiser le formulaire à l'ouverture
watch(open, (val) => {
  if (val) {
    form.value = { name: '', email: '' }
    registrationError.value = null
  }
})

async function submit() {
  if (!form.value.name.trim() || !form.value.email.trim()) return

  // Validation email simple
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(form.value.email)) {
    registrationError.value = 'Adresse email invalide.'
    return
  }

  try {
    await register({
      eventId: props.event.id,
      name: form.value.name.trim(),
      email: form.value.email.trim(),
      price: props.event.price,
      eventTitle: props.event.title ?? 'Sortie',
      eventDate: props.event.event_date ?? undefined,
    })
    open.value = false
  } catch {
    // L'erreur est déjà dans registrationError via useRegistration
  }
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
</script>
