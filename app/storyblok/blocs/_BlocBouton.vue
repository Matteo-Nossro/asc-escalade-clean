<!--
  Bouton unique, rendu à partir d'un nestable `bloc-bouton`
  ({ label, lien, fichier, style, icon }). Usage interne.
-->
<template>
  <UButton
    v-if="blok.label && cible.href"
    :to="cible.external ? undefined : cible.href"
    :href="cible.external ? cible.href : undefined"
    :target="cible.external ? '_blank' : undefined"
    :rel="cible.external ? 'noopener' : undefined"
    size="lg"
    :icon="blok.icon || undefined"
    :trailing-icon="!blok.icon && cible.external ? 'i-heroicons-arrow-top-right-on-square' : undefined"
    class="font-bold"
    :class="classes"
  >
    {{ blok.label }}
  </UButton>
</template>

<script setup>
import { computed } from 'vue'
import { useStoryblokLink } from '~/composables/useStoryblokLink'

const props = defineProps({
  blok: { type: Object, required: true },
})

const { resolveFileOrLink } = useStoryblokLink()
const cible = computed(() => resolveFileOrLink(props.blok.fichier, props.blok.lien))

const classes = computed(
  () =>
    ({
      vert: 'bg-[#7FD857] hover:bg-[#6bc546] text-[#0F1729]',
      sombre: 'bg-[#0F1729] hover:bg-[#1a2740] text-white',
      clair: 'bg-white hover:bg-gray-100 text-[#0F1729]',
      outline: 'border border-current bg-transparent hover:bg-[#0F1729] hover:text-white text-[#0F1729]',
    })[props.blok.style] || 'bg-[#7FD857] hover:bg-[#6bc546] text-[#0F1729]',
)
</script>
