<template>
  <SectionShell
    v-editable="blok"
    :fond="blok.fond"
    :anchor-id="blok.anchor_id"
    :surtitre="blok.surtitre"
    :titre="blok.titre"
    :intro="blok.intro"
  >
    <div class="grid gap-4 sm:gap-6" :class="colonnes" data-reveal>
      <div
        v-for="(info, i) in infos"
        :key="info._uid || i"
        class="rounded-3xl p-6 text-center flex flex-col items-center"
        :class="fond.sombre ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-100 shadow-sm'"
      >
        <div
          v-if="info.icon"
          class="w-12 h-12 rounded-2xl bg-vp-green/15 flex items-center justify-center mb-3"
        >
          <UIcon :name="info.icon" class="w-6 h-6 text-vp-green" />
        </div>
        <p class="text-2xl md:text-3xl font-black" :class="fond.titre">{{ info.valeur }}</p>
        <p class="mt-1 text-sm font-medium" :class="fond.texte">{{ info.libelle }}</p>
      </div>
    </div>
  </SectionShell>
</template>

<script setup>
import { computed } from 'vue'
import SectionShell from './_SectionShell.vue'
import { useSectionFond } from '~/composables/useSectionFond'

const props = defineProps({ blok: { type: Object, required: true } })

const fond = useSectionFond(() => props.blok.fond)
const infos = computed(() => props.blok.infos || [])
const colonnes = computed(() => {
  const n = infos.value.length
  if (n <= 2) return 'grid-cols-1 sm:grid-cols-2'
  if (n === 3) return 'grid-cols-1 sm:grid-cols-3'
  return 'grid-cols-2 lg:grid-cols-4'
})
</script>
