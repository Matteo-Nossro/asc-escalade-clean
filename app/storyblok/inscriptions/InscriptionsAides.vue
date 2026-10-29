<template>
  <section
    :id="blok.anchor_id || undefined"
    ref="root"
    v-editable="blok"
    class="scroll-mt-28 py-16 md:py-24"
    :class="fond.section"
  >
    <UContainer>
      <div class="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
        <div data-reveal class="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
          <h3 class="flex items-center gap-2 text-lg font-bold text-vp-dark mb-4">
            <UIcon name="i-heroicons-tag" class="w-5 h-5 text-vp-green" />
            {{ blok.titre_reductions || 'Réductions' }}
          </h3>
          <ul class="space-y-3">
            <li
              v-for="(r, i) in reductions"
              :key="r._uid || i"
              class="flex items-start gap-3 text-sm text-gray-600"
            >
              <UIcon name="i-heroicons-check" class="w-5 h-5 text-vp-green flex-shrink-0" />
              {{ r.texte }}
            </li>
          </ul>
        </div>

        <div data-reveal class="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
          <h3 class="flex items-center gap-2 text-lg font-bold text-vp-dark mb-4">
            <UIcon name="i-heroicons-credit-card" class="w-5 h-5 text-vp-green" />
            {{ blok.titre_paiement || 'Modalités de paiement' }}
          </h3>
          <p v-if="blok.paiement_texte" class="text-sm text-gray-600 mb-4">
            {{ blok.paiement_texte }}
          </p>
          <div v-if="modes.length" class="flex flex-wrap gap-2">
            <span
              v-for="(m, i) in modes"
              :key="m._uid || i"
              class="px-3 py-1.5 rounded-full bg-vp-green/10 text-vp-dark text-xs font-semibold"
            >
              {{ m.texte }}
            </span>
          </div>
        </div>
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

const root = ref(null)
useGsapReveal(root)

const fond = useInscriptionsFond(() => props.blok.fond)
const reductions = computed(() => props.blok.reductions || [])
const modes = computed(() => props.blok.paiement_modes || [])
</script>
