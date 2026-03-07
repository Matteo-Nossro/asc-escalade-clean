<template>
  <section v-editable="blok" class="py-12 bg-white">
    <UContainer>
      <div class="w-full h-[50vh] md:h-[60vh] rounded-[2rem] overflow-hidden shadow-md relative">
        
        <!-- Si on a un lien -->
        <NuxtLink 
          v-if="resolvedLink" 
          :to="resolvedLink" 
          :target="blok.link?.target"
          class="block w-full h-full group"
        >
          <img 
            v-if="blok.image?.filename"
            :src="blok.image.filename" 
            :alt="blok.image.alt || 'Image mise en avant'" 
            class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </NuxtLink>

        <!-- Si on n'a PAS de lien -->
        <div v-else class="w-full h-full">
          <img 
            v-if="blok.image?.filename"
            :src="blok.image.filename" 
            :alt="blok.image.alt || 'Image mise en avant'" 
            class="w-full h-full object-cover"
          />
        </div>

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

// Storyblok retourne l'URL de différentes façons selon le type de lien (interne, externe)
const resolvedLink = computed(() => {
  if (!props.blok.link) return null
  
  if (props.blok.link.linktype === 'story') {
    // Lien interne vers une autre story (ajoute le slash initial s'il n'y est pas)
    return props.blok.link.cached_url?.startsWith('/') 
      ? props.blok.link.cached_url 
      : `/${props.blok.link.cached_url}`
  }
  
  if (props.blok.link.linktype === 'url') {
    // Lien externe (http://...)
    return props.blok.link.url
  }
  
  return null
})
</script>
