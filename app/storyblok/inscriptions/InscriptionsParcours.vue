<template>
  <section
    :id="blok.anchor_id || 'parcours'"
    ref="root"
    v-editable="blok"
    class="scroll-mt-28 py-16 md:py-24"
    :class="fond.section"
  >
    <UContainer>
      <div class="max-w-2xl mx-auto text-center mb-12" data-reveal>
        <span
          v-if="blok.surtitre"
          class="text-[var(--vp-green-text)] font-bold uppercase tracking-wider text-sm"
        >
          {{ blok.surtitre }}
        </span>
        <h2 class="text-3xl md:text-4xl font-bold mt-2" :class="fond.titre">
          {{ blok.title || 'Comment s\'inscrire ?' }}
        </h2>
        <p v-if="blok.description" class="mt-4" :class="fond.texte">{{ blok.description }}</p>
      </div>

      <div class="max-w-4xl mx-auto" data-reveal>
        <UTabs :items="tabItems" class="w-full">
          <template #content="{ item }">
            <ol class="mt-8 space-y-4">
              <li
                v-for="(etape, i) in item.etapes"
                :key="etape._uid || i"
                class="flex gap-4 bg-gray-50 rounded-2xl p-6"
              >
                <span
                  class="w-9 h-9 rounded-full bg-vp-dark text-white text-sm font-bold flex items-center justify-center flex-shrink-0"
                >
                  {{ etape.numero || i + 1 }}
                </span>
                <div class="flex-grow">
                  <h3 class="font-bold text-vp-dark">{{ etape.titre }}</h3>
                  <div
                    v-if="renderedTexte(etape).length"
                    class="text-sm text-gray-600 mt-1 [&_p]:mb-2 [&_strong]:text-vp-dark"
                    v-html="renderedTexte(etape)"
                  />
                  <UButton
                    v-if="etape.bouton_label && btn(etape).href"
                    :to="btn(etape).external ? undefined : btn(etape).href"
                    :href="btn(etape).external ? btn(etape).href : undefined"
                    :target="btn(etape).external ? '_blank' : undefined"
                    :rel="btn(etape).external ? 'noopener' : undefined"
                    trailing-icon="i-heroicons-arrow-top-right-on-square"
                    size="sm"
                    class="mt-3 bg-vp-dark hover:bg-vp-dark-hover text-white font-bold"
                  >
                    {{ etape.bouton_label }}
                  </UButton>
                </div>
              </li>
            </ol>
          </template>
        </UTabs>
      </div>
    </UContainer>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'
import { renderRichText } from '@storyblok/vue'

const props = defineProps({
  blok: {
    type: Object,
    required: true,
  },
})

const { resolveFileOrLink } = useStoryblokLink()

const root = ref(null)
useGsapReveal(root)

const fond = useInscriptionsFond(() => props.blok.fond)
const tabItems = computed(() => [
  {
    label: props.blok.onglet_adulte_label || 'Je m\'inscris (adulte)',
    etapes: props.blok.etapes_adulte || [],
  },
  {
    label: props.blok.onglet_enfant_label || 'J\'inscris mon enfant',
    etapes: props.blok.etapes_enfant || [],
  },
])

const renderedTexte = (etape) =>
  etape.texte && etape.texte.content?.length ? renderRichText(etape.texte) : ''

const btn = (etape) => resolveFileOrLink(etape.bouton_fichier, etape.bouton_lien)
</script>
