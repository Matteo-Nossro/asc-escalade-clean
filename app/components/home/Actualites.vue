<template>
	<section class="py-20 bg-white">
		<UContainer>
			<!-- En-tête de section avec bouton -->
			<div class="flex items-end justify-between mb-12">
				<div>
					<h2 ref="titleRef" class="text-3xl font-bold text-[#0F1729] opacity-0">
						Actualités
					</h2>
					<p ref="subtitleRef" class="text-gray-600 mt-2 opacity-0">
						Suivez les dernières nouvelles du club
					</p>
				</div>

				<!-- Bouton Desktop -->
				<div ref="buttonRef" class="hidden md:block opacity-0">
					<UButton
							to="/actualites"
							variant="ghost"
							color="neutral"
							trailing-icon="i-heroicons-arrow-right-20-solid"
							label="Toutes les actualités"
							class="text-[#0F1729] hover:text-[#7FD857] font-bold"
					/>
				</div>
			</div>

			<!-- Grille d'actualités -->
			<div v-if="actualites.length > 0" class="grid grid-cols-1 md:grid-cols-12 gap-6">

				<!-- Article Principal (Grande image) - Colonne gauche -->
				<div
						v-if="featuredPost"
						ref="featuredRef"
						class="md:col-span-8 relative group overflow-hidden rounded-2xl h-[400px] opacity-0"
				>
					<!-- Image de fond -->
					<img
							:src="featuredPost.image"
							:alt="featuredPost.title"
							class="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
					/>

					<!-- Overlay dégradé -->
					<div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

					<!-- Particules décoratives -->
					<div class="absolute inset-0 pointer-events-none">
						<div
								v-for="i in 3"
								:key="`particle-${i}`"
								:ref="el => featuredParticles[i] = el"
								class="absolute w-1 h-1 bg-[#7FD857] rounded-full opacity-0"
								:style="{
                left: `${20 + i * 25}%`,
                top: `${30 + i * 15}%`
              }"
						></div>
					</div>

					<!-- Contenu -->
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

					<!-- Lien global sur la card -->
					<NuxtLink :to="`/posts/${featuredPost.slug}`" class="absolute inset-0 z-10" />
				</div>

				<!-- Colonne droite - Liste verticale -->
				<div class="md:col-span-4 flex flex-col gap-6 h-[400px]">

					<!-- Article 2 (Petit) -->
					<div
							v-if="secondaryPosts[0]"
							ref="secondary1Ref"
							class="bg-[#F5F7FA] rounded-2xl p-6 flex flex-col justify-between h-full relative hover:bg-gray-100 transition-all duration-300 hover:shadow-lg opacity-0"
					>
						<div class="flex justify-between items-start mb-4">
              <span class="text-xs font-semibold text-gray-500 bg-white px-2 py-1 rounded">
                {{ formatDateShort(secondaryPosts[0].date) }}
              </span>
							<UButton
									icon="i-heroicons-arrow-right"
									variant="ghost"
									color="neutral"
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

							<h3 class="text-lg font-bold text-[#0F1729] mb-2">
								{{ secondaryPosts[0].title }}
							</h3>
							<p class="text-sm text-gray-600 line-clamp-2">
								{{ secondaryPosts[0].excerpt }}
							</p>
						</div>

						<NuxtLink :to="`/posts/${secondaryPosts[0].slug}`" class="absolute inset-0 z-10" />
					</div>

					<!-- Article 3 (Petit - Dark) -->
					<div
							v-if="secondaryPosts[1]"
							ref="secondary2Ref"
							class="bg-[#0F1729] rounded-2xl p-6 flex flex-col justify-between h-full relative group overflow-hidden hover:shadow-xl transition-all duration-300 opacity-0"
					>
						<!-- Décoration de fond légère animée -->
						<div
								ref="glowRef"
								class="absolute top-0 right-0 w-24 h-24 bg-[#7FD857] opacity-10 rounded-full blur-2xl -mr-8 -mt-8"
						></div>

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
							<p class="text-sm text-gray-400 line-clamp-2">
								{{ secondaryPosts[1].excerpt }}
							</p>
						</div>

						<NuxtLink :to="`/posts/${secondaryPosts[1].slug}`" class="absolute inset-0 z-10" />
					</div>

				</div>

			</div>

			<!-- Message si pas d'actualités -->
			<div v-else class="text-center py-16 bg-gray-50 rounded-2xl">
				<UIcon name="i-heroicons-newspaper" class="w-16 h-16 text-gray-300 mx-auto mb-4" />
				<p class="text-gray-500 text-lg">Aucune actualité pour le moment</p>
			</div>

			<!-- Bouton Mobile "Voir toutes les actualités" -->
			<div ref="mobileButtonRef" class="md:hidden mt-8 text-center opacity-0">
				<UButton
						to="/actualites"
						block
						variant="outline"
						color="neutral"
						label="Voir toutes les actualités"
						trailing-icon="i-heroicons-arrow-right-20-solid"
						class="border-2 border-[#0F1729] text-[#0F1729] hover:bg-[#0F1729] hover:text-white font-bold"
				/>
			</div>

		</UContainer>
	</section>
</template>

<script setup lang="ts">
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { Post } from '~/types/post'
import Tag from '~/components/ui/Tag.vue'

gsap.registerPlugin(ScrollTrigger)

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

// Récupération des 3 dernières actualités
const { getPosts } = usePosts()
const actualites = await getPosts('actualite')

// Trier par date décroissante et prendre les 3 plus récentes
const recentActualites = computed(() => {
	return actualites
			.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
			.slice(0, 3)
})

// Article principal (featured) - soit marqué featured, soit le plus récent
const featuredPost = computed(() => {
	return recentActualites.value.find(post => post.featured) || recentActualites.value[0]
})

// Articles secondaires (2 suivants)
const secondaryPosts = computed(() => {
	return recentActualites.value
			.filter(post => post.id !== featuredPost.value?.id)
			.slice(0, 2)
})

// Fonction pour formater la date complète
const formatDate = (date: string) => {
	return new Date(date).toLocaleDateString('fr-FR', {
		day: 'numeric',
		month: 'long',
		year: 'numeric'
	})
}

// Fonction pour formater la date courte
const formatDateShort = (date: string) => {
	return new Date(date).toLocaleDateString('fr-FR', {
		day: 'numeric',
		month: 'short',
		year: 'numeric'
	})
}

// Fonction pour obtenir la couleur de la catégorie
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

// Animations GSAP
onMounted(() => {
	// Animation de l'en-tête au scroll
	const tl = gsap.timeline({
		scrollTrigger: {
			trigger: titleRef.value,
			start: 'top 80%',
			end: 'top 50%',
			toggleActions: 'play none none none'
		}
	})

	tl.to(titleRef.value, {
		opacity: 1,
		y: 0,
		duration: 0.6,
		ease: 'power2.out'
	})
			.to(subtitleRef.value, {
				opacity: 1,
				y: 0,
				duration: 0.5
			}, '-=0.3')
			.to(buttonRef.value, {
				opacity: 1,
				x: 0,
				duration: 0.5
			}, '-=0.3')

	// Animation des cards au scroll
	if (featuredRef.value) {
		gsap.to(featuredRef.value, {
			opacity: 1,
			y: 0,
			duration: 0.8,
			ease: 'power2.out',
			scrollTrigger: {
				trigger: featuredRef.value,
				start: 'top 85%',
				toggleActions: 'play none none none'
			}
		})
	}

	if (secondary1Ref.value) {
		gsap.to(secondary1Ref.value, {
			opacity: 1,
			x: 0,
			duration: 0.7,
			ease: 'power2.out',
			scrollTrigger: {
				trigger: secondary1Ref.value,
				start: 'top 85%',
				toggleActions: 'play none none none'
			}
		})
	}

	if (secondary2Ref.value) {
		gsap.to(secondary2Ref.value, {
			opacity: 1,
			x: 0,
			duration: 0.7,
			delay: 0.2,
			ease: 'power2.out',
			scrollTrigger: {
				trigger: secondary2Ref.value,
				start: 'top 85%',
				toggleActions: 'play none none none'
			}
		})
	}

	if (mobileButtonRef.value) {
		gsap.to(mobileButtonRef.value, {
			opacity: 1,
			y: 0,
			duration: 0.5,
			scrollTrigger: {
				trigger: mobileButtonRef.value,
				start: 'top 90%',
				toggleActions: 'play none none none'
			}
		})
	}

	// Animation du glow sur la carte sombre
	if (glowRef.value) {
		gsap.to(glowRef.value, {
			scale: 1.3,
			opacity: 0.15,
			duration: 3,
			repeat: -1,
			yoyo: true,
			ease: 'sine.inOut'
		})
	}

	// Animation des particules sur la carte featured
	featuredParticles.value.forEach((particle, index) => {
		if (particle) {
			gsap.to(particle, {
				opacity: 0.6,
				y: -20,
				duration: 2 + index * 0.5,
				delay: index * 0.3,
				repeat: -1,
				yoyo: true,
				ease: 'sine.inOut'
			})
		}
	})
})
</script>

<style scoped>
/* Initialisation des positions pour les animations */
h2, p {
	transform: translateY(20px);
}

[ref="buttonRef"] {
	transform: translateX(20px);
}

[ref="featuredRef"] {
	transform: translateY(30px);
}

[ref="secondary1Ref"],
[ref="secondary2Ref"] {
	transform: translateX(20px);
}

[ref="mobileButtonRef"] {
	transform: translateY(20px);
}
</style>
