<!-- Ligne « document à télécharger » — usage interne (bloc-documents). -->
<template>
  <a
    v-bind="attrs"
    class="group flex items-center gap-3 rounded-xl border border-gray-100 p-3 hover:border-[#7FD857] hover:bg-[#7FD857]/5 transition-colors"
  >
    <UIcon :name="doc.icon || 'i-heroicons-document-text'" class="w-5 h-5 text-[#0F1729] flex-shrink-0" />
    <span class="flex-1 min-w-0">
      <span class="block text-sm font-bold text-[#0F1729]">{{ doc.titre || 'Document' }}</span>
      <span v-if="doc.hint" class="block text-xs text-gray-500">{{ doc.hint }}</span>
    </span>
    <UIcon
      name="i-heroicons-arrow-down-tray"
      class="w-4 h-4 text-gray-400 group-hover:text-[#7FD857] transition-colors flex-shrink-0"
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
