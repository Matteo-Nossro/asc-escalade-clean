<template>
  <main v-editable="blok" class="bg-white">
    <StoryblokComponent
      v-for="currentBlok in blok.body"
      :key="currentBlok._uid"
      :blok="currentBlok"
    />
  </main>
</template>

<script setup>
defineProps({
  blok: {
    type: Object,
    required: true,
  },
})
</script>
