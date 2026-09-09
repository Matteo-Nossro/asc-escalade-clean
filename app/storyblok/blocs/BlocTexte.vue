<template>
  <SectionShell
    v-editable="blok"
    :fond="blok.fond"
    :anchor-id="blok.anchor_id"
    :surtitre="blok.surtitre"
    :titre="blok.titre"
    largeur="lisible"
  >
    <div
      v-if="html"
      data-reveal
      class="prose prose-lg max-w-none"
      :class="fond.sombre ? 'prose-invert' : ''"
      v-html="html"
    />
    <div v-if="boutons.length" data-reveal class="mt-8 flex flex-wrap gap-3" :class="alignement">
      <BlocBouton v-for="(b, i) in boutons" :key="b._uid || i" :blok="b" />
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
const html = computed(() =>
  props.blok.contenu && props.blok.contenu.content?.length ? renderRichText(props.blok.contenu) : '',
)
const boutons = computed(() => props.blok.boutons || [])
const alignement = computed(() => (props.blok.alignement === 'centre' ? 'justify-center' : 'justify-start'))
</script>
