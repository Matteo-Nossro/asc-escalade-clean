<template>
  <section
    v-editable="blok"
    class="relative pt-32 pb-16 md:pb-20 overflow-hidden"
    :class="fond.section"
  >
    <!-- Colline décorative (non éditable) -->
    <div class="absolute inset-0 pointer-events-none">
      <svg
        class="absolute bottom-0 left-0 w-full h-[220px] text-gray-50"
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
        class="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#7FD857]/10 text-[#0F1729] font-bold text-sm md:text-base mb-6"
      >
        <UIcon name="i-heroicons-calendar-days" class="w-5 h-5 text-[#7FD857]" />
        {{ blok.badge }}
      </div>

      <h1
        ref="title"
        class="text-4xl md:text-6xl font-extrabold mb-4 uppercase tracking-tight"
        :class="fond.titre"
      >
        {{ blok.title || 'Inscriptions' }}
      </h1>

      <p
        v-if="blok.subtitle"
        ref="subtitle"
        class="text-lg md:text-xl font-medium max-w-2xl mx-auto mb-8"
        :class="fond.texte"
      >
        {{ blok.subtitle }}
      </p>

      <div ref="line" class="h-1.5 bg-[#7FD857] rounded-full mx-auto" style="width: 64px" />

      <nav v-if="liens.length" class="mt-10 flex flex-wrap justify-center gap-3">
        <a
          v-for="(lien, i) in liens"
          :key="lien._uid || i"
          :href="lien.ancre"
          class="px-4 py-2 rounded-full border border-gray-200 text-sm font-semibold text-gray-600 hover:border-[#7FD857] hover:text-[#0F1729] transition-colors"
        >
          {{ lien.label }}
        </a>
      </nav>
    </UContainer>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const props = defineProps({
  blok: {
    type: Object,
    required: true,
  },
})

const fond = useInscriptionsFond(() => props.blok.fond)
const liens = computed(() => props.blok.liens || [])

const badge = ref(null)
const title = ref(null)
const subtitle = ref(null)
const line = ref(null)

onMounted(async () => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const { gsap } = await import('gsap')

  if (badge.value) gsap.from(badge.value, { opacity: 0, y: 20, duration: 0.7, ease: 'power2.out' })
  // Le titre est le candidat LCP : glissement seul, jamais masqué.
  if (title.value) gsap.from(title.value, { y: 24, duration: 0.9, delay: 0.1, ease: 'power2.out' })
  if (subtitle.value) gsap.from(subtitle.value, { opacity: 0, y: 20, duration: 0.8, delay: 0.3, ease: 'power2.out' })
  if (line.value) gsap.from(line.value, { opacity: 0, width: 0, duration: 0.6, delay: 0.5, ease: 'power2.out' })
})
</script>
