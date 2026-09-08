<template>
  <section
    :id="blok.anchor_id || undefined"
    ref="root"
    v-editable="blok"
    class="scroll-mt-28 py-16 md:py-24"
    :class="fond.section"
  >
    <UContainer>
      <div
        data-reveal
        class="max-w-5xl mx-auto bg-[#0F1729] rounded-3xl p-10 md:p-14 text-center"
      >
        <h2 class="text-2xl md:text-3xl font-bold text-white mb-3">
          {{ blok.title || 'Une question sur l\'inscription ?' }}
        </h2>
        <p v-if="blok.texte" class="text-white/70 mb-8 max-w-xl mx-auto">{{ blok.texte }}</p>

        <UButton
          v-if="blok.bouton_label && lien.href"
          :to="lien.external ? undefined : lien.href"
          :href="lien.external ? lien.href : undefined"
          :target="lien.external ? '_blank' : undefined"
          :rel="lien.external ? 'noopener' : undefined"
          size="xl"
          :icon="blok.icon || 'i-heroicons-envelope'"
          class="bg-[#7FD857] hover:bg-[#6bc546] text-[#0F1729] font-bold"
        >
          {{ blok.bouton_label }}
        </UButton>
      </div>
    </UContainer>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  blok: {
    type: Object,
    required: true,
  },
})

const { resolveLink } = useStoryblokLink()

const root = ref(null)
useGsapReveal(root)

const fond = useInscriptionsFond(() => props.blok.fond)
const lien = computed(() => resolveLink(props.blok.bouton_lien))
</script>
