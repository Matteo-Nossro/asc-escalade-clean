<template>
  <div v-editable="blok">
    <UButton
      v-if="blok.text && blok.link"
      :to="isAsset ? undefined : resolvedLink"
      :href="isAsset ? resolvedLink : undefined"
      :target="isAsset ? '_blank' : undefined"
      :rel="isAsset ? 'noopener noreferrer' : undefined"
      size="xl"
      class="font-bold px-8 py-4 transition-transform hover:scale-105 bg-[#7FD857] hover:bg-[#6bc745] text-[#0F1729]"
      :ui="{ rounded: 'rounded-md' }"
    >
      {{ blok.text }}
    </UButton>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps({ blok: Object })

const isAsset = computed(() => props.blok?.link?.linktype === 'asset')

const resolvedLink = computed((): string => {
  const link = props.blok?.link
  if (!link) return '#'
  const { linktype, url, cached_url, email } = link
  if (linktype === 'asset') return url
  if (linktype === 'url') return url
  if (linktype === 'email') return `mailto:${email}`
  return cached_url?.startsWith('/') ? cached_url : `/${cached_url}`
})
</script>
