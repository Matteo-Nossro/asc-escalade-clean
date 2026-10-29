<!-- Une ligne d'événement d'agenda — usage interne (bloc-agenda). -->
<template>
  <article
    class="flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl p-5"
    :class="fond.sombre ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-100 shadow-sm'"
  >
    <!-- Pastille date -->
    <div
      class="flex-shrink-0 w-16 h-16 rounded-2xl bg-vp-green/15 flex flex-col items-center justify-center"
    >
      <span class="text-lg font-black leading-none text-vp-dark">{{ jour }}</span>
      <span class="text-xs font-bold uppercase text-vp-dark/70">{{ mois }}</span>
    </div>

    <div class="flex-grow min-w-0">
      <div class="flex flex-wrap items-center gap-2">
        <span
          v-if="evenement.categorie"
          class="text-xs font-bold uppercase tracking-wider text-[var(--vp-green-text)]"
        >
          {{ evenement.categorie }}
        </span>
        <span v-if="evenement.horaire" class="text-xs" :class="fond.texte">{{ evenement.horaire }}</span>
      </div>
      <h3 class="font-bold" :class="fond.titre">{{ evenement.titre }}</h3>
      <p v-if="evenement.lieu" class="text-sm flex items-center gap-1" :class="fond.texte">
        <UIcon name="i-heroicons-map-pin" class="w-4 h-4" /> {{ evenement.lieu }}
      </p>
      <p v-if="evenement.description" class="text-sm mt-1" :class="fond.texte">
        {{ evenement.description }}
      </p>
    </div>

    <UButton
      v-if="evenement.lien_label && lien.href"
      :to="lien.external ? undefined : lien.href"
      :href="lien.external ? lien.href : undefined"
      :target="lien.external ? '_blank' : undefined"
      :rel="lien.external ? 'noopener' : undefined"
      size="sm"
      class="flex-shrink-0 bg-vp-dark hover:bg-vp-dark-hover text-white font-bold"
    >
      {{ evenement.lien_label }}
    </UButton>
  </article>
</template>

<script setup>
import { computed } from 'vue'
import { useStoryblokLink } from '~/composables/useStoryblokLink'

const props = defineProps({
  evenement: { type: Object, required: true },
  fond: { type: Object, required: true },
})

const { resolveLink } = useStoryblokLink()
const lien = computed(() => resolveLink(props.evenement.lien))

const d = computed(() => (props.evenement.date ? new Date(String(props.evenement.date).slice(0, 10)) : null))
const jour = computed(() => (d.value ? d.value.getDate() : '—'))
const mois = computed(() =>
  d.value ? d.value.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '') : '',
)
</script>
