<!--
  Châssis commun à tous les blocs `bloc-*`.
  Gère : fond (blanc/gris/vert/bleu-nuit), ancre, largeur, padding vertical,
  révélation GSAP au scroll, et l'en-tête standard (surtitre + titre + intro).

  Ce composant n'est PAS un bloc Storyblok : il est utilisé en interne.

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
  <section
    :id="anchorId || undefined"
    ref="root"
    class="scroll-mt-28"
    :class="[fondClasses.section, compact ? 'py-10 md:py-14' : 'py-16 md:py-24']"
  >
    <UContainer>
      <div
        v-if="$slots.header || surtitre || titre || intro"
        class="text-center mb-12"
        :class="headerWidth"
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
            class="text-3xl md:text-4xl font-bold mt-2"
            :class="fondClasses.titre"
          >
            {{ titre }}
          </h2>
          <p v-if="intro" class="mt-3" :class="fondClasses.texte">{{ intro }}</p>
        </slot>
      </div>

      <div :class="contentWidth">
        <slot />
      </div>
    </UContainer>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'
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

const headerWidth = computed(() => (props.largeur === 'lisible' ? 'max-w-3xl mx-auto' : 'max-w-3xl mx-auto'))
</script>
