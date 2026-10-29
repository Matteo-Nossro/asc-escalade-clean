<template>
  <SectionShell v-editable="blok" :fond="blok.fond" :anchor-id="blok.anchor_id" largeur="large">
    <div
      data-reveal
      class="rounded-3xl p-10 md:p-14 text-center"
      :class="blok.theme === 'vert' ? 'bg-vp-green' : 'bg-vp-dark'"
    >
      <h2
        class="text-2xl md:text-3xl font-bold mb-3"
        :class="blok.theme === 'vert' ? 'text-vp-dark' : 'text-white'"
      >
        {{ blok.titre || 'Titre de l’appel à l’action' }}
      </h2>
      <p
        v-if="blok.texte"
        class="mb-8 max-w-xl mx-auto"
        :class="blok.theme === 'vert' ? 'text-vp-dark/80' : 'text-white/70'"
      >
        {{ blok.texte }}
      </p>
      <div v-if="boutons.length" class="flex flex-wrap justify-center gap-3">
        <BlocBouton v-for="(b, i) in boutons" :key="b._uid || i" :blok="b" />
      </div>
    </div>
  </SectionShell>
</template>

<script setup>
import { computed } from 'vue'
import SectionShell from './_SectionShell.vue'
import BlocBouton from './_BlocBouton.vue'

const props = defineProps({ blok: { type: Object, required: true } })
const boutons = computed(() => props.blok.boutons || [])
</script>
