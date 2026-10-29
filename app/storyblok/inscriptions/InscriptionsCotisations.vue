<template>
  <section
    :id="blok.anchor_id || 'tarifs'"
    ref="root"
    v-editable="blok"
    class="scroll-mt-28 py-16 md:py-24"
    :class="fond.section"
  >
    <UContainer>
      <div class="max-w-2xl mx-auto text-center mb-4" data-reveal>
        <span
          v-if="blok.surtitre"
          class="text-[var(--vp-green-text)] font-bold uppercase tracking-wider text-sm"
        >
          {{ blok.surtitre }}
        </span>
        <h2 class="text-3xl md:text-4xl font-bold mt-2" :class="fond.titre">
          {{ blok.title || 'Tarifs des cotisations' }}
        </h2>
        <p v-if="blok.intro" class="mt-3" :class="fond.texte">{{ blok.intro }}</p>
      </div>

      <div data-reveal class="max-w-5xl mx-auto overflow-x-auto rounded-3xl shadow-lg bg-white">
        <table class="w-full min-w-[720px] text-sm">
          <thead>
            <tr class="bg-vp-dark text-white text-left">
              <th class="px-5 py-4 font-bold">Catégorie</th>
              <th class="px-4 py-4 font-semibold text-center">
                Licence FFME<br><span class="font-normal text-white/60 text-xs">+ assurance</span>
              </th>
              <th class="px-4 py-4 font-semibold text-center">
                CT21<br><span class="font-normal text-white/60 text-xs">FFME</span>
              </th>
              <th class="px-4 py-4 font-semibold text-center">
                Ligue<br><span class="font-normal text-white/60 text-xs">FFME</span>
              </th>
              <th class="px-4 py-4 font-semibold text-center">
                Cotisation<br><span class="font-normal text-white/60 text-xs">club</span>
              </th>
              <th class="px-5 py-4 font-bold text-center bg-vp-green text-vp-dark">
                Total<br>adhérent
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(row, i) in lignes"
              :key="row._uid || i"
              :class="i % 2 ? 'bg-gray-50/60' : 'bg-white'"
            >
              <td class="px-5 py-4">
                <div class="font-bold text-vp-dark">{{ row.categorie }}</div>
                <div v-if="row.hint" class="text-xs text-gray-500 mt-0.5">{{ row.hint }}</div>
              </td>
              <td class="px-4 py-4 text-center text-gray-700">{{ row.licence }}</td>
              <td class="px-4 py-4 text-center text-gray-700">{{ row.ct21 }}</td>
              <td class="px-4 py-4 text-center text-gray-700">{{ row.ligue }}</td>
              <td class="px-4 py-4 text-center text-gray-700">{{ row.club }}</td>
              <td class="px-5 py-4 text-center font-black text-vp-dark bg-vp-green/10">
                {{ row.total }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p
        v-if="blok.note"
        data-reveal
        class="max-w-5xl mx-auto text-center text-xs mt-3"
        :class="fond.texte"
      >
        {{ blok.note }}
      </p>
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
const lignes = computed(() => props.blok.lignes || [])
</script>
