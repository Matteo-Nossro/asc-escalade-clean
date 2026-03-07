<template>
  <section v-editable="blok" class="py-12 bg-white">
    <UContainer>
      <!-- Ajout de text-center et mx-auto pour centrer le tout -->
      <div class="mx-auto flex flex-col items-center text-lg leading-relaxed text-gray-600 space-y-6">
        
        <h2 v-if="blok.title" class="text-3xl font-bold text-[#0F1729] mb-2 w-full">
          {{ blok.title }}
        </h2>
        
        <!-- Le prose s'aligne à gauche par défaut, on le centre s'il le faut via CSS ou en le laissant tel quel selon ton design. Ici, je le garde normal mais centré dans le bloc. -->
        <div class="prose prose-lg prose-green w-full max-w-none text-left" v-html="renderedRichText"></div>
      </div>
    </UContainer>
  </section>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  blok: { 
    type: Object, 
    required: true 
  }
})

const renderedRichText = computed(() => {
  return renderRichText(props.blok.content)
})
</script>
