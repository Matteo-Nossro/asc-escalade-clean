<template>
  <section v-editable="blok" class="pt-20 pb-10 bg-white">
    <UContainer>
      <!-- En-tête de section avec bouton -->
      <div class="flex items-end justify-between mb-12">
        <div>
          <h2 ref="titleRef" class="text-3xl font-bold text-[#0F1729]">
            {{ blok.title }}
          </h2>
          <p ref="subtitleRef" class="text-gray-600 mt-2">
            {{ blok.subtitle }}
          </p>
        </div>

        <!-- Bouton Desktop -->
        <div ref="buttonRef" class="hidden md:block">
          <UButton
            :to="blok.ctaLink"
            variant="ghost"
            color="neutral"
            trailing-icon="i-heroicons-arrow-right-20-solid"
            :label="blok.ctaLabel"
            class="text-[#0F1729] hover:text-[#7FD857] font-bold"
          />
        </div>
      </div>

      <!-- Grille d'actualités -->
      <div v-if="actualites.length > 0" class="grid grid-cols-1 md:grid-cols-12 gap-6">

        <!-- Article Principal -->
        <div
          v-if="featuredPost"
          ref="featuredRef"
          class="md:col-span-8 relative group overflow-hidden rounded-2xl h-[400px]"
        >
          <img
            v-if="featuredPost.image"
            :src="`${featuredPost.image}/m/800x400/filters:quality(65):format(webp)`"
            :srcset="`
              ${featuredPost.image}/m/640x380/filters:quality(65):format(webp) 640w,
              ${featuredPost.image}/m/800x400/filters:quality(65):format(webp) 800w
            `"
            sizes="(max-width: 768px) 100vw, 66vw"
            :alt="featuredPost.title"
            loading="lazy"
            class="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

          <div class="absolute inset-0 pointer-events-none">
            <div
              v-for="i in 3"
              :key="`particle-${i}`"
              :ref="el => featuredParticles[i] = el"
              class="absolute w-1 h-1 bg-[#7FD857] rounded-full opacity-0"
              :style="{ left: `${20 + i * 25}%`, top: `${30 + i * 15}%` }"
            ></div>
          </div>

          <div class="absolute bottom-0 left-0 p-8 w-full">
            <Tag
              :label="featuredPost.category"
              :color="getCategoryColor(featuredPost.category)"
              size="md"
              variant="solid"
              class="mb-3"
            />
            <h3 class="text-2xl font-bold text-white mb-2 leading-tight">
              {{ featuredPost.title }}
            </h3>
            <p class="text-gray-200 text-sm line-clamp-2 md:w-3/4">
              {{ featuredPost.excerpt }}
            </p>
            <div class="flex items-center gap-3 text-white/80 text-xs mt-3">
              <UIcon name="i-heroicons-calendar" class="w-4 h-4" />
              <span>{{ formatDate(featuredPost.date) }}</span>
            </div>
          </div>

          <NuxtLink :to="`/posts/${featuredPost.slug}`" :aria-label="featuredPost.title" class="absolute inset-0 z-10" />
        </div>

        <!-- Colonne droite -->
        <div class="md:col-span-4 flex flex-col gap-6 h-[400px]">

          <!-- Article 2 -->
          <div
            v-if="secondaryPosts[0]"
            ref="secondary1Ref"
            class="bg-[#F5F7FA] rounded-2xl p-6 flex flex-col justify-between h-full relative hover:bg-gray-100 transition-all duration-300 hover:shadow-lg"
          >
            <div class="flex justify-between items-start mb-4">
              <span class="text-xs font-semibold text-gray-500 bg-white px-2 py-1 rounded">
                {{ formatDateShort(secondaryPosts[0].date) }}
              </span>
              <UButton
                icon="i-heroicons-arrow-right"
                variant="ghost"
                color="neutral"
                tabindex="-1"
                aria-hidden="true"
                class="bg-white hover:bg-gray-50 rounded-lg transition-transform hover:translate-x-1"
              />
            </div>
            <div>
              <Tag
                :label="secondaryPosts[0].category"
                :color="getCategoryColor(secondaryPosts[0].category)"
                size="sm"
                variant="soft"
                class="mb-2"
              />
              <h3 class="text-lg font-bold text-[#0F1729] mb-2">{{ secondaryPosts[0].title }}</h3>
              <p class="text-sm text-gray-600 line-clamp-2">{{ secondaryPosts[0].excerpt }}</p>
            </div>
            <NuxtLink :to="`/posts/${secondaryPosts[0].slug}`" :aria-label="secondaryPosts[0].title" class="absolute inset-0 z-10" />
          </div>

          <!-- Article 3 (Dark) -->
          <div
            v-if="secondaryPosts[1]"
            ref="secondary2Ref"
            class="bg-[#0F1729] rounded-2xl p-6 flex flex-col justify-between h-full relative group overflow-hidden hover:shadow-xl transition-all duration-300"
          >
            <div ref="glowRef" class="absolute top-0 right-0 w-24 h-24 bg-[#7FD857] opacity-10 rounded-full blur-2xl -mr-8 -mt-8"></div>
            <div class="flex justify-between items-start mb-4 relative z-10">
              <span class="text-xs font-semibold text-gray-400 border border-gray-700 px-2 py-1 rounded">
                {{ formatDateShort(secondaryPosts[1].date) }}
              </span>
            </div>
            <div class="relative z-10">
              <Tag
                :label="secondaryPosts[1].category"
                :color="getCategoryColor(secondaryPosts[1].category)"
                size="sm"
                variant="soft"
                class="mb-2"
              />
              <h3 class="text-lg font-bold text-white mb-2 group-hover:text-[#7FD857] transition-colors">
                {{ secondaryPosts[1].title }}
              </h3>
              <p class="text-sm text-gray-400 line-clamp-2">{{ secondaryPosts[1].excerpt }}</p>
            </div>
            <NuxtLink :to="`/posts/${secondaryPosts[1].slug}`" :aria-label="secondaryPosts[1].title" class="absolute inset-0 z-10" />
          </div>

        </div>
      </div>

      <!-- Message si pas d'actualités -->
      <div v-else class="text-center py-16 bg-gray-50 rounded-2xl">
        <UIcon name="i-heroicons-newspaper" class="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p class="text-gray-500 text-lg">Aucune actualité pour le moment</p>
      </div>

      <!-- Bouton Mobile -->
      <div ref="mobileButtonRef" class="md:hidden mt-8 text-center">
        <UButton
          :to="blok.ctaLink"
          block
          variant="outline"
          color="neutral"
          :label="blok.mobileCtaLabel"
          trailing-icon="i-heroicons-arrow-right-20-solid"
          class="border-2 border-[#0F1729] text-[#0F1729] hover:bg-[#0F1729] hover:text-white font-bold"
        />
      </div>

    </UContainer>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { Post } from '~/types/post'
import Tag from '~/components/ui/Tag.vue'

// ✅ Prop Storyblok
defineProps({ blok: Object })

// Refs pour les animations
const titleRef = ref<HTMLElement | null>(null)
const subtitleRef = ref<HTMLElement | null>(null)
const buttonRef = ref<HTMLElement | null>(null)
const featuredRef = ref<HTMLElement | null>(null)
const secondary1Ref = ref<HTMLElement | null>(null)
const secondary2Ref = ref<HTMLElement | null>(null)
const mobileButtonRef = ref<HTMLElement | null>(null)
const glowRef = ref<HTMLElement | null>(null)
const featuredParticles = ref<(HTMLElement | null)[]>([])

// ✅ Les articles restent dynamiques via usePosts()
const { getPosts } = usePosts()
const actualites = await getPosts('actualite')

const recentActualites = computed(() =>
  actualites
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3)
)

const featuredPost = computed(() =>
  recentActualites.value.find(post => post.featured) || recentActualites.value[0]
)

const secondaryPosts = computed(() =>
  recentActualites.value.filter(post => post.id !== featuredPost.value?.id).slice(0, 2)
)

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

const formatDateShort = (date: string) =>
  new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })

const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    'Infrastructure': '#7FD857',
    'Compétition': '#EF4444',
    'Événement': '#F59E0B',
    'Club': '#3B82F6',
    'Formation': '#8B5CF6',
    'Sortie Falaise': '#7FD857',
    'Partenariat': '#10B981'
  }
  return colors[category] || '#7FD857'
}

// Animations GSAP (import dynamique — hors bundle initial)
onMounted(async () => {
	const { gsap } = await import('gsap')
	const { ScrollTrigger } = await import('gsap/ScrollTrigger')
	gsap.registerPlugin(ScrollTrigger)

	// gsap.from() : éléments visibles par défaut, animation depuis état invisible
	const tl = gsap.timeline({
		scrollTrigger: {
			trigger: titleRef.value,
			start: 'top 80%',
			end: 'top 50%',
			toggleActions: 'play none none none'
		}
	})

	tl.from(titleRef.value, { opacity: 0, y: 20, duration: 0.6, ease: 'power2.out' })
		.from(subtitleRef.value, { opacity: 0, y: 20, duration: 0.5 }, '-=0.3')
		.from(buttonRef.value, { opacity: 0, x: 20, duration: 0.5 }, '-=0.3')

	if (featuredRef.value) {
		gsap.from(featuredRef.value, {
			opacity: 0, y: 30, duration: 0.8, ease: 'power2.out',
			scrollTrigger: { trigger: featuredRef.value, start: 'top 85%', toggleActions: 'play none none none' }
		})
	}

	if (secondary1Ref.value) {
		gsap.from(secondary1Ref.value, {
			opacity: 0, x: 20, duration: 0.7, ease: 'power2.out',
			scrollTrigger: { trigger: secondary1Ref.value, start: 'top 85%', toggleActions: 'play none none none' }
		})
	}

	if (secondary2Ref.value) {
		gsap.from(secondary2Ref.value, {
			opacity: 0, x: 20, duration: 0.7, delay: 0.2, ease: 'power2.out',
			scrollTrigger: { trigger: secondary2Ref.value, start: 'top 85%', toggleActions: 'play none none none' }
		})
	}

	if (mobileButtonRef.value) {
		gsap.from(mobileButtonRef.value, {
			opacity: 0, y: 20, duration: 0.5,
			scrollTrigger: { trigger: mobileButtonRef.value, start: 'top 90%', toggleActions: 'play none none none' }
		})
	}

	if (glowRef.value) {
		gsap.to(glowRef.value, { scale: 1.3, opacity: 0.15, duration: 3, repeat: -1, yoyo: true, ease: 'sine.inOut' })
	}

	featuredParticles.value.forEach((particle, index) => {
		if (particle) {
			gsap.to(particle, { opacity: 0.6, y: -20, duration: 2 + index * 0.5, delay: index * 0.3, repeat: -1, yoyo: true, ease: 'sine.inOut' })
		}
	})
})
</script>

