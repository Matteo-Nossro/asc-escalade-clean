<template>
  <section v-editable="blok" class="py-12">
    <h2
      v-if="blok.title"
      class="text-3xl font-bold text-[#0F1729] mb-8"
    >
      {{ blok.title }}
    </h2>

    <div v-if="loading" class="flex justify-center py-12">
      <UIcon name="i-lucide-loader-circle" class="w-8 h-8 animate-spin text-[#7FD857]" />
    </div>

    <div v-else-if="groups.length === 0" class="text-center py-12 text-gray-400">
      Aucun groupe disponible pour le moment.
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="item in accordionItems"
        :key="item.label"
        class="rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm"
      >
        <!-- Header -->
        <button
          type="button"
          class="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
          @click="toggle(item.label)"
        >
          <div class="flex items-center gap-3 min-w-0">
            <span
              class="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold uppercase shrink-0"
              :class="getLevelColor(item.level)"
            >
              {{ item.level || 'Tous niveaux' }}
            </span>
            <span class="font-bold text-[#0F1729] text-base truncate">{{ item.label }}</span>
          </div>
          <div class="flex items-center gap-4 shrink-0">
            <span v-if="item.price != null" class="font-black text-[#7FD857] text-lg">
              {{ item.price }} €
            </span>
            <UIcon
              name="i-lucide-chevron-down"
              class="w-5 h-5 text-[#7FD857] transition-transform duration-200"
              :class="isOpen(item.label) ? 'rotate-180' : ''"
            />
          </div>
        </button>

        <!-- Body -->
        <div
          v-show="isOpen(item.label)"
          class="border-t border-gray-100 bg-gray-50/50 px-5 pb-6 pt-4"
        >
          <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">

            <!-- Effectif -->
            <div class="flex items-start gap-3">
              <UIcon name="i-lucide-users" class="w-5 h-5 text-[#7FD857] mt-0.5 shrink-0" />
              <div>
                <dt class="text-xs font-semibold uppercase tracking-wide text-gray-400">Effectif</dt>
                <dd class="text-sm font-medium text-[#0F1729] mt-0.5">
                  {{ item.members_count }} / {{ item.max_members }} place{{ item.max_members > 1 ? 's' : '' }}
                </dd>
              </div>
            </div>

            <!-- Référent -->
            <div class="flex items-start gap-3">
              <UIcon name="i-lucide-user-check" class="w-5 h-5 text-[#7FD857] mt-0.5 shrink-0" />
              <div>
                <dt class="text-xs font-semibold uppercase tracking-wide text-gray-400">Référent</dt>
                <dd class="text-sm font-medium text-[#0F1729] mt-0.5">
                  {{ item.referent || '—' }}
                </dd>
              </div>
            </div>

            <!-- Horaires -->
            <div class="flex items-start gap-3">
              <UIcon name="i-lucide-clock" class="w-5 h-5 text-[#7FD857] mt-0.5 shrink-0" />
              <div>
                <dt class="text-xs font-semibold uppercase tracking-wide text-gray-400">Horaires</dt>
                <dd class="mt-0.5 space-y-0.5">
                  <div
                    v-for="(schedule, i) in item.schedules"
                    :key="i"
                    class="text-sm font-medium text-[#0F1729]"
                  >
                    {{ schedule }}
                  </div>
                  <span v-if="!item.schedules.length" class="text-sm text-gray-400">—</span>
                </dd>
              </div>
            </div>

            <!-- Initiateurs -->
            <div class="flex items-start gap-3">
              <UIcon name="i-lucide-graduation-cap" class="w-5 h-5 text-[#7FD857] mt-0.5 shrink-0" />
              <div>
                <dt class="text-xs font-semibold uppercase tracking-wide text-gray-400">Initiateurs</dt>
                <dd class="mt-0.5 space-y-0.5">
                  <div
                    v-for="(name, i) in item.instructors"
                    :key="i"
                    class="text-sm font-medium text-[#0F1729]"
                  >
                    {{ name }}
                  </div>
                  <span v-if="!item.instructors.length" class="text-sm text-gray-400">—</span>
                </dd>
              </div>
            </div>

          </dl>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useGroups } from '~/composables/useGroups'

defineProps({ blok: Object })

const { groups, loading, fetchGroups } = useGroups()

onMounted(fetchGroups)

const openItems = ref(new Set())

function toggle(label) {
  if (openItems.value.has(label)) {
    openItems.value.delete(label)
  } else {
    openItems.value.add(label)
  }
}

function isOpen(label) {
  return openItems.value.has(label)
}

const DAY_NAMES = {
  1: 'Lundi', 2: 'Mardi', 3: 'Mercredi', 4: 'Jeudi',
  5: 'Vendredi', 6: 'Samedi', 7: 'Dimanche',
}

function formatSchedule(day, start, end) {
  const dayName = DAY_NAMES[day] || `Jour ${day}`
  const fmt = t => { const [h, m] = t.split(':'); return `${h}h${m}` }
  return `${dayName} ${fmt(start)} – ${fmt(end)}`
}

function getLevelColor(level) {
  switch (level) {
    case 'Débutant':      return 'bg-green-100 text-green-700'
    case 'Intermédiaire': return 'bg-blue-100 text-blue-700'
    case 'Confirmé':      return 'bg-purple-100 text-purple-700'
    case 'Compétition':   return 'bg-orange-100 text-orange-700'
    default:              return 'bg-gray-100 text-gray-500'
  }
}

const accordionItems = computed(() =>
  groups.value.map(g => ({
    label: g.name,
    level: g.level,
    price: g.price,
    max_members: g.max_members,
    members_count: g._members_count ?? 0,
    referent: g.referent?.full_name ?? null,
    schedules: (g.schedules ?? []).map(s =>
      formatSchedule(s.day_of_week, s.start_time, s.end_time),
    ),
    instructors: (g.instructors ?? []).map(i => i.profile?.full_name).filter(Boolean),
  })),
)
</script>
