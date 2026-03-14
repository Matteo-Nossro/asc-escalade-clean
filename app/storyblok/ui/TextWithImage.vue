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
          <div
            class="space-y-6 text-gray-600 leading-relaxed text-justify prose max-w-none"
            v-html="renderRichText(blok.content)"
          ></div>
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
            :alt="blok.image.alt || blok.title"
            :class="['transition-transform duration-700 group-hover:scale-105', imageClass]"
            :style="imageStyle"
            loading="lazy"
          />

          <!-- Visuel SVG de secours -->
          <template v-else>
            <svg class="absolute bottom-0 w-full text-gray-200 opacity-50 transition-transform duration-700 group-hover:scale-105" viewBox="0 0 1440 320" preserveAspectRatio="none">
              <path fill="currentColor" d="M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,181.3C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
            </svg>
            <div class="absolute w-64 h-64 border border-gray-200 rounded-full opacity-50"></div>
            <div class="absolute w-80 h-80 border border-gray-100 rounded-full opacity-30"></div>
            <div class="relative z-10 flex flex-col items-center">
              <div class="w-0 h-0 border-l-[60px] border-l-transparent border-r-[60px] border-r-transparent border-b-[100px] border-b-gray-100 mb-[-60px]"></div>
              <span class="text-6xl font-extrabold text-[#0F1729]/10 select-none tracking-widest">{{ blok.year || '1998' }}</span>
              <span class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-lg font-bold text-[#0F1729] bg-white px-4 py-1 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                {{ blok.year_label || 'Création' }}
              </span>
            </div>
          </template>

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
