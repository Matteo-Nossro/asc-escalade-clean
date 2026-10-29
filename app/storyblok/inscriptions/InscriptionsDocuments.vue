<template>
  <section
    :id="blok.anchor_id || 'documents'"
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
          {{ blok.title || 'Les documents à préparer' }}
        </h2>
        <p v-if="blok.intro" class="mt-3" :class="fond.texte">{{ blok.intro }}</p>
      </div>

      <div class="grid lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
        <div
          v-for="(groupe, gi) in colonnes"
          :key="groupe._uid || gi"
          data-reveal
          class="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8"
        >
          <div class="flex items-center gap-3 mb-6">
            <div class="w-11 h-11 rounded-2xl bg-vp-green/15 flex items-center justify-center flex-shrink-0">
              <UIcon :name="groupe.icon || 'i-heroicons-user'" class="w-6 h-6 text-vp-dark" />
            </div>
            <h3 class="text-lg font-bold text-vp-dark">
              {{ groupe.titre }}
              <span v-if="groupe.sous_titre" class="font-medium text-gray-400 text-sm">
                — {{ groupe.sous_titre }}
              </span>
            </h3>
          </div>
          <ul class="space-y-3">
            <li v-for="(doc, di) in groupe.documents || []" :key="doc._uid || di">
              <a
                v-bind="linkAttrs(doc)"
                class="group flex items-center gap-3 rounded-xl border border-gray-100 p-3 hover:border-vp-green hover:bg-vp-green/5 transition-colors"
              >
                <UIcon :name="doc.icon || 'i-heroicons-document-text'" class="w-5 h-5 text-vp-dark flex-shrink-0" />
                <span class="flex-1 min-w-0">
                  <span class="block text-sm font-bold text-vp-dark">{{ doc.titre }}</span>
                  <span v-if="doc.hint" class="block text-xs text-gray-500">{{ doc.hint }}</span>
                </span>
                <UIcon
                  name="i-heroicons-arrow-down-tray"
                  class="w-4 h-4 text-gray-400 group-hover:text-vp-green transition-colors flex-shrink-0"
                />
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div v-if="documentSeul" data-reveal class="max-w-5xl mx-auto mt-6">
        <a
          v-bind="linkAttrs(documentSeul)"
          class="group flex items-center gap-4 rounded-3xl border border-gray-100 bg-white shadow-sm p-6 hover:border-vp-green hover:shadow-lg transition-all"
        >
          <div class="w-11 h-11 rounded-2xl bg-vp-green/15 flex items-center justify-center flex-shrink-0">
            <UIcon :name="documentSeul.icon || 'i-heroicons-heart'" class="w-6 h-6 text-vp-dark" />
          </div>
          <span class="flex-1 min-w-0">
            <span class="block font-bold text-vp-dark">{{ documentSeul.titre }}</span>
            <span v-if="documentSeul.hint" class="block text-xs text-gray-500">{{ documentSeul.hint }}</span>
          </span>
          <span class="inline-flex items-center gap-1.5 text-sm font-semibold text-vp-dark group-hover:text-vp-green transition-colors flex-shrink-0">
            <UIcon name="i-heroicons-arrow-down-tray" class="w-4 h-4" />
            <span class="hidden sm:inline">Télécharger</span>
          </span>
        </a>
      </div>
    </UContainer>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'

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
const colonnes = computed(() => props.blok.colonnes || [])
const documentSeul = computed(() => (props.blok.document_seul || [])[0] || null)

// `doc` : un blok `inscriptions-doc` → asset `fichier` en priorité, sinon `url_externe`
const linkAttrs = (doc) => {
  const { href, external } = resolveFileOrLink(doc?.fichier, doc?.url_externe)
  return {
    href: href || '#',
    ...(external ? { target: '_blank', rel: 'noopener' } : {}),
  }
}
</script>
