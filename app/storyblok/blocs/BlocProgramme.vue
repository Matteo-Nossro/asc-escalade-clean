<template>
  <SectionShell
    v-editable="blok"
    :fond="blok.fond"
    :anchor-id="blok.anchor_id"
    :surtitre="blok.surtitre"
    :titre="blok.titre"
    :intro="blok.intro"
    largeur="normale"
  >
    <ol class="space-y-4">
      <li
        v-for="(etape, i) in etapes"
        :key="etape._uid || i"
        data-reveal
        class="flex gap-4 rounded-2xl p-6"
        :class="fond.sombre ? 'bg-white/5 border border-white/10' : 'bg-gray-50'"
      >
        <span
          class="w-9 h-9 rounded-full bg-[#0F1729] text-white text-sm font-bold flex items-center justify-center flex-shrink-0"
        >
          {{ etape.numero || i + 1 }}
        </span>
        <div class="flex-grow">
          <div class="flex flex-wrap items-baseline gap-x-3">
            <h3 class="font-bold" :class="fond.titre">{{ etape.titre }}</h3>
            <span v-if="etape.horaire" class="text-sm font-medium text-[var(--vp-green-text)]">
              {{ etape.horaire }}
            </span>
          </div>
          <div
            v-if="rendered(etape)"
            class="text-sm mt-1 [&_p]:mb-2 [&_p:last-child]:mb-0"
            :class="fond.sombre ? 'text-white/70' : 'text-gray-600'"
            v-html="rendered(etape)"
          />
          <div v-if="(etape.bouton || []).length" class="mt-3">
            <BlocBouton :blok="etape.bouton[0]" />
          </div>
        </div>
      </li>
    </ol>
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
const etapes = computed(() => props.blok.etapes || [])
const rendered = (e) => (e.texte && e.texte.content?.length ? renderRichText(e.texte) : '')
</script>
