<!-- Ligne « document à télécharger » — usage interne (bloc-documents). -->
<template>
  <a
    v-bind="attrs"
    class="group flex items-center gap-3 rounded-xl border border-gray-100 p-3 hover:border-vp-green hover:bg-vp-green/5 transition-colors"
  >
    <UIcon :name="doc.icon || 'i-heroicons-document-text'" class="w-5 h-5 text-vp-dark flex-shrink-0" />
    <span class="flex-1 min-w-0">
      <span class="block text-sm font-bold text-vp-dark">{{ doc.titre || 'Document' }}</span>
      <span v-if="doc.hint" class="block text-xs text-gray-500">{{ doc.hint }}</span>
    </span>
    <UIcon
      name="i-heroicons-arrow-down-tray"
      class="w-4 h-4 text-gray-400 group-hover:text-vp-green transition-colors flex-shrink-0"
    />
  </a>
</template>

<script setup>
import { computed } from 'vue'
import { useStoryblokLink } from '~/composables/useStoryblokLink'

const props = defineProps({ doc: { type: Object, required: true } })

const { resolveFileOrLink } = useStoryblokLink()
const attrs = computed(() => {
  const { href, external } = resolveFileOrLink(props.doc?.fichier, props.doc?.url_externe)
  return { href: href || '#', ...(external ? { target: '_blank', rel: 'noopener' } : {}) }
})
</script>
