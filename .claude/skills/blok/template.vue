<!--
  Template de blok Storyblok ASC Escalade — conforme aux règles critiques (skill asc-rules).
  Copier vers app/storyblok/<section>/<NomBlok>.vue, renommer les champs (blok.titre, blok.image…),
  supprimer ce qui ne sert pas. Champs utilisés ici : titre (Text), image (Asset), items (Blocks).
  Sous-composant interne non enregistré → nommer le fichier _Nom.vue.
-->
<template>
  <section ref="root" v-editable="blok" class="py-16 md:py-24 bg-white">
    <div class="max-w-6xl mx-auto px-4">
      <h2 v-if="blok.titre" class="text-3xl md:text-4xl font-bold text-[#0F1729]" data-reveal>
        {{ blok.titre }}
      </h2>
      <span class="block w-16 h-1 mt-4 bg-[#7FD857]" aria-hidden="true" />

      <!-- Asset unique → NuxtImg provider storyblok -->
      <NuxtImg
        v-if="blok.image?.filename"
        provider="storyblok"
        :src="blok.image.filename"
        :alt="blok.image.alt || blok.titre || ''"
        format="webp"
        :quality="80"
        class="mt-8 w-full rounded-3xl object-cover"
        data-reveal
      />

      <!-- Liste : refs sans `as HTMLElement` -->
      <ul v-if="items.length" class="mt-8 grid gap-4 md:grid-cols-3">
        <li
          v-for="(item, i) in items"
          :key="item._uid || i"
          :ref="el => { if (el) itemRefs[i] = el }"
          class="rounded-2xl border border-[#7FD857] p-6 text-[#0F1729]"
          data-reveal
        >
          {{ item.texte }}
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGsapReveal } from '~/composables/useGsapReveal'

// Pas de générique TypeScript dans defineProps (crash Storyblok)
const props = defineProps({ blok: { type: Object, required: true } })

const items = computed(() => props.blok.items || [])
const itemRefs = ref<unknown[]>([])

// Entrée animée : [data-reveal] + gsap.from() (import dynamique, prefers-reduced-motion géré par le composable)
const root = ref(null)
useGsapReveal(root)
</script>
