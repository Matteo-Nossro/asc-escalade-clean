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
      vert: 'bg-vp-green hover:bg-vp-green-hover text-vp-dark',
      sombre: 'bg-vp-dark hover:bg-vp-dark-hover text-white',
      clair: 'bg-white hover:bg-gray-100 text-vp-dark',
      outline: 'border border-current bg-transparent hover:bg-vp-dark hover:text-white text-vp-dark',
    })[props.blok.style] || 'bg-vp-green hover:bg-vp-green-hover text-vp-dark',
)
</script>
