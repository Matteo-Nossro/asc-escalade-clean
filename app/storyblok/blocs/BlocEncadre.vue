<template>
  <SectionShell v-editable="blok" :fond="blok.fond" :anchor-id="blok.anchor_id" largeur="normale" compact>
    <div
      data-reveal
      class="flex items-start gap-4 rounded-2xl p-5 md:p-6 border"
      :class="styles.conteneur"
    >
      <UIcon :name="blok.icon || styles.icon" class="w-6 h-6 flex-shrink-0 mt-0.5" :class="styles.iconColor" />
      <div class="min-w-0">
        <p v-if="blok.titre" class="font-bold" :class="styles.titre">{{ blok.titre }}</p>
        <div
          v-if="html"
          class="text-sm [&_p]:mb-2 [&_p:last-child]:mb-0"
          :class="[blok.titre ? 'mt-1' : '', styles.texte]"
          v-html="html"
        />
      </div>
    </div>
  </SectionShell>
</template>

<script setup>
import { computed } from 'vue'
import { renderRichText } from '@storyblok/vue'
import SectionShell from './_SectionShell.vue'

const props = defineProps({ blok: { type: Object, required: true } })

const html = computed(() =>
  props.blok.texte && props.blok.texte.content?.length ? renderRichText(props.blok.texte) : '',
)

const styles = computed(() => {
  switch (props.blok.type) {
    case 'succes':
      return {
        conteneur: 'bg-[#7FD857]/10 border-[#7FD857]/30',
        icon: 'i-heroicons-check-circle',
        iconColor: 'text-[#7FD857]',
        titre: 'text-[#0F1729]',
        texte: 'text-gray-700',
      }
    case 'attention':
      return {
        conteneur: 'bg-amber-50 border-amber-200',
        icon: 'i-heroicons-exclamation-triangle',
        iconColor: 'text-amber-500',
        titre: 'text-amber-900',
        texte: 'text-amber-800',
      }
    case 'sombre':
      return {
        conteneur: 'bg-[#0F1729] border-transparent',
        icon: 'i-heroicons-information-circle',
        iconColor: 'text-[#7FD857]',
        titre: 'text-white',
        texte: 'text-white/80',
      }
    default:
      return {
        conteneur: 'bg-gray-50 border-gray-200',
        icon: 'i-heroicons-information-circle',
        iconColor: 'text-[#0F1729]',
        titre: 'text-[#0F1729]',
        texte: 'text-gray-600',
      }
  }
})
</script>
