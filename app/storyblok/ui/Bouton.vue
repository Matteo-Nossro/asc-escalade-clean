<template>
  <div class="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
    <!-- Bouton principal -->
    <UButton
      v-if="primary"
      :to="resolveLink(primary.link)"
      size="xl"
      class="group relative bg-[#7FD857] hover:bg-[#6bc745] text-[#0F1729] font-bold px-8 py-4 justify-center overflow-hidden shadow-lg hover:shadow-xl transition-all"
      :ui="{ rounded: 'rounded-full' }"
    >
      <span class="relative z-10 flex items-center gap-2">
        {{ primary.label }}
        <UIcon
          v-if="primary.icon"
          :name="primary.icon"
          class="w-5 h-5 group-hover:translate-x-1 transition-transform"
        />
      </span>
      <div class="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
    </UButton>

    <!-- Bouton secondaire -->
    <UButton
      v-if="secondary"
      :to="resolveLink(secondary.link)"
      size="xl"
      class="group relative bg-white/10 backdrop-blur-md hover:bg-white/20 text-white font-bold px-8 py-4 justify-center border-2 border-white/30 hover:border-white shadow-lg hover:shadow-xl transition-all"
      :ui="{ rounded: 'rounded-full' }"
    >
      <span class="relative z-10 flex items-center gap-2">
        {{ secondary.label }}
        <UIcon
          v-if="secondary.icon"
          :name="secondary.icon"
          class="w-5 h-5 group-hover:scale-110 transition-transform"
        />
      </span>
    </UButton>
  </div>
</template>

<script setup>
const props = defineProps({
  blok: {
    type: Object,
    required: true
  }
})

// On attend blok.primary et blok.secondary comme des sous-blocs "button"
const primary = computed(() => props.blok.primary?.[0] || null)
const secondary = computed(() => props.blok.secondary?.[0] || null)

const resolveLink = (link) => {
  if (!link) return '#'

  if (link.linktype === 'story') {
    return link.cached_url?.startsWith('/')
      ? link.cached_url
      : `/${link.cached_url}`
  }

  if (link.linktype === 'url') {
    return link.url
  }

  if (link.linktype === 'email') {
    return `mailto:${link.email}`
  }

  return '#'
}
</script>
