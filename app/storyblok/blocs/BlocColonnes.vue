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
    <div class="grid gap-8 md:gap-10" :class="grille" data-reveal>
      <div
        v-for="(col, i) in colonnes"
        :key="col._uid || i"
        class="flex flex-col"
        :class="centre ? 'items-center text-center [&_.prose]:mx-auto' : ''"
      >
        <NuxtImg
          v-if="col.image?.filename && col.image_position !== 'bas'"
          provider="storyblok"
          :src="col.image.filename"
          :alt="col.image.alt || ''"
          class="w-full rounded-2xl mb-4 object-cover"
        />

        <h3 v-if="col.titre" class="text-xl font-bold mb-2" :class="fond.titre">{{ col.titre }}</h3>

        <div
          v-if="rendered(col)"
          class="prose max-w-none flex-grow"
          :class="fond.sombre ? 'prose-invert' : ''"
          v-html="rendered(col)"
        />

        <NuxtImg
          v-if="col.image?.filename && col.image_position === 'bas'"
          provider="storyblok"
          :src="col.image.filename"
          :alt="col.image.alt || ''"
          class="w-full rounded-2xl mt-4 object-cover"
        />

        <div v-if="(col.bouton || []).length" class="mt-5">
          <BlocBouton v-for="(b, bi) in col.bouton" :key="b._uid || bi" :blok="b" />
        </div>
      </div>
    </div>
  </SectionShell>
</template>

<script setup>
import { computed } from 'vue'
import { renderRichText } from '@storyblok/vue'
import SectionShell from './_SectionShell.vue'
import BlocBouton from './_BlocBouton.vue'
import { useSectionFond } from '~/composables/useSectionFond'

const props = defineProps({ blok: { type: Object, required: true } })

const fond = useSectionFond(() => props.blok.fond)
const colonnes = computed(() => props.blok.colonnes || [])
const centre = computed(() => props.blok.alignement === 'centre')
const rendered = (col) => (col.contenu && col.contenu.content?.length ? renderRichText(col.contenu) : '')

const grille = computed(() => {
  switch (props.blok.disposition) {
    case '2':
      return 'md:grid-cols-2'
    case '3':
      return 'md:grid-cols-3'
    case '60-40':
      return 'md:grid-cols-[3fr_2fr]'
    case '40-60':
      return 'md:grid-cols-[2fr_3fr]'
    default:
      return 'md:grid-cols-2'
  }
})
</script>
