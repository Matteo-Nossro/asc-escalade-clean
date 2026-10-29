<template>
  <section
    :id="blok.anchor_id || 'niveaux'"
    ref="root"
    v-editable="blok"
    class="scroll-mt-28 py-16 md:py-24"
    :class="fond.section"
  >
    <UContainer>
      <div class="max-w-2xl mx-auto text-center mb-12" data-reveal>
        <span
          v-if="blok.surtitre"
          class="text-[var(--vp-green-text)] font-bold uppercase tracking-wider text-sm"
        >
          {{ blok.surtitre }}
        </span>
        <h2 class="text-3xl md:text-4xl font-bold mt-2" :class="fond.titre">
          {{ blok.title || 'Quel est mon niveau ?' }}
        </h2>
        <p v-if="blok.intro" class="mt-4" :class="fond.texte">{{ blok.intro }}</p>
      </div>

      <div class="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
        <div
          v-for="(niveau, i) in niveaux"
          :key="niveau._uid || i"
          data-reveal
          class="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 flex flex-col"
        >
          <div class="flex items-center gap-4 mb-4">
            <span
              class="w-11 h-11 rounded-2xl bg-vp-dark text-white text-lg font-black flex items-center justify-center flex-shrink-0"
            >
              {{ niveau.numero || i + 1 }}
            </span>
            <h3 class="text-lg font-bold text-vp-dark">{{ niveau.titre }}</h3>
          </div>

          <p v-if="niveau.resume" class="text-sm text-gray-500 italic mb-5">
            {{ niveau.resume }}
          </p>

          <ul v-if="(niveau.competences || []).length" class="space-y-2.5 flex-grow">
            <li
              v-for="(c, ci) in niveau.competences"
              :key="c._uid || ci"
              class="flex items-start gap-2.5 text-sm text-gray-700"
            >
              <UIcon
                name="i-heroicons-check-circle"
                class="w-5 h-5 text-vp-green flex-shrink-0 mt-px"
              />
              {{ c.texte }}
            </li>
          </ul>

          <p
            v-if="niveau.equivalence"
            class="mt-6 inline-flex items-center gap-1.5 self-start rounded-full bg-vp-green/10 text-vp-dark text-xs font-semibold px-3 py-1.5"
          >
            <UIcon name="i-heroicons-arrows-right-left" class="w-3.5 h-3.5 text-vp-green" />
            Équivaut à : {{ niveau.equivalence }}
          </p>
        </div>
      </div>

      <div
        v-if="blok.note"
        data-reveal
        class="mt-6 max-w-5xl mx-auto flex items-start gap-3 rounded-2xl p-5"
        :class="fond.sombre ? 'bg-white/5 border border-white/10 text-white/90' : 'bg-vp-dark text-white'"
      >
        <UIcon name="i-heroicons-light-bulb" class="w-6 h-6 text-vp-green flex-shrink-0" />
        <p class="text-sm md:text-base">{{ blok.note }}</p>
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
const niveaux = computed(() => props.blok.niveaux || [])
</script>
