<template>
	<section class="py-16 bg-white relative border-t border-gray-100 overflow-hidden">

		<!-- Fond décoratif (Forme triangulaire très légère) -->
		<div class="absolute inset-0 pointer-events-none flex items-end justify-center opacity-10">
			<svg ref="triangleRef" viewBox="0 0 1000 300" class="w-full h-full text-gray-200 fill-current" preserveAspectRatio="none">
				<path d="M500 50 L1000 300 H0 Z" />
			</svg>
		</div>

		<!-- Cercles décoratifs flottants -->
		<div class="absolute inset-0 pointer-events-none overflow-hidden">
			<div
					v-for="i in 4"
					:key="`circle-${i}`"
					:ref="el => circles[i] = el"
					class="absolute w-3 h-3 rounded-full bg-[#7FD857] opacity-0"
					:style="{
          left: `${15 + i * 22}%`,
          top: `${20 + (i % 2) * 40}%`
        }"
			></div>
		</div>

		<UContainer class="relative z-10">
			<div class="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">

				<!-- Stat 1 - Adhérents -->
				<div ref="stat1Ref" class="flex flex-col items-center gap-2 opacity-0">
					<div class="relative">
						<UIcon name="i-heroicons-user-group" class="w-8 h-8 text-[#7FD857] transition-transform hover:scale-110 duration-300" />
						<!-- Cercle pulse derrière l'icône -->
						<div ref="pulse1Ref" class="absolute inset-0 w-8 h-8 rounded-full bg-[#7FD857] opacity-20 -z-10"></div>
					</div>
					<span ref="count1Ref" class="text-4xl font-extrabold text-[#0F1729]">0</span>
					<span class="text-xs font-bold text-gray-500 uppercase tracking-widest">Adhérents</span>
				</div>

				<!-- Stat 2 - Hauteur -->
				<div ref="stat2Ref" class="flex flex-col items-center gap-2 opacity-0">
					<div class="relative">
						<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#7FD857" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="transition-transform hover:scale-110 duration-300">
							<path d="M8 3l4 8 5-5 5 15H2L8 3z"></path>
						</svg>
						<div ref="pulse2Ref" class="absolute inset-0 w-8 h-8 rounded-full bg-[#7FD857] opacity-20 -z-10"></div>
					</div>
					<span ref="count2Ref" class="text-4xl font-extrabold text-[#0F1729]">0m</span>
					<span class="text-xs font-bold text-gray-500 uppercase tracking-widest">De Haut</span>
				</div>

				<!-- Stat 3 - Années -->
				<div ref="stat3Ref" class="flex flex-col items-center gap-2 opacity-0">
					<div class="relative">
						<UIcon name="i-heroicons-sparkles" class="w-8 h-8 text-[#7FD857] transition-transform hover:scale-110 duration-300" />
						<div ref="pulse3Ref" class="absolute inset-0 w-8 h-8 rounded-full bg-[#7FD857] opacity-20 -z-10"></div>
					</div>
					<span ref="count3Ref" class="text-4xl font-extrabold text-[#0F1729]">0</span>
					<span class="text-xs font-bold text-gray-500 uppercase tracking-widest">Années</span>
				</div>

				<!-- Stat 4 - Bénévoles -->
				<div ref="stat4Ref" class="flex flex-col items-center gap-2 opacity-0">
					<div class="relative">
						<UIcon name="i-heroicons-hand-raised" class="w-8 h-8 text-[#7FD857] transition-transform hover:scale-110 duration-300" />
						<div ref="pulse4Ref" class="absolute inset-0 w-8 h-8 rounded-full bg-[#7FD857] opacity-20 -z-10"></div>
					</div>
					<span ref="count4Ref" class="text-4xl font-extrabold text-[#0F1729]">0</span>
					<span class="text-xs font-bold text-gray-500 uppercase tracking-widest">Bénévoles</span>
				</div>

			</div>
		</UContainer>
	</section>
</template>

<script setup lang="ts">
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// Refs pour les animations
const triangleRef = ref<SVGSVGElement | null>(null)
const stat1Ref = ref<HTMLElement | null>(null)
const stat2Ref = ref<HTMLElement | null>(null)
const stat3Ref = ref<HTMLElement | null>(null)
const stat4Ref = ref<HTMLElement | null>(null)
const count1Ref = ref<HTMLElement | null>(null)
const count2Ref = ref<HTMLElement | null>(null)
const count3Ref = ref<HTMLElement | null>(null)
const count4Ref = ref<HTMLElement | null>(null)
const pulse1Ref = ref<HTMLElement | null>(null)
const pulse2Ref = ref<HTMLElement | null>(null)
const pulse3Ref = ref<HTMLElement | null>(null)
const pulse4Ref = ref<HTMLElement | null>(null)
const circles = ref<(HTMLElement | null)[]>([])

// Fonction pour animer un compteur
const animateCounter = (element: HTMLElement | null, target: number, suffix: string = '') => {
	if (!element) return

	const counter = { value: 0 }

	gsap.to(counter, {
		value: target,
		duration: 2,
		ease: 'power2.out',
		onUpdate: () => {
			element.textContent = Math.round(counter.value) + suffix
		}
	})
}

onMounted(() => {
	// Animation du triangle de fond
	if (triangleRef.value) {
		gsap.to(triangleRef.value, {
			y: -20,
			duration: 8,
			repeat: -1,
			yoyo: true,
			ease: 'sine.inOut'
		})
	}

	// Timeline principale avec ScrollTrigger
	const tl = gsap.timeline({
		scrollTrigger: {
			trigger: stat1Ref.value,
			start: 'top 80%',
			toggleActions: 'play none none none',
			onEnter: () => {
				// Lancer les compteurs quand la section devient visible
				animateCounter(count1Ref.value, 350)
				animateCounter(count2Ref.value, 12, 'm')
				animateCounter(count3Ref.value, 25)
				animateCounter(count4Ref.value, 15)
			}
		}
	})

	// Animation d'apparition des stats en cascade
	tl.to(stat1Ref.value, {
		opacity: 1,
		y: 0,
		duration: 0.6,
		ease: 'back.out(1.5)'
	})
			.to(stat2Ref.value, {
				opacity: 1,
				y: 0,
				duration: 0.6,
				ease: 'back.out(1.5)'
			}, '-=0.4')
			.to(stat3Ref.value, {
				opacity: 1,
				y: 0,
				duration: 0.6,
				ease: 'back.out(1.5)'
			}, '-=0.4')
			.to(stat4Ref.value, {
				opacity: 1,
				y: 0,
				duration: 0.6,
				ease: 'back.out(1.5)'
			}, '-=0.4')

	// Animation des pulses autour des icônes
	const pulses = [pulse1Ref.value, pulse2Ref.value, pulse3Ref.value, pulse4Ref.value]
	pulses.forEach((pulse, index) => {
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

	// Animation des cercles décoratifs
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

<style scoped>
/* Initialisation des positions pour les animations */
[ref*="statRef"] {
	transform: translateY(30px);
}
</style>
