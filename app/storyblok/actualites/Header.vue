<template>
	<section v-editable="blok" class="relative pt-32 pb-20 bg-white overflow-hidden">

		<!-- Éléments de fond -->
		<div class="absolute inset-0 pointer-events-none overflow-hidden">

			<!-- Vagues d'actualités -->
			<svg
					ref="newsWave1"
					class="absolute bottom-0 left-0 w-full h-[320px] text-gray-50"
					viewBox="0 0 1440 320"
					preserveAspectRatio="none"
			>
				<path
						fill="currentColor"
						fill-opacity="1"
						d="M0,128L48,149.3C96,171,192,213,288,213.3C384,213,480,171,576,165.3C672,160,768,192,864,197.3C960,203,1056,181,1152,165.3C1248,149,1344,139,1392,133.3L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
				/>
			</svg>

			<svg
					ref="newsWave2"
					class="absolute bottom-0 left-0 w-full h-[420px] text-gray-50/40"
					viewBox="0 0 1440 320"
					preserveAspectRatio="none"
			>
				<path
						fill="currentColor"
						fill-opacity="1"
						d="M0,256L48,240C96,224,192,192,288,181.3C384,171,480,181,576,197.3C672,213,768,235,864,224C960,213,1056,171,1152,149.3C1248,128,1344,128,1392,128L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
				/>
			</svg>

			<!-- Lignes de flux d'information -->
			<div class="absolute top-0 left-0 w-full h-64 opacity-20">
				<svg width="100%" height="100%" viewBox="0 0 1440 200" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path
							ref="flowLine1"
							d="M-100 70 C 200 50, 400 90, 720 70 S 1200 50, 1540 70"
							stroke="#7FD857"
							stroke-width="2"
							fill="none"
							stroke-dasharray="2000"
							stroke-dashoffset="2000"
					/>
					<path
							ref="flowLine2"
							d="M-100 120 C 250 100, 450 140, 770 120 S 1250 100, 1540 120"
							stroke="#7FD857"
							stroke-width="1.5"
							fill="none"
							opacity="0.6"
							stroke-dasharray="2000"
							stroke-dashoffset="2000"
					/>
					<path
							ref="flowLine3"
							d="M-100 170 C 300 150, 500 190, 820 170 S 1300 150, 1540 170"
							stroke="#0F1729"
							stroke-width="1"
							fill="none"
							opacity="0.3"
							stroke-dasharray="2000"
							stroke-dashoffset="2000"
					/>
				</svg>
			</div>

			<!-- Icônes de news flottantes -->
			<div
					v-for="i in 7"
					:key="`news-${i}`"
					:ref="el => newsIcons[i] = el"
					class="absolute opacity-0"
					:style="{
          left: `${10 + i * 14}%`,
          top: `${20 + (i % 3) * 22}%`
        }"
			>
				<UIcon name="i-heroicons-newspaper" class="w-5 h-5 text-[#7FD857]" />
			</div>

			<!-- Rectangles de cartes de news -->
			<svg class="absolute top-12 right-10 w-36 h-36 opacity-8" viewBox="0 0 100 100">
				<rect ref="card1" x="5" y="10" width="90" height="25" rx="2" stroke="#7FD857" stroke-width="1.5" fill="none" />
				<line x1="10" y1="18" x2="70" y2="18" stroke="#7FD857" stroke-width="1" opacity="0.5" />
				<line x1="10" y1="25" x2="50" y2="25" stroke="#7FD857" stroke-width="0.8" opacity="0.4" />

				<rect ref="card2" x="10" y="45" width="85" height="23" rx="2" stroke="#7FD857" stroke-width="1" fill="none" opacity="0.6" />
				<line x1="15" y1="53" x2="65" y2="53" stroke="#7FD857" stroke-width="0.8" opacity="0.4" />
				<line x1="15" y1="60" x2="45" y2="60" stroke="#7FD857" stroke-width="0.6" opacity="0.3" />
			</svg>

		</div>

		<UContainer class="relative z-10 text-center">

			<h1 ref="title" class="text-4xl md:text-6xl font-extrabold text-[#0F1729] mb-4 uppercase tracking-tight">
				{{ blok.title || 'ACTUALITÉS' }}
			</h1>

			<p ref="subtitle" class="text-gray-500 text-lg md:text-xl font-medium max-w-2xl mx-auto mb-8">
				{{ blok.subtitle || 'Suivez toute l\'actualité du club' }}
			</p>

			<div ref="line" class="h-1.5 bg-[#7FD857] rounded-full mx-auto" style="width: 64px"></div>

		</UContainer>
	</section>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const props = defineProps({
	blok: {
		type: Object,
		required: true
	}
})

const title = ref<HTMLElement | null>(null)
const subtitle = ref<HTMLElement | null>(null)
const line = ref<HTMLElement | null>(null)
const newsWave1 = ref<SVGSVGElement | null>(null)
const newsWave2 = ref<SVGSVGElement | null>(null)
const flowLine1 = ref<SVGPathElement | null>(null)
const flowLine2 = ref<SVGPathElement | null>(null)
const flowLine3 = ref<SVGPathElement | null>(null)
const card1 = ref<SVGRectElement | null>(null)
const card2 = ref<SVGRectElement | null>(null)
const newsIcons = ref<(HTMLElement | null)[]>([])

onMounted(async () => {
	// Respecte la préférence système « animations réduites ».
	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

	// GSAP chargé à la demande — hors du bundle initial du blok.
	const [{ gsap }, { ScrollTrigger }] = await Promise.all([
		import('gsap'),
		import('gsap/ScrollTrigger'),
	])
	gsap.registerPlugin(ScrollTrigger)

	const tl = gsap.timeline({ defaults: { ease: 'power2.out' } })

	// Titre = candidat LCP : glissement seul, jamais masqué.
	tl.from(title.value, {
		y: 24,
		duration: 0.9,
		delay: 0.3
	})
			.from(subtitle.value, {
				opacity: 0,
				y: 20,
				duration: 0.8
			}, '-=0.5')
			.from(line.value, {
				width: 0,
				opacity: 0,
				duration: 0.6
			}, '-=0.4')

	const flowLines = [flowLine1.value, flowLine2.value, flowLine3.value]
	flowLines.forEach((line, index) => {
		if (line) {
			gsap.to(line, {
				strokeDashoffset: 0,
				duration: 2.5 + index * 0.3,
				ease: 'power1.inOut',
				delay: 0.6 + index * 0.2
			})
		}
	})

	if (newsWave1.value) {
		gsap.to(newsWave1.value, {
			y: 45,
			ease: 'none',
			scrollTrigger: {
				trigger: newsWave1.value,
				start: 'top bottom',
				end: 'bottom top',
				scrub: 1.3
			}
		})
	}

	if (newsWave2.value) {
		gsap.to(newsWave2.value, {
			y: 65,
			ease: 'none',
			scrollTrigger: {
				trigger: newsWave2.value,
				start: 'top bottom',
				end: 'bottom top',
				scrub: 1.7
			}
		})
	}

	newsIcons.value.forEach((icon, index) => {
		if (icon) {
			gsap.to(icon, {
				opacity: 0.4,
				scale: 1,
				duration: 0.5,
				delay: 1 + index * 0.12,
				ease: 'back.out(2)'
			})

			gsap.to(icon, {
				y: -15,
				rotation: index % 2 === 0 ? 10 : -10,
				duration: 2.5 + Math.random() * 0.8,
				repeat: -1,
				yoyo: true,
				ease: 'sine.inOut',
				delay: Math.random() * 2
			})
		}
	})

	if (card1.value) {
		gsap.to(card1.value, {
			y: -8,
			duration: 3.5,
			repeat: -1,
			yoyo: true,
			ease: 'sine.inOut'
		})
	}

	if (card2.value) {
		gsap.to(card2.value, {
			y: 6,
			duration: 4,
			repeat: -1,
			yoyo: true,
			ease: 'sine.inOut',
			delay: 1.5
		})
	}
})
</script>

<style scoped>
svg {
	will-change: transform;
}
</style>
