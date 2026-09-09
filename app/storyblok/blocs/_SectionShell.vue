<!--
  Châssis commun à tous les blocs `bloc-*`.
  Gère : fond (blanc/gris/vert/bleu-nuit), ancre, largeur, padding vertical,
  révélation GSAP au scroll, et l'en-tête standard (surtitre + titre + intro).

  Ce composant n'est PAS un bloc Storyblok : il est utilisé en interne.

  Quand un ancêtre fournit `blocDansModal = true` (bloc-popup), le châssis se
  réduit : pas de <section> pleine largeur, pas de padding vertical, pas de fond.

  Props :
    - fond        : 'blanc' | 'gris' | 'vert' | 'bleu-nuit'
    - anchorId    : id d'ancre (#...)
    - surtitre / titre / intro : en-tête optionnel, centré
    - largeur     : 'lisible' (max-w-3xl, texte pur) | 'normale' (max-w-6xl) |
                    'large' (pleine largeur du conteneur, ~1760px — comme les pages club/accueil, défaut)
    - compact     : réduit le padding vertical
  Slots :
    - défaut : le contenu du bloc
    - #header : remplace l'en-tête standard
-->
<template>
  <component
    :is="dansModal ? 'div' : 'section'"
    :id="anchorId || undefined"
    ref="root"
    :class="[
      dansModal ? '' : 'scroll-mt-28',
      dansModal ? '' : fondClasses.section,
      dansModal ? '' : compact ? 'py-10 md:py-14' : 'py-16 md:py-24',
    ]"
  >
    <component :is="dansModal ? 'div' : 'UContainer'">
      <div
        v-if="$slots.header || surtitre || titre || intro"
        class="text-center max-w-3xl mx-auto"
        :class="dansModal ? 'mb-6' : 'mb-12'"
        data-reveal
      >
        <slot name="header">
          <span
            v-if="surtitre"
            class="text-[var(--vp-green-text)] font-bold uppercase tracking-wider text-sm"
          >
            {{ surtitre }}
          </span>
          <h2
            v-if="titre"
            class="font-bold mt-2"
            :class="[dansModal ? 'text-xl md:text-2xl' : 'text-3xl md:text-4xl', fondClasses.titre]"
          >
            {{ titre }}
          </h2>
          <p v-if="intro" class="mt-3" :class="fondClasses.texte">{{ intro }}</p>
        </slot>
      </div>

      <div :class="dansModal ? 'w-full' : contentWidth">
        <slot />
      </div>
    </component>
  </component>
</template>

<script setup>
import { ref, computed, inject } from 'vue'
import { useSectionFond } from '~/composables/useSectionFond'

const props = defineProps({
  fond: { type: String, default: 'blanc' },
  anchorId: { type: String, default: '' },
  surtitre: { type: String, default: '' },
  titre: { type: String, default: '' },
  intro: { type: String, default: '' },
  largeur: { type: String, default: 'large' },
  compact: { type: Boolean, default: false },
})

const dansModal = inject('blocDansModal', false)

const root = ref(null)
useGsapReveal(root)

const fondClasses = useSectionFond(() => props.fond)

const contentWidth = computed(
  () =>
    ({
      lisible: 'max-w-3xl mx-auto',
      normale: 'max-w-6xl mx-auto',
      large: 'w-full',
    })[props.largeur] || 'w-full',
)
</script>
