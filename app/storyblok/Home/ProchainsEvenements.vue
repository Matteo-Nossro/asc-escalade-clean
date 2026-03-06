<template>
  <section v-editable="blok" class="py-20 bg-white relative overflow-hidden">
    <!-- Fond décoratif -->
    <div class="absolute top-0 right-0 w-[800px] h-[800px] bg-gray-50 rounded-full blur-3xl opacity-50 -mr-96 -mt-40 pointer-events-none"></div>

    <UContainer class="relative z-10">
      <!-- Titre -->
      <div class="flex items-center gap-3 mb-12">
        <UIcon name="i-heroicons-calendar-days" class="w-8 h-8 text-[#7FD857]" />
        <h2 class="text-3xl font-bold text-[#0F1729]">
          {{ blok.title }}
        </h2>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-12">

        <!-- Liste des événements (Gauche) -->
        <div class="lg:col-span-7 flex flex-col gap-4">

          <!-- Message aucun événement -->
          <div
            v-if="selectedDateEvents.length === 0"
            class="p-8 text-center text-gray-500 bg-gray-50 rounded-xl border border-gray-100 shadow-sm"
          >
            <UIcon name="i-heroicons-calendar" class="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Aucun événement prévu pour cette date.</p>
          </div>

          <!-- Carte Événement -->
          <div
            v-for="event in selectedDateEvents"
            :key="event.id"
            class="group bg-white border border-gray-100 rounded-xl p-5 flex items-center gap-6 shadow-md hover:shadow-xl hover:border-[#7FD857]/30 hover:-translate-y-1 transition-all duration-300 cursor-pointer"
          >
            <!-- Date Box -->
            <div class="flex flex-col items-center justify-center bg-gray-50 rounded-lg w-20 h-20 shrink-0 group-hover:bg-[#7FD857]/10 transition-colors">
              <span class="text-2xl font-bold text-[#0F1729]">{{ new Date(event.date).getDate() }}</span>
              <span class="text-xs font-bold text-gray-500 uppercase tracking-wider">{{ getMonthShort(event.date) }}</span>
            </div>

            <!-- Infos -->
            <div class="flex-1 flex flex-col gap-2">
              <div class="flex items-center gap-3">
                <UBadge
                  :label="event.category"
                  size="md"
                  variant="soft"
                  class="font-bold px-3 py-1"
                  :color="getCategoryColor(event.category)"
                />
                <span class="text-sm text-gray-400 flex items-center gap-1.5 font-medium">
                  <UIcon name="i-heroicons-clock" class="w-4 h-4" />
                  {{ event.time }}
                </span>
              </div>
              <h3 class="text-xl font-bold text-[#0F1729] group-hover:text-[#7FD857] transition-colors leading-tight">
                {{ event.title }}
              </h3>
            </div>

            <!-- Flèche action -->
            <div class="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 group-hover:bg-[#7FD857] transition-colors shrink-0">
              <UIcon name="i-heroicons-arrow-right" class="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
            </div>
          </div>

        </div>

        <!-- Calendrier Interactif (Droite) -->
        <div class="lg:col-span-5">
          <div class="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 relative overflow-hidden">
            <UCalendar
              v-model="date"
              locale="fr-FR"
              class="w-full border-none shadow-none"
              :ui="{
                base: 'bg-white',
                day: {
                  base: 'w-9 h-9 flex items-center justify-center mx-auto rounded-full hover:bg-gray-100 data-[selected]:bg-[#0F1729] data-[selected]:text-white transition-colors text-[#0F1729]',
                  today: 'text-[#7FD857] font-bold',
                  outside: 'invisible pointer-events-none',
                  disabled: 'text-gray-300'
                },
                header: { base: 'mb-4 capitalize text-[#0F1729] font-bold' }
              }"
            >
              <template #day="{ day }">
                <div class="relative w-full h-full flex items-center justify-center">
                  {{ day.day }}
                  <span
                    v-if="hasEventOnDate(day)"
                    class="absolute -bottom-1 w-1 h-1 rounded-full bg-[#7FD857]"
                  ></span>
                </div>
              </template>
            </UCalendar>

            <!-- Légende -->
            <div class="mt-6 flex items-center justify-between text-xs text-gray-500 border-t border-gray-100 pt-4">
              <div class="flex items-center gap-2">
                <span class="w-2 h-2 bg-[#7FD857] rounded-full"></span>
                Événement
              </div>
              <div class="flex items-center gap-2">
                <span class="text-[#7FD857] font-bold">12</span>
                Aujourd'hui
              </div>
              <div class="flex items-center gap-2">
                <span class="w-2 h-2 bg-[#0F1729] rounded-full"></span>
                Sélectionné
              </div>
            </div>
          </div>
        </div>

      </div>
    </UContainer>
  </section>
</template>

<script setup lang="ts">
import { today, getLocalTimeZone } from '@internationalized/date'

defineProps({ blok: Object })

const date = ref(today(getLocalTimeZone()))

// ✅ Données dynamiques via composable (remplace le tableau hardcodé)
const { getEvents } = useEvents()
const events = await getEvents()

const hasEventOnDate = (dateItem: any) => {
  if (!dateItem) return false
  const d = new Date(dateItem)
  const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  return events.some((e: any) => e.date === dateStr)
}

const selectedDateEvents = computed(() => {
  if (!date.value) return []
  const selectedDateStr = date.value.toString()
  return events.filter((e: any) => e.date === selectedDateStr)
})

const getMonthShort = (dateString: string) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleString('fr-FR', { month: 'short' }).replace('.', '')
}

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'Vie du club': return 'primary'
    case 'Sortie': return 'warning'
    case 'Compétition': return 'error'
    default: return 'neutral'
  }
}
</script>
