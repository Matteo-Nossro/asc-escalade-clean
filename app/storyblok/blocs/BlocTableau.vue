<template>
  <SectionShell
    v-editable="blok"
    :fond="blok.fond"
    :anchor-id="blok.anchor_id"
    :surtitre="blok.surtitre"
    :titre="blok.titre"
    :intro="blok.intro"
    largeur="large"
  >
    <!-- Vue tableau (tablette / ordinateur) -->
    <div data-reveal class="hidden md:block relative">
      <div
        v-if="peutScroller"
        class="pointer-events-none absolute inset-y-0 right-0 w-16 rounded-r-3xl transition-opacity duration-200"
        :class="finAtteinte ? 'opacity-0' : 'opacity-100'"
        style="background: linear-gradient(to right, transparent, rgba(255,255,255,0.95))"
      />
      <div
        ref="piste"
        class="overflow-x-auto rounded-3xl shadow-lg bg-white [scrollbar-width:thin]"
        @scroll="onScroll"
      >
        <table class="w-full min-w-[640px] text-sm">
          <thead v-if="entetes.length">
            <tr class="bg-vp-dark text-white text-left">
              <th
                v-for="(cell, ci) in entetes"
                :key="ci"
                class="px-4 py-4 font-bold"
                :class="[ci === 0 ? 'px-5' : 'text-center', colMiseEnAvant === ci ? 'bg-vp-green text-vp-dark' : '']"
              >
                {{ cell.value }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, ri) in lignes" :key="ri" :class="ri % 2 ? 'bg-gray-50/60' : 'bg-white'">
              <td
                v-for="(cell, ci) in row.body"
                :key="ci"
                class="px-4 py-3.5"
                :class="[
                  ci === 0 ? 'px-5 font-bold text-vp-dark' : 'text-center text-gray-700',
                  ci === 0 && premiereColFigee ? 'sticky left-0 bg-inherit' : '',
                  colMiseEnAvant === ci ? 'font-black text-vp-dark bg-vp-green/10' : '',
                ]"
              >
                {{ cell.value }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p
        v-if="peutScroller && !finAtteinte"
        class="mt-2 text-center text-xs text-gray-400 flex items-center justify-center gap-1 transition-opacity"
      >
        <UIcon name="i-heroicons-arrow-right" class="w-4 h-4 animate-pulse" /> Faites défiler pour voir toutes les colonnes
      </p>
    </div>

    <!-- Vue cartes (mobile) — chaque ligne devient une carte lisible -->
    <div data-reveal class="md:hidden space-y-4">
      <div
        v-for="(row, ri) in lignes"
        :key="ri"
        class="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden"
      >
        <p class="bg-vp-dark text-white font-bold px-4 py-3">{{ row.body[0]?.value }}</p>
        <dl class="divide-y divide-gray-100">
          <div
            v-for="(cell, ci) in row.body.slice(1)"
            :key="ci"
            class="flex items-center justify-between gap-4 px-4 py-2.5 text-sm"
            :class="colMiseEnAvant === ci + 1 ? 'bg-vp-green/10' : ''"
          >
            <dt class="text-gray-500">{{ entetes[ci + 1]?.value }}</dt>
            <dd
              class="font-bold"
              :class="colMiseEnAvant === ci + 1 ? 'text-vp-dark text-base' : 'text-gray-800'"
            >
              {{ cell.value }}
            </dd>
          </div>
        </dl>
      </div>
    </div>

    <p v-if="blok.note" data-reveal class="text-center text-xs mt-3" :class="fond.texte">
      {{ blok.note }}
    </p>
  </SectionShell>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import SectionShell from './_SectionShell.vue'
import { useSectionFond } from '~/composables/useSectionFond'

const props = defineProps({ blok: { type: Object, required: true } })

const fond = useSectionFond(() => props.blok.fond)
const table = computed(() => props.blok.tableau || {})
const entetes = computed(() => table.value.thead || [])
const lignes = computed(() => table.value.tbody || [])
const colMiseEnAvant = computed(() =>
  props.blok.colonne_mise_en_avant ? Number(props.blok.colonne_mise_en_avant) - 1 : -1,
)
const premiereColFigee = computed(() => !!props.blok.premiere_colonne_figee)

// Indicateur de défilement horizontal
const piste = ref(null)
const peutScroller = ref(false)
const finAtteinte = ref(false)

const maj = () => {
  const el = piste.value
  if (!el) return
  peutScroller.value = el.scrollWidth > el.clientWidth + 4
  finAtteinte.value = el.scrollLeft >= el.scrollWidth - el.clientWidth - 4
}
const onScroll = () => maj()
onMounted(() => {
  maj()
  window.addEventListener('resize', maj)
})
onBeforeUnmount(() => window.removeEventListener('resize', maj))
</script>
