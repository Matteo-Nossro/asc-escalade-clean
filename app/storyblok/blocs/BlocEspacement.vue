<template>
  <div v-editable="blok" aria-hidden="true" :class="[hauteur, fond.section]" />
</template>

<script setup>
import { computed } from 'vue'
import { useSectionFond } from '~/composables/useSectionFond'

const props = defineProps({ blok: { type: Object, required: true } })

const fond = useSectionFond(() => props.blok.fond)
const hauteur = computed(
  () =>
    ({
      S: 'h-8 md:h-10',
      M: 'h-14 md:h-20',
      L: 'h-24 md:h-32',
      XL: 'h-36 md:h-48',
    })[props.blok.taille] || 'h-14 md:h-20',
)
</script>
