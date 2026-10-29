<template>
  <section
    :id="blok.anchor_id || 'sante'"
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
          {{ blok.title || 'Attestation de santé & certificat médical' }}
        </h2>
      </div>

      <div class="grid lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
        <div
          v-for="(etape, i) in etapes"
          :key="etape._uid || i"
          data-reveal
          class="bg-white rounded-3xl shadow-lg p-8 flex flex-col"
        >
          <div class="flex items-center gap-3 mb-4">
            <span
              v-if="etape.numero"
              class="w-8 h-8 rounded-full bg-vp-dark text-white text-sm font-bold flex items-center justify-center flex-shrink-0"
            >
              {{ etape.numero }}
            </span>
            <h3 class="text-lg font-bold text-vp-dark">{{ etape.titre }}</h3>
          </div>

          <div
            v-if="renderedTexte(etape).length"
            class="text-sm text-gray-600 [&_p]:mb-4 [&_strong]:text-vp-dark flex-grow"
            v-html="renderedTexte(etape)"
          />

          <p
            v-if="etape.encadre"
            class="text-sm rounded-xl bg-vp-green/10 text-vp-dark p-3 mt-1"
          >
            {{ etape.encadre }}
          </p>

          <div v-if="(etape.cas || []).length" class="mt-4 space-y-3">
            <div
              v-for="(cas, ci) in etape.cas"
              :key="cas._uid || ci"
              class="border border-gray-100 rounded-xl p-4"
            >
              <span class="text-xs font-bold uppercase tracking-wider text-[var(--vp-green-text)]">
                {{ cas.numero }}
              </span>
              <p class="font-semibold text-vp-dark text-sm mt-1">{{ cas.titre }}</p>
              <p v-if="cas.detail" class="text-xs text-gray-500 mt-1">{{ cas.detail }}</p>
            </div>
          </div>

          <UButton
            v-if="etape.bouton_label && btn(etape).href"
            :to="btn(etape).external ? undefined : btn(etape).href"
            :href="btn(etape).external ? btn(etape).href : undefined"
            :target="btn(etape).external ? '_blank' : undefined"
            :rel="btn(etape).external ? 'noopener' : undefined"
            trailing-icon="i-heroicons-arrow-top-right-on-square"
            size="lg"
            class="mt-6 self-start bg-vp-dark hover:bg-vp-dark-hover text-white font-bold"
          >
            {{ etape.bouton_label }}
          </UButton>
        </div>
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
const etapes = computed(() => props.blok.etapes || [])

const renderedTexte = (etape) =>
  etape.texte && etape.texte.content?.length ? renderRichText(etape.texte) : ''

const btn = (etape) => resolveFileOrLink(etape.bouton_fichier, etape.bouton_lien)
</script>
