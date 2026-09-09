<template>
  <div v-editable="blok" :class="fond.section">
    <UContainer class="py-8 md:py-12">
      <hr
        class="border-t mx-auto"
        :class="[
          fond.sombre ? 'border-white/15' : 'border-gray-200',
          blok.largeur === 'courte' ? 'max-w-24' : 'max-w-none',
          blok.epaisseur === 'epaisse' ? 'border-t-2' : '',
        ]"
      />
    </UContainer>
  </div>
</template>

<script setup>
import { useSectionFond } from '~/composables/useSectionFond'

const props = defineProps({ blok: { type: Object, required: true } })
const fond = useSectionFond(() => props.blok.fond)
</script>
