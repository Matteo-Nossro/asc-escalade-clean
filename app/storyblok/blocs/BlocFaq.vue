<template>
  <SectionShell
    v-editable="blok"
    :fond="blok.fond"
    :anchor-id="blok.anchor_id"
    :surtitre="blok.surtitre"
    :titre="blok.titre || 'Questions fréquentes'"
    :intro="blok.intro"
    largeur="lisible"
  >
    <div class="space-y-3">
      <div
        v-for="(item, i) in items"
        :key="item._uid || i"
        data-reveal
        class="rounded-2xl border overflow-hidden"
        :class="fond.sombre ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-white'"
      >
        <button
          type="button"
          class="w-full flex items-center justify-between gap-4 p-5 text-left font-bold"
          :class="fond.titre"
          :aria-expanded="ouvert === i"
          @click="ouvert = ouvert === i ? -1 : i"
        >
          {{ item.question }}
          <UIcon
            name="i-heroicons-chevron-down"
            class="w-5 h-5 flex-shrink-0 transition-transform duration-300 text-[#7FD857]"
            :class="{ 'rotate-180': ouvert === i }"
          />
        </button>
        <div
          class="grid transition-[grid-template-rows] duration-300 ease-out"
          :class="ouvert === i ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
        >
          <div class="overflow-hidden">
            <div
              v-if="rendered(item)"
              class="px-5 pb-5 text-sm transition-opacity duration-300 [&_p]:mb-2 [&_p:last-child]:mb-0"
              :class="[
                fond.sombre ? 'text-white/70' : 'text-gray-600',
                ouvert === i ? 'opacity-100' : 'opacity-0',
              ]"
              v-html="rendered(item)"
            />
          </div>
        </div>
      </div>
    </div>
  </SectionShell>
</template>

<script setup>
import { ref, computed } from 'vue'
import { renderRichText } from '@storyblok/vue'
import SectionShell from './_SectionShell.vue'
import { useSectionFond } from '~/composables/useSectionFond'

const props = defineProps({ blok: { type: Object, required: true } })

const fond = useSectionFond(() => props.blok.fond)
const ouvert = ref(0)
const items = computed(() => props.blok.items || [])
const rendered = (item) =>
  item.reponse && item.reponse.content?.length ? renderRichText(item.reponse) : ''

// JSON-LD FAQPage (SEO)
const texteBrut = (doc) =>
  (doc?.content || [])
    .flatMap((n) => (n.content || []).map((c) => c.text || ''))
    .join(' ')
    .trim()

useHead({
  script: computed(() => {
    const valides = items.value.filter((i) => i.question && texteBrut(i.reponse))
    if (!valides.length) return []
    return [
      {
        type: 'application/ld+json',
        innerHTML: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: valides.map((i) => ({
            '@type': 'Question',
            name: i.question,
            acceptedAnswer: { '@type': 'Answer', text: texteBrut(i.reponse) },
          })),
        }),
      },
    ]
  }),
})
</script>
