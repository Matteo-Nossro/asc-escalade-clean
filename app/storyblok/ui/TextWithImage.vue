<template>
  <section v-editable="blok" :id="blok.anchor_id || 'histoire'" class="py-20 bg-white">
    <UContainer>
      <div
        class="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start"
        :class="{ 'lg:flex-row-reverse': blok.reverse_layout }"
      >

        <!-- Colonne Texte -->
        <div class="flex flex-col gap-6 self-start justify-self-start w-full" :class="{ 'lg:order-2': blok.reverse_layout }">
          <div class="flex items-center gap-3 mb-2">
            <UIcon v-if="blok.icon" :name="blok.icon" class="w-8 h-8 text-[#7FD857]" />
            <h2 class="text-3xl font-bold text-[#0F1729]">{{ blok.title }}</h2>
          </div>
          <StoryblokRichText
            :doc="blok.content"
            class="space-y-6 text-gray-600 leading-relaxed text-justify prose max-w-none"
          />
        </div>

        <!-- Colonne Visuel -->
        <div
          class="relative bg-gray-50 rounded-3xl overflow-hidden flex items-center justify-center group w-full"
          :class="imageContainerClass"
          :style="imageContainerStyle"
        >
          <img
            v-if="blok.image?.filename"
            :src="`${blok.image.filename}/m/${imageDimensions}/filters:quality(75):format(webp)`"
            :srcset="`
              ${blok.image.filename}/m/640x0/filters:quality(75):format(webp) 640w,
              ${blok.image.filename}/m/1024x0/filters:quality(75):format(webp) 1024w,
              ${blok.image.filename}/m/1200x0/filters:quality(75):format(webp) 1200w
            `"
            sizes="(max-width: 1024px) 100vw, 50vw"
            :alt="blok.image.alt || blok.title"
            :class="['transition-transform duration-700 group-hover:scale-105', imageClass]"
            :style="imageStyle"
            loading="lazy"
          />
        </div>
      </div>
    </UContainer>
  </section>
</template>

<script setup>
const props = defineProps({
  blok: {
    type: Object,
    required: true
  }
})

const sizeMode    = computed(() => props.blok.image_size_mode || 'fixed_height')
const objectFit   = computed(() => props.blok.image_object_fit || 'cover')

// Dimensions passées aux modifiers Storyblok
const imageDimensions = computed(() => {
  switch (sizeMode.value) {
    case 'auto_height': return '1200x0'   // largeur fixe, hauteur auto
    case 'auto_width':  return '0x400'    // hauteur fixe, largeur auto
    case 'custom':      return '1200x0'
    default:            return '1200x800' // fixed_height
  }
})

// Classe Tailwind sur le CONTENEUR
const imageContainerClass = computed(() => {
  switch (sizeMode.value) {
    case 'auto_height': return 'h-auto'
    case 'auto_width':  return 'h-[400px] w-auto mx-auto'
    case 'custom':      return ''
    default:            return 'h-[400px]'
  }
})

// Style inline sur le CONTENEUR (uniquement pour mode custom)
const imageContainerStyle = computed(() => {
  if (sizeMode.value === 'custom') {
    return {
      height: props.blok.image_height || '400px',
      width: props.blok.image_width || '100%'
    }
  }
  if (sizeMode.value === 'fixed_height' && props.blok.image_height) {
    return { height: props.blok.image_height }
  }
  return {}
})

// Classe Tailwind sur l'IMAGE
const imageClass = computed(() => {
  const fit = objectFit.value === 'contain' ? 'object-contain' : 'object-cover'
  switch (sizeMode.value) {
    case 'auto_height': return `w-full h-auto ${fit}`
    case 'auto_width':  return `h-full w-auto ${fit}`
    default:            return `w-full h-full ${fit}`
  }
})

// Style inline sur l'IMAGE
const imageStyle = computed(() => {
  if (sizeMode.value === 'custom') {
    return { width: '100%', height: '100%' }
  }
  return {}
})
</script>
