<template>
  <div class="max-w-5xl mx-auto px-4">
    <h2 v-if="title" class="text-3xl font-bold text-center text-[#0F1729] mb-10">{{ title }}</h2>

    <div v-if="loading" class="flex justify-center py-12">
      <UIcon name="i-lucide-loader-circle" class="w-8 h-8 animate-spin text-[#7FD857]" />
    </div>

    <div v-else-if="groups.length === 0" class="text-center py-12 text-gray-400">
      Aucun groupe disponible pour le moment.
    </div>

    <div v-else class="space-y-4">
      <div
        v-for="item in accordionItems"
        :key="item.label"
        class="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden"
      >
        <!-- Header -->
        <button
          type="button"
          class="w-full flex items-center justify-between gap-4 px-6 py-5 text-left hover:bg-gray-50 transition-colors"
          @click="toggle(item.label)"
        >
          <div class="flex items-center gap-3 min-w-0">
            <span
              class="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wide shrink-0"
              :class="getLevelColor(item.level)"
            >
              {{ item.level || 'Tous niveaux' }}
            </span>
            <span class="font-bold text-[#0F1729] text-lg truncate">{{ item.label }}</span>
          </div>
          <div class="flex items-center gap-4 shrink-0">
            <span v-if="item.price != null" class="font-black text-[#0F1729] text-base">
              {{ item.price }} €
            </span>
            <UIcon
              name="i-lucide-chevron-down"
              class="w-5 h-5 text-gray-400 transition-transform duration-200"
              :class="isOpen(item.label) ? 'rotate-180' : ''"
            />
          </div>
        </button>

        <!-- Body avec transition hauteur -->
        <Transition :css="false" @enter="onEnter" @leave="onLeave">
          <div v-if="isOpen(item.label)">
            <div class="border-t border-gray-100 bg-gray-50/30 px-6 py-5">
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
                      <div v-for="(s, i) in item.schedules" :key="i" class="text-sm font-medium text-[#0F1729]">{{ s }}</div>
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
                      <div v-for="(name, i) in item.instructors" :key="i" class="text-sm font-medium text-[#0F1729]">{{ name }}</div>
                      <span v-if="!item.instructors.length" class="text-sm text-gray-400">—</span>
                    </dd>
                  </div>
                </div>

              </dl>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useGroups } from '~/composables/useGroups'

defineProps<{ title?: string }>()

const { groups, loading, fetchGroups } = useGroups()

onMounted(fetchGroups)

const openItems = ref<Set<string>>(new Set())

function toggle(label: string) {
  if (openItems.value.has(label)) {
    openItems.value.delete(label)
  } else {
    openItems.value.add(label)
  }
}

function isOpen(label: string): boolean {
  return openItems.value.has(label)
}

function onEnter(el: Element, done: () => void) {
  const h = el as HTMLElement
  h.style.height = '0'
  h.style.overflow = 'hidden'
  h.offsetHeight // force reflow
  h.style.transition = 'height 0.25s ease'
  h.style.height = h.scrollHeight + 'px'
  h.addEventListener('transitionend', () => {
    h.style.height = ''
    h.style.overflow = ''
    h.style.transition = ''
    done()
  }, { once: true })
}

function onLeave(el: Element, done: () => void) {
  const h = el as HTMLElement
  h.style.height = h.scrollHeight + 'px'
  h.style.overflow = 'hidden'
  h.offsetHeight // force reflow
  h.style.transition = 'height 0.25s ease'
  h.style.height = '0'
  h.addEventListener('transitionend', done, { once: true })
}

const DAY_NAMES: Record<number, string> = {
  1: 'Lundi', 2: 'Mardi', 3: 'Mercredi', 4: 'Jeudi',
  5: 'Vendredi', 6: 'Samedi', 7: 'Dimanche',
}

function formatSchedule(day: number, start: string, end: string): string {
  const dayName = DAY_NAMES[day] || `Jour ${day}`
  const fmt = (t: string) => { const [h, m] = t.split(':'); return `${h}h${m}` }
  return `${dayName} ${fmt(start)} – ${fmt(end)}`
}

function getLevelColor(level: string | null): string {
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
