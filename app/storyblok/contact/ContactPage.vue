<template>
  <div v-editable="blok" class="min-h-screen relative pb-32 overflow-hidden">

    <!-- Déco Fond Géométrique (Triangles gris très légers) -->
    <svg class="absolute top-0 left-0 w-full h-full pointer-events-none opacity-40" viewBox="0 0 1440 800" fill="none" preserveAspectRatio="none">
      <path d="M-100 0 L600 800 L1500 0 Z" fill="#F3F4F6"/>
      <path d="M1200 800 L800 0 L1600 0 Z" fill="#E5E7EB" opacity="0.5"/>
    </svg>

    <UContainer class="relative z-10 min-h-screen">

      <!-- Bloks pleine largeur (header, etc.) -->
      <StoryblokComponent
        v-for="currentBlok in topBloks"
        :key="currentBlok._uid"
        :blok="currentBlok"
      />

      <!-- Layout 2 colonnes : Infos à gauche, Formulaire à droite -->
      <div v-if="infosBlok || formBlok" class="mx-auto flex flex-col lg:flex-row min-h-[600px]">
        <div v-if="infosBlok" class="w-full lg:w-[35%] p-2 lg:p-3">
          <StoryblokComponent :blok="infosBlok" />
        </div>
        <div v-if="formBlok" class="w-full lg:w-[65%] p-4 lg:p-6">
          <StoryblokComponent :blok="formBlok" />
        </div>
      </div>

    </UContainer>

  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  blok: {
    type: Object,
    required: true
  }
})

const body = computed(() => props.blok.body || [])

// Bloks affichés pleine largeur (tout sauf infos et form)
const topBloks = computed(() =>
  body.value.filter(b => b.component !== 'contact-infos' && b.component !== 'contact-form')
)

const infosBlok = computed(() => body.value.find(b => b.component === 'contact-infos'))
const formBlok = computed(() => body.value.find(b => b.component === 'contact-form'))
</script>
