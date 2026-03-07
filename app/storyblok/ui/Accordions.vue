<template>
  <section v-editable="blok" class="py-12 bg-white gsap-reveal">
    <UContainer>
      <div class="max-w-3xl mx-auto">
        <h3 class="text-3xl font-bold text-[#0F1729] mb-8">{{ blok.title || 'Foire Aux Questions' }}</h3>
        <UAccordion :items="accordionItems" size="xl" variant="ghost" color="primary" />
      </div>
    </UContainer>
  </section>
</template>


<script setup>
import { computed } from 'vue'

const props = defineProps({ blok: Object })

// On formate les données de Storyblok pour Nuxt UI
const accordionItems = computed(() => {
  return props.blok.faq_items?.map(item => ({
    label: item.question,
    content: item.answer,
    icon: 'i-heroicons-question-mark-circle' // Icône optionnelle Nuxt UI
  })) || []
})
</script>
