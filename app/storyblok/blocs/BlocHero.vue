<template>
  <section
    v-editable="blok"
    class="relative pt-32 pb-16 md:pb-20 overflow-hidden"
    :class="fond.section"
  >
    <!-- Image de fond optionnelle -->
    <div v-if="blok.image_fond?.filename" class="absolute inset-0">
      <NuxtImg
        provider="storyblok"
        :src="blok.image_fond.filename"
        :alt="blok.image_fond.alt || ''"
        class="w-full h-full object-cover"
      />
      <div class="absolute inset-0 bg-[#0F1729]/60" />
    </div>

    <!-- Colline décorative -->
    <div v-else-if="!blok.masquer_colline" class="absolute inset-0 pointer-events-none">
      <svg
        class="absolute bottom-0 left-0 w-full h-[220px]"
        :class="fond.sombre ? 'text-white/5' : 'text-gray-50'"
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
      >
        <path
          fill="currentColor"
          d="M0,160L60,181.3C120,203,240,245,360,240C480,235,600,181,720,181.3C840,181,960,235,1080,234.7C1200,235,1320,181,1380,154.7L1440,128L1440,320L0,320Z"
        />
      </svg>
    </div>

    <UContainer class="relative z-10 text-center">
      <div
        v-if="blok.badge"
        ref="badge"
        class="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm md:text-base font-bold mb-6"
        :class="hasImage ? 'bg-white/15 text-white' : 'bg-[#7FD857]/10 text-[#0F1729]'"
      >
        <UIcon v-if="blok.badge_icon" :name="blok.badge_icon" class="w-5 h-5 text-[#7FD857]" />
        {{ blok.badge }}
      </div>

      <h1
        ref="titre"
        class="text-4xl md:text-6xl font-extrabold mb-4 uppercase tracking-tight"
        :class="hasImage || fond.sombre ? 'text-white' : 'text-[#0F1729]'"
      >
        {{ blok.titre || 'Titre de la page' }}
      </h1>

      <p
        v-if="blok.sous_titre"
        ref="sousTitre"
        class="text-lg md:text-xl font-medium max-w-2xl mx-auto mb-8"
        :class="hasImage || fond.sombre ? 'text-white/80' : 'text-gray-500'"
      >
        {{ blok.sous_titre }}
      </p>

      <div ref="ligne" class="h-1.5 bg-[#7FD857] rounded-full mx-auto mb-8" style="width: 64px" />

      <div v-if="boutons.length" class="flex flex-wrap justify-center gap-3">
        <BlocBouton v-for="(b, i) in boutons" :key="b._uid || i" :blok="b" />
      </div>
    </UContainer>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import BlocBouton from './_BlocBouton.vue'
import { useSectionFond } from '~/composables/useSectionFond'

const props = defineProps({ blok: { type: Object, required: true } })

const fond = useSectionFond(() => props.blok.fond)
const hasImage = computed(() => !!props.blok.image_fond?.filename)
const boutons = computed(() => props.blok.boutons || [])

const badge = ref(null)
const titre = ref(null)
const sousTitre = ref(null)
const ligne = ref(null)

onMounted(async () => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const { gsap } = await import('gsap')
  if (badge.value) gsap.from(badge.value, { opacity: 0, y: 20, duration: 0.7, ease: 'power2.out' })
  if (titre.value) gsap.from(titre.value, { y: 24, duration: 0.9, delay: 0.1, ease: 'power2.out' })
  if (sousTitre.value) gsap.from(sousTitre.value, { opacity: 0, y: 20, duration: 0.8, delay: 0.3, ease: 'power2.out' })
  if (ligne.value) gsap.from(ligne.value, { opacity: 0, width: 0, duration: 0.6, delay: 0.5, ease: 'power2.out' })
})
</script>
