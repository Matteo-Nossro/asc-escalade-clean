<template>
  <section v-editable="blok" class="py-12 bg-white gsap-reveal">
    <UContainer>
      <div class="max-w-3xl mx-auto">
        <h3 class="text-2xl font-bold text-[#0F1729] mb-8 text-center">{{ blok.title }}</h3>
        
        <UTabs :items="tabItems" class="w-full">
          <template #item="{ item }">
            <UCard class="mt-4 shadow-sm border-0 bg-white">
              <div class="prose max-w-none text-gray-600" v-html="item.richContent"></div>
            </UCard>
          </template>
        </UTabs>
      </div>
    </UContainer>
  </section>
</template>


<script setup>
import { computed } from 'vue'
import { renderRichText } from '@storyblok/vue'

const props = defineProps({ blok: Object })

const tabItems = computed(() => {
  return props.blok.tabs?.map(tab => ({
    label: tab.label,
    // `content` peut être un champ Richtext (objet) ou un simple texte.
    richContent: typeof tab.content === 'string' ? tab.content : renderRichText(tab.content)
  })) || []
})
</script>
