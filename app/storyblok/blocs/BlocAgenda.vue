<template>
  <SectionShell
    v-editable="blok"
    :fond="blok.fond"
    :anchor-id="blok.anchor_id"
    :surtitre="blok.surtitre"
    :titre="blok.titre || 'Agenda'"
    :intro="blok.intro"
    largeur="normale"
  >
    <div v-if="aVenir.length" class="space-y-4">
      <AgendaLigne v-for="(e, i) in aVenir" :key="e._uid || i" :evenement="e" :fond="fond" />
    </div>

    <div v-if="passes.length" class="mt-8">
      <button
        type="button"
        class="text-sm font-bold flex items-center gap-1.5"
        :class="fond.sombre ? 'text-white/60' : 'text-gray-500'"
        @click="voirPasses = !voirPasses"
      >
        <UIcon :name="voirPasses ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'" class="w-4 h-4" />
        {{ voirPasses ? 'Masquer' : `Voir les ${passes.length} événements passés` }}
      </button>
      <div v-show="voirPasses" class="mt-4 space-y-4 opacity-60">
        <AgendaLigne v-for="(e, i) in passes" :key="e._uid || i" :evenement="e" :fond="fond" />
      </div>
    </div>

    <p v-if="!aVenir.length && !passes.length" class="text-center" :class="fond.texte">
      Aucun événement pour le moment.
    </p>
  </SectionShell>
</template>

<script setup>
import { ref, computed } from 'vue'
import SectionShell from './_SectionShell.vue'
import AgendaLigne from './_AgendaLigne.vue'
import { useSectionFond } from '~/composables/useSectionFond'

const props = defineProps({ blok: { type: Object, required: true } })

const fond = useSectionFond(() => props.blok.fond)
const voirPasses = ref(false)

const auj = () => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}
const parse = (s) => (s ? new Date(String(s).slice(0, 10)) : null)

const tries = computed(() =>
  [...(props.blok.evenements || [])].sort((a, b) => (parse(a.date) || 0) - (parse(b.date) || 0)),
)
const aVenir = computed(() => tries.value.filter((e) => !parse(e.date) || parse(e.date) >= auj()))
const passes = computed(() =>
  tries.value.filter((e) => parse(e.date) && parse(e.date) < auj()).reverse(),
)

// JSON-LD Event (SEO)
useHead({
  script: computed(() => {
    const evs = aVenir.value.filter((e) => e.titre && e.date)
    if (!evs.length) return []
    return evs.map((e) => ({
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Event',
        name: e.titre,
        startDate: String(e.date).slice(0, 10),
        ...(e.lieu ? { location: { '@type': 'Place', name: e.lieu } } : {}),
        ...(e.description ? { description: e.description } : {}),
      }),
    }))
  }),
})
</script>
