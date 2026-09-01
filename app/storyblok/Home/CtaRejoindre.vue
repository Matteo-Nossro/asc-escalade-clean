<template>
  <section v-editable="blok" class="relative py-32 overflow-hidden">

    <!-- Image de fond -->
    <div class="absolute inset-0 z-0">
      <img
        v-if="blok.backgroundImage?.filename"
        :src="`${blok.backgroundImage.filename}/m/1920x1080/filters:quality(75):format(webp)`"
        :srcset="`
          ${blok.backgroundImage.filename}/m/640x360/filters:quality(75):format(webp) 640w,
          ${blok.backgroundImage.filename}/m/1024x576/filters:quality(75):format(webp) 1024w,
          ${blok.backgroundImage.filename}/m/1920x1080/filters:quality(75):format(webp) 1920w
        `"
        sizes="100vw"
        :alt="blok.backgroundImage.alt || 'Mur d\'escalade sombre'"
        loading="lazy"
        class="w-full h-full object-cover"
      />
      <img
        v-else
        src="https://images.unsplash.com/photo-1516592673884-4a382d1124c2?q=75&w=1920&auto=format&fit=crop&fm=webp"
        srcset="
          https://images.unsplash.com/photo-1516592673884-4a382d1124c2?q=75&w=640&auto=format&fit=crop&fm=webp 640w,
          https://images.unsplash.com/photo-1516592673884-4a382d1124c2?q=75&w=1024&auto=format&fit=crop&fm=webp 1024w,
          https://images.unsplash.com/photo-1516592673884-4a382d1124c2?q=75&w=1920&auto=format&fit=crop&fm=webp 1920w
        "
        sizes="100vw"
        alt="Mur d'escalade sombre"
        loading="lazy"
        class="w-full h-full object-cover"
      />
      <div class="absolute inset-0 bg-[#0F1729]/90 mix-blend-multiply"></div>
      <div class="absolute inset-0 bg-gradient-to-t from-[#0F1729] via-transparent to-[#0F1729]/50"></div>
    </div>

    <UContainer class="relative z-10 text-center">
      <div class="max-w-3xl mx-auto flex flex-col items-center gap-8">

        <!-- Titre -->
        <h2 class="text-3xl md:text-5xl font-bold text-white leading-tight">
          {{ blok.title }}
        </h2>

        <!-- Texte descriptif -->
        <p class="text-gray-300 text-lg md:text-xl leading-relaxed max-w-2xl">
          {{ blok.description }}
        </p>

        <!-- Bouton d'action -->
        <UButton
          :to="blok.ctaButton[0].link.cached_url"
          size="xl"
          class="font-bold px-8 py-4 transition-transform hover:scale-105 bg-[#7FD857] hover:bg-[#6bc745] text-[#0F1729]"
          :ui="{ rounded: 'rounded-md' }"
        >
          {{ blok.ctaButton[0].text }}
        </UButton>

      </div>
    </UContainer>

    <!-- Éléments décoratifs -->
    <div class="absolute top-1/2 left-10 w-64 h-64 bg-[#7FD857] rounded-full mix-blend-overlay filter blur-[100px] opacity-20 animate-pulse"></div>
    <div class="absolute bottom-0 right-10 w-96 h-96 bg-blue-500 rounded-full mix-blend-overlay filter blur-[120px] opacity-20"></div>

  </section>
</template>

<script setup lang="ts">
defineProps({ blok: Object })
</script>
