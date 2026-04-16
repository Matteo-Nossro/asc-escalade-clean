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
        v-for="section in groupedSections"
        :key="section.key"
        class="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden"
      >
        <!-- Header de section = tranche d'âge -->
        <button
          type="button"
          class="w-full flex items-center justify-between gap-4 px-6 py-5 text-left hover:bg-gray-50 transition-colors"
          @click="toggle(section.key)"
        >
          <div class="flex items-center gap-3">
            <span class="font-bold text-[#0F1729] text-lg">{{ section.label }}</span>
            <span class="text-xs bg-gray-100 text-gray-500 px-2.5 py-0.5 rounded-full font-medium">
              {{ section.items.length }} groupe{{ section.items.length > 1 ? 's' : '' }}
            </span>
          </div>
          <UIcon
            name="i-lucide-chevron-down"
            class="w-5 h-5 text-gray-400 transition-transform duration-200"
            :class="isOpen(section.key) ? 'rotate-180' : ''"
          />
        </button>

        <!-- Contenu : liste des groupes -->
        <Transition :css="false" @enter="onEnter" @leave="onLeave">
          <div v-if="isOpen(section.key)">
            <div class="border-t border-gray-100 divide-y divide-gray-100">
              <div
                v-for="item in section.items"
                :key="item.label"
                class="px-6 py-5 bg-gray-50/30"
              >
                <!-- Nom + niveau + prix -->
                <div class="flex items-center justify-between gap-4 mb-4">
                  <div class="flex items-center gap-2 min-w-0">
                    <span
                      class="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wide shrink-0"
                      :class="getLevelColor(item.level)"
                    >
                      {{ item.level || 'Tous niveaux' }}
                    </span>
                    <span class="font-bold text-[#0F1729] truncate">{{ item.label }}</span>
                  </div>
                  <span v-if="item.price != null" class="font-black text-[#0F1729] text-base shrink-0">
                    {{ item.price }} €
                  </span>
                </div>

                <!-- Détails -->
                <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">

                  <div class="flex items-start gap-3">
                    <UIcon name="i-lucide-users" class="w-4 h-4 text-[#7FD857] mt-0.5 shrink-0" />
                    <div>
                      <dt class="text-xs font-semibold uppercase tracking-wide text-gray-400">Effectif</dt>
                      <dd class="text-sm font-medium text-[#0F1729] mt-0.5">
                        {{ item.members_count }} / {{ item.max_members }} place{{ item.max_members > 1 ? 's' : '' }}
                      </dd>
                    </div>
                  </div>

                  <div class="flex items-start gap-3">
                    <UIcon name="i-lucide-user-check" class="w-4 h-4 text-[#7FD857] mt-0.5 shrink-0" />
                    <div>
                      <dt class="text-xs font-semibold uppercase tracking-wide text-gray-400">Référent</dt>
                      <dd class="text-sm font-medium text-[#0F1729] mt-0.5">{{ item.referent || '—' }}</dd>
                    </div>
                  </div>

                  <div class="flex items-start gap-3">
                    <UIcon name="i-lucide-clock" class="w-4 h-4 text-[#7FD857] mt-0.5 shrink-0" />
                    <div>
                      <dt class="text-xs font-semibold uppercase tracking-wide text-gray-400">Horaires</dt>
                      <dd class="mt-0.5 space-y-0.5">
                        <div v-for="(s, si) in item.schedules" :key="si" class="text-sm font-medium text-[#0F1729]">{{ s }}</div>
                        <span v-if="!item.schedules.length" class="text-sm text-gray-400">—</span>
                      </dd>
                    </div>
                  </div>

                  <div class="flex items-start gap-3">
                    <UIcon name="i-lucide-graduation-cap" class="w-4 h-4 text-[#7FD857] mt-0.5 shrink-0" />
                    <div>
                      <dt class="text-xs font-semibold uppercase tracking-wide text-gray-400">Initiateurs</dt>
                      <dd class="mt-0.5 space-y-0.5">
                        <div v-for="(name, ni) in item.instructors" :key="ni" class="text-sm font-medium text-[#0F1729]">{{ name }}</div>
                        <span v-if="!item.instructors.length" class="text-sm text-gray-400">—</span>
                      </dd>
                    </div>
                  </div>

                  <div v-if="item.birthRange" class="flex items-start gap-3">
                    <UIcon name="i-lucide-cake" class="w-4 h-4 text-[#7FD857] mt-0.5 shrink-0" />
                    <div>
                      <dt class="text-xs font-semibold uppercase tracking-wide text-gray-400">Années de référence</dt>
                      <dd class="text-sm font-medium text-[#0F1729] mt-0.5">{{ item.birthRange }}</dd>
                    </div>
                  </div>

                </dl>
              </div>
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
import type { Group } from '../types/auth'

defineProps<{ title?: string }>()

const { groups, loading, fetchGroups } = useGroups()

onMounted(fetchGroups)

const openItems = ref<Set<string>>(new Set())

function toggle(key: string) {
  if (openItems.value.has(key)) {
    openItems.value.delete(key)
  } else {
    openItems.value.add(key)
  }
}

function isOpen(key: string): boolean {
  return openItems.value.has(key)
}

function onEnter(el: Element, done: () => void) {
  const h = el as HTMLElement
  h.style.height = '0'
  h.style.overflow = 'hidden'
  h.offsetHeight
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
  h.offsetHeight
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

function formatBirthRange(min: string | null, max: string | null): string | null {
  if (!min && !max) return null
  const yearOf = (d: string) => d.slice(0, 4)
  if (min && max) return `${yearOf(min)} / ${yearOf(max)}`
  if (!min && max) {
    if (max.endsWith('12-31')) return `Avant ${parseInt(yearOf(max)) + 1}`
    const [y, mo, d] = max.split('-').map(Number)
    const cut = new Date(Date.UTC(y, mo - 1, d + 1))
    const dd = String(cut.getUTCDate()).padStart(2, '0')
    const mm = String(cut.getUTCMonth() + 1).padStart(2, '0')
    return `Nés avant le ${dd}/${mm}/${cut.getUTCFullYear()}`
  }
  return `À partir de ${yearOf(min!)}`
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

// ─── Groupement par tranche d'âge ────────────────────────────────────────────
// L'âge de référence = année N-1 (convention sportive)

function getSectionKey(g: Group): string {
  const minYear = g.min_birth_date?.slice(0, 4) ?? 'null'
  const maxYear = g.max_birth_date?.slice(0, 4) ?? 'null'
  return `${minYear}_${maxYear}`
}

function getSectionLabel(g: Group): string {
  const refYear = new Date().getFullYear() - 1
  const minYear = g.min_birth_date ? parseInt(g.min_birth_date.slice(0, 4)) : null
  const maxYear = g.max_birth_date ? parseInt(g.max_birth_date.slice(0, 4)) : null

  if (!minYear && !maxYear) return 'Adultes / Tous niveaux'

  const minAge = maxYear !== null ? refYear - maxYear : null
  const maxAge = minYear !== null ? refYear - minYear : null

  if (minAge !== null && maxAge !== null) return `${minAge} – ${maxAge} ans`
  if (minAge !== null) return `${minAge} ans et plus`
  if (maxAge !== null) return `Jusqu'à ${maxAge} ans`
  return 'Adultes / Tous niveaux'
}

function mapGroupToItem(g: Group) {
  return {
    label: g.name,
    level: g.level,
    price: g.price,
    max_members: g.max_members,
    members_count: g._members_count ?? 0,
    referent: g.referent?.full_name ?? null,
    schedules: (g.schedules ?? []).map(s =>
      formatSchedule(s.day_of_week, s.start_time, s.end_time),
    ),
    instructors: (g.instructors ?? []).map(i => i.profile?.full_name).filter(Boolean) as string[],
    birthRange: formatBirthRange(g.min_birth_date, g.max_birth_date),
  }
}

const groupedSections = computed(() => {
  const sections: Array<{ key: string; label: string; items: ReturnType<typeof mapGroupToItem>[] }> = []
  const seen = new Map<string, number>()

  for (const g of groups.value) {
    const key = getSectionKey(g)
    if (seen.has(key)) {
      sections[seen.get(key)!].items.push(mapGroupToItem(g))
    } else {
      seen.set(key, sections.length)
      sections.push({ key, label: getSectionLabel(g), items: [mapGroupToItem(g)] })
    }
  }

  return sections
})
</script>
