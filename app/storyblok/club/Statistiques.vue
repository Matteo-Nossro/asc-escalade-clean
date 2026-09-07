<template>
	<section v-editable="blok" class="py-16 bg-white relative border-t border-gray-100 overflow-hidden">

		<div class="absolute inset-0 pointer-events-none flex items-end justify-center opacity-10">
			<svg ref="triangleRef" viewBox="0 0 1000 300" class="w-full h-full text-gray-200 fill-current" preserveAspectRatio="none">
				<path d="M500 50 L1000 300 H0 Z" />
			</svg>
		</div>

		<div class="absolute inset-0 pointer-events-none overflow-hidden">
			<div
					v-for="i in 4"
					:key="`circle-${i}`"
					:ref="el => { if (el) circles[i] = el }"
					class="absolute w-3 h-3 rounded-full bg-[#7FD857] opacity-0"
					:style="{
          left: `${15 + i * 22}%`,
          top: `${20 + (i % 2) * 40}%`
        }"
			></div>
		</div>

		<UContainer class="relative z-10">
			<div class="grid gap-8 text-center" :class="gridClass">

				<div
						v-for="(stat, index) in stats"
						:key="stat._uid || index"
						:ref="el => { if (el) statRefs[index] = el }"
						class="flex flex-col items-center gap-2"
				>
					<div class="relative">
						<UIcon :name="stat.icon || 'i-heroicons-chart-bar'" class="w-8 h-8 text-[#7FD857] transition-transform hover:scale-110 duration-300" />
						<div
								:ref="el => { if (el) pulseRefs[index] = el }"
								class="absolute inset-0 w-8 h-8 rounded-full bg-[#7FD857] opacity-20 -z-10"
						></div>
					</div>
					<span
							:ref="el => { if (el) countRefs[index] = el }"
							class="text-4xl font-extrabold text-[#0F1729]"
					>{{ formatStat(stat) }}</span>
					<span class="text-xs font-bold text-gray-500 uppercase tracking-widest">{{ stat.label }}</span>
				</div>

			</div>
		</UContainer>
	</section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const props = defineProps({
	blok: {
		type: Object,
		required: true
	}
})

const triangleRef = ref<SVGSVGElement | null>(null)
const statRefs = ref<HTMLElement[]>([])
const countRefs = ref<HTMLElement[]>([])
const pulseRefs = ref<HTMLElement[]>([])
const circles = ref<(HTMLElement | null)[]>([])

// blok.stats est un array de bloks nestables avec : icon, value, suffix, label
// Fallback statique si pas encore de contenu Storyblok
const stats = computed(() => {
	if (props.blok.stats?.length) return props.blok.stats
	return [
		{ icon: 'i-heroicons-user-group', value: 350, suffix: '', label: 'Adhérents' },
		{ icon: 'i-heroicons-arrow-trending-up', value: 12, suffix: 'm', label: 'De Haut' },
		{ icon: 'i-heroicons-sparkles', value: 25, suffix: '', label: 'Années' },
		{ icon: 'i-heroicons-hand-raised', value: 15, suffix: '', label: 'Bénévoles' }
	]
})

// Valeur finale affichée dans le HTML rendu côté serveur (lisible sans JS / par les crawlers).
// L'animation « compteur » côté client repart de 0 uniquement si le JS est actif.
const formatStat = (stat: Record<string, any>) =>
	`${Number(stat.value) || 0}${stat.suffix || ''}`

// blok.columns_per_row : nombre de colonnes par ligne (1-6), défini dans Storyblok
// Fallback : min(nb stats, 4) pour respecter le comportement original
const gridClass = computed(() => {
	const requested = Number(props.blok.columns_per_row)
	const cols = (requested >= 1 && requested <= 6) ? requested : Math.min(stats.value.length, 4)
	const mobile = Math.min(cols, 2)
	return `grid-cols-${mobile} md:grid-cols-${cols}`
})

onMounted(() => {
	// Respecte « animations réduites » : les valeurs sont déjà dans le HTML, on ne touche à rien.
	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

	if (triangleRef.value) {
		gsap.to(triangleRef.value, {
			y: -20,
			duration: 8,
			repeat: -1,
			yoyo: true,
			ease: 'sine.inOut'
		})
	}

	if (!statRefs.value.length) return

	const tl = gsap.timeline({
		scrollTrigger: {
			trigger: statRefs.value[0],
			start: 'top 80%',
			toggleActions: 'play none none none',
			onEnter: () => {
				stats.value.forEach((stat, index) => {
					const el = countRefs.value[index]
					if (!el) return
					const target = Number(stat.value) || 0
					const suffix = stat.suffix || ''
					const counter = { value: 0 }
					gsap.to(counter, {
						value: target,
						duration: 2,
						ease: 'power2.out',
						onUpdate: () => {
							el.textContent = Math.round(counter.value) + suffix
						}
					})
				})
			}
		}
	})

	statRefs.value.forEach((el, index) => {
		tl.from(el, { opacity: 0, y: 20, duration: 0.6, ease: 'back.out(1.5)' }, index === 0 ? undefined : '-=0.4')
	})

	pulseRefs.value.forEach((pulse, index) => {
		if (pulse) {
			gsap.to(pulse, {
				scale: 1.8,
				opacity: 0,
				duration: 2,
				repeat: -1,
				ease: 'power2.out',
				delay: index * 0.3
			})
		}
	})

	circles.value.forEach((circle, index) => {
		if (circle) {
			gsap.to(circle, {
				opacity: 0.3,
				y: -30,
				duration: 3 + index * 0.5,
				delay: index * 0.2,
				repeat: -1,
				yoyo: true,
				ease: 'sine.inOut'
			})
		}
	})
})
</script>
