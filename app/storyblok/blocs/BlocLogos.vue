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
    <!-- Défilement continu -->
    <div v-if="blok.defilement" class="relative overflow-hidden" data-reveal>
      <div class="flex gap-12 w-max animate-[logos_30s_linear_infinite] hover:[animation-play-state:paused]">
        <component
          :is="lienTag(logo)"
          v-for="(logo, i) in [...logos, ...logos]"
          :key="i"
          v-bind="lienAttrs(logo)"
          class="flex-shrink-0 flex items-center"
        >
          <img
            :src="`${logo.image.filename}/m/240x120/filters:quality(80):format(webp)`"
            :alt="logo.nom || ''"
            class="h-12 md:h-16 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity"
            :class="fond.sombre ? 'brightness-0 invert' : ''"
          />
        </component>
      </div>
    </div>

    <!-- Grille statique -->
    <div
      v-else
      class="flex flex-wrap items-center justify-center gap-x-10 gap-y-8"
      data-reveal
    >
      <component
        :is="lienTag(logo)"
        v-for="(logo, i) in logos"
        :key="logo._uid || i"
        v-bind="lienAttrs(logo)"
        class="flex items-center"
      >
        <img
          :src="`${logo.image.filename}/m/240x120/filters:quality(80):format(webp)`"
          :alt="logo.nom || ''"
          class="h-12 md:h-16 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity"
          :class="fond.sombre ? 'brightness-0 invert' : ''"
        />
      </component>
    </div>
  </SectionShell>
</template>

<script setup>
import { computed } from 'vue'
import SectionShell from './_SectionShell.vue'
import { useSectionFond } from '~/composables/useSectionFond'
import { useStoryblokLink } from '~/composables/useStoryblokLink'

const props = defineProps({ blok: { type: Object, required: true } })

const { resolveLink } = useStoryblokLink()
const fond = useSectionFond(() => props.blok.fond)
const logos = computed(() => (props.blok.logos || []).filter((l) => l && l.image?.filename))

const lienTag = (logo) => (resolveLink(logo.lien).href ? 'a' : 'div')
const lienAttrs = (logo) => {
  const { href, external } = resolveLink(logo.lien)
  return href ? { href, ...(external ? { target: '_blank', rel: 'noopener' } : {}) } : {}
}
</script>

<style scoped>
@keyframes logos {
  to {
    transform: translateX(-50%);
  }
}
</style>
