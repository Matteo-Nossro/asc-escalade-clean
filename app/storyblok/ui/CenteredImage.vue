<template>
  <section v-editable="blok" class="py-12 bg-white">
    <UContainer>
      <div
        class="w-full rounded-[2rem] overflow-hidden shadow-md relative"
        :class="imageContainerClass"
        :style="imageContainerStyle"
      >

        <!-- Avec lien -->
        <NuxtLink
          v-if="resolvedLink"
          :to="resolvedLink"
          :target="blok.link?.target"
          class="block w-full h-full group"
        >
          <img
            v-if="blok.image?.filename"
            :src="`${blok.image.filename}/m/${imageDimensions}/filters:quality(75):format(webp)`"
            :alt="blok.image.alt || 'Image mise en avant'"
            :class="['w-full transition-transform duration-500 group-hover:scale-105', imageClass]"
            loading="lazy"
          />
        </NuxtLink>

        <!-- Sans lien -->
        <div v-else class="w-full h-full">
          <img
            v-if="blok.image?.filename"
            :src="`${blok.image.filename}/m/${imageDimensions}/filters:quality(75):format(webp)`"
            :alt="blok.image.alt || 'Image mise en avant'"
            :class="['w-full', imageClass]"
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

const sizeMode  = computed(() => props.blok.image_size_mode || 'fixed_height')
const objectFit = computed(() => props.blok.image_object_fit || 'cover')

// Dimensions Storyblok Image Service
const imageDimensions = computed(() => {
  switch (sizeMode.value) {
    case 'auto_height': return '1920x0'
    case 'auto_width':  return '0x600'
    case 'custom':      return '1920x0'
    default:            return '1920x1080' // fixed_height
  }
})

// Classe du CONTENEUR
const imageContainerClass = computed(() => {
  switch (sizeMode.value) {
    case 'auto_height': return 'h-auto'
    case 'auto_width':  return 'h-auto w-auto mx-auto'
    case 'custom':      return ''
    default:            return 'h-[50vh] md:h-[60vh]' // défaut d'origine
  }
})

// Style inline CONTENEUR (custom ou override hauteur)
const imageContainerStyle = computed(() => {
  if (sizeMode.value === 'custom') {
    return {
      height: props.blok.image_height || '50vh',
      width:  props.blok.image_width  || '100%'
    }
  }
  if (sizeMode.value === 'fixed_height' && props.blok.image_height) {
    return { height: props.blok.image_height }
  }
  return {}
})

// Classe sur l'IMAGE
const imageClass = computed(() => {
  const fit = objectFit.value === 'contain' ? 'object-contain' : 'object-cover'
  switch (sizeMode.value) {
    case 'auto_height': return `h-auto ${fit}`
    case 'auto_width':  return `h-full w-auto ${fit}`
    default:            return `h-full ${fit}`
  }
})

// Lien résolu
const resolvedLink = computed(() => {
  if (!props.blok.link) return null

  if (props.blok.link.linktype === 'story') {
    return props.blok.link.cached_url?.startsWith('/')
      ? props.blok.link.cached_url
      : `/${props.blok.link.cached_url}`
  }

  if (props.blok.link.linktype === 'url') {
    return props.blok.link.url
  }

  return null
})
</script>
