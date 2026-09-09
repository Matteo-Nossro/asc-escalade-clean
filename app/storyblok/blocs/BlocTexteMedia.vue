<template>
  <SectionShell
    v-editable="blok"
    :fond="blok.fond"
    :anchor-id="blok.anchor_id"
    :surtitre="blok.surtitre"
    :titre="blok.titre"
    largeur="normale"
  >
    <div
      class="grid md:grid-cols-2 gap-8 md:gap-12 items-center"
      :class="{ 'md:[&>*:first-child]:order-2': blok.image_a_gauche }"
      data-reveal
    >
      <!-- Média -->
      <div class="rounded-3xl overflow-hidden shadow-lg">
        <NuxtImg
          v-if="blok.image?.filename"
          provider="storyblok"
          :src="blok.image.filename"
          :alt="blok.image.alt || blok.titre || ''"
          class="w-full h-full object-cover"
        />
        <div v-else class="aspect-video bg-gray-100 flex items-center justify-center">
          <UIcon name="i-heroicons-photo" class="w-12 h-12 text-gray-300" />
        </div>
      </div>

      <!-- Texte -->
      <div>
        <span
          v-if="blok.media_surtitre"
          class="text-[var(--vp-green-text)] font-bold uppercase tracking-wider text-sm"
        >
          {{ blok.media_surtitre }}
        </span>
        <h3
          v-if="blok.media_titre"
          class="text-2xl md:text-3xl font-bold mt-2 mb-4"
          :class="fond.titre"
        >
          {{ blok.media_titre }}
        </h3>
        <div
          v-if="html"
          class="prose max-w-none"
          :class="fond.sombre ? 'prose-invert' : ''"
          v-html="html"
        />
        <div v-if="boutons.length" class="mt-6 flex flex-wrap gap-3">
          <BlocBouton v-for="(b, i) in boutons" :key="b._uid || i" :blok="b" />
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
const html = computed(() =>
  props.blok.texte && props.blok.texte.content?.length ? renderRichText(props.blok.texte) : '',
)
const boutons = computed(() => props.blok.boutons || [])
</script>
