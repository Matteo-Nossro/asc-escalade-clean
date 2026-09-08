<template>
  <section
    :id="blok.anchor_id || undefined"
    ref="root"
    v-editable="blok"
    class="scroll-mt-28 py-16 md:py-24"
    :class="fond.section"
  >
    <UContainer>
      <div
        v-if="blok.title || blok.surtitre"
        class="max-w-2xl mx-auto text-center mb-12"
        data-reveal
      >
        <span
          v-if="blok.surtitre"
          class="text-[var(--vp-green-text)] font-bold uppercase tracking-wider text-sm"
        >
          {{ blok.surtitre }}
        </span>
        <h2 v-if="blok.title" class="text-3xl md:text-4xl font-bold mt-2" :class="fond.titre">
          {{ blok.title }}
        </h2>
      </div>

      <div class="grid lg:grid-cols-2 gap-6 max-w-5xl mx-auto items-stretch">
        <div
          v-for="(carte, i) in cartes"
          :key="carte._uid || i"
          data-reveal
          class="rounded-3xl p-8 flex flex-col"
          :class="carte.theme === 'fonce'
            ? 'bg-[#0F1729] text-white shadow-lg'
            : 'bg-white border border-gray-100 shadow-sm'"
        >
          <div
            v-if="carte.icon"
            class="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
            :class="carte.theme === 'fonce' ? 'bg-white/10' : 'bg-[#7FD857]/15'"
          >
            <UIcon
              :name="carte.icon"
              class="w-6 h-6"
              :class="carte.theme === 'fonce' ? 'text-[#7FD857]' : 'text-[#0F1729]'"
            />
          </div>

          <h3
            class="text-xl font-bold mb-3"
            :class="carte.theme === 'fonce' ? 'text-white' : 'text-[#0F1729]'"
          >
            {{ carte.titre }}
          </h3>

          <div
            v-if="renderedTexte(carte).length"
            class="text-sm flex-grow [&_p]:mb-4 [&_p:last-child]:mb-0"
            :class="carte.theme === 'fonce'
              ? 'text-white/80 [&_strong]:text-white'
              : 'text-gray-600 [&_strong]:text-[#0F1729]'"
            v-html="renderedTexte(carte)"
          />

          <ul v-if="(carte.liens || []).length" class="mt-4 space-y-2">
            <li v-for="(lien, li) in carte.liens" :key="lien._uid || li">
              <a
                v-bind="linkAttrs(lien)"
                class="inline-flex items-center gap-1.5 text-sm font-semibold transition-colors"
                :class="carte.theme === 'fonce'
                  ? 'text-[#7FD857] hover:underline'
                  : 'text-[#0F1729] hover:text-[#7FD857]'"
              >
                <UIcon :name="lien.icon || 'i-heroicons-arrow-top-right-on-square'" class="w-4 h-4" />
                {{ lien.label }}
              </a>
            </li>
          </ul>

          <UButton
            v-if="carte.bouton_label && btn(carte).href"
            :to="btn(carte).external ? undefined : btn(carte).href"
            :href="btn(carte).external ? btn(carte).href : undefined"
            :target="btn(carte).external ? '_blank' : undefined"
            :rel="btn(carte).external ? 'noopener' : undefined"
            size="lg"
            :trailing-icon="btn(carte).external ? 'i-heroicons-arrow-top-right-on-square' : 'i-heroicons-arrow-right'"
            class="mt-6 self-start font-bold"
            :class="buttonClass(carte.bouton_style)"
          >
            {{ carte.bouton_label }}
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
const cartes = computed(() => props.blok.cartes || [])

const renderedTexte = (carte) =>
  carte.texte && carte.texte.content?.length ? renderRichText(carte.texte) : ''

// bouton de carte : asset `bouton_fichier` en priorité, sinon lien `bouton_lien`
const btn = (carte) => resolveFileOrLink(carte.bouton_fichier, carte.bouton_lien)

// item `inscriptions-lien` : asset `fichier` en priorité, sinon `lien`
const linkAttrs = (lien) => {
  const { href, external } = resolveFileOrLink(lien?.fichier, lien?.lien)
  return {
    href: href || '#',
    ...(external ? { target: '_blank', rel: 'noopener' } : {}),
  }
}

const buttonClass = (style) => {
  switch (style) {
    case 'sombre':
      return 'bg-[#0F1729] hover:bg-[#1a2740] text-white'
    case 'outline':
      return 'border border-[#0F1729] text-[#0F1729] bg-transparent hover:bg-[#0F1729] hover:text-white'
    default:
      return 'bg-[#7FD857] hover:bg-[#6bc546] text-[#0F1729]'
  }
}
</script>
