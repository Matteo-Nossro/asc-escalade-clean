<template>
	<section v-editable="blok" class="relative pt-32 pb-20">

		<!-- Éléments de fond -->
		<div class="absolute inset-0 pointer-events-none">

			<!-- Vagues stylisées -->
			<svg
					ref="wave1"
					class="absolute bottom-0 left-0 w-full h-[350px] text-gray-50"
					viewBox="0 0 1440 320"
					preserveAspectRatio="none"
			>
				<path
						fill="currentColor"
						fill-opacity="1"
						d="M0,96L48,112C96,128,192,160,288,186.7C384,213,480,235,576,213.3C672,192,768,128,864,128C960,128,1056,192,1152,197.3C1248,203,1344,149,1392,122.7L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
				/>
			</svg>

			<svg
					ref="wave2"
					class="absolute bottom-0 left-0 w-full h-[450px] text-gray-50/60"
					viewBox="0 0 1440 320"
					preserveAspectRatio="none"
			>
				<path
						fill="currentColor"
						fill-opacity="1"
						d="M0,128L48,138.7C96,149,192,171,288,165.3C384,160,480,128,576,133.3C672,139,768,181,864,186.7C960,192,1056,160,1152,138.7C1248,117,1344,107,1392,101.3L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
				/>
			</svg>

			<!-- Chemins sinueux (comme des sentiers de montagne) -->
			<div class="absolute top-0 left-0 w-full h-64 opacity-20">
				<svg width="100%" height="100%" viewBox="0 0 1440 200" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path
							ref="path1"
							d="M-50 100 Q 200 20, 400 80 T 800 100 Q 1000 120, 1200 60 T 1490 100"
							stroke="#7FD857"
							stroke-width="2.5"
							fill="none"
							stroke-dasharray="2200"
							stroke-dashoffset="2200"
					/>
					<path
							ref="path2"
							d="M-50 150 Q 250 70, 450 130 T 850 150 Q 1050 170, 1250 110 T 1490 150"
							stroke="#0F1729"
							stroke-width="1.5"
							fill="none"
							opacity="0.3"
							stroke-dasharray="2200"
							stroke-dashoffset="2200"
					/>
				</svg>
			</div>

			<!-- Points décoratifs (comme des sommets de montagne) -->
			<div
					v-for="i in 10"
					:key="`peak-${i}`"
					:ref="el => { if (el) peaks[i] = el }"
					class="absolute w-2 h-2 bg-[#7FD857] rounded-full opacity-0"
					:style="{
          left: `${8 + i * 10}%`,
          top: `${15 + (i % 4) * 18}%`
        }"
			></div>

			<!-- Polygones géométriques (rappel de rochers) -->
			<svg class="absolute top-16 right-12 w-28 h-28 opacity-8" viewBox="0 0 100 100">
				<polygon ref="rock1" points="50,10 90,40 70,90 30,90 10,40" stroke="#7FD857" stroke-width="1.5" fill="none" />
				<polygon ref="rock2" points="50,25 75,50 60,80 40,80 25,50" stroke="#7FD857" stroke-width="1" fill="none" opacity="0.5" />
			</svg>

		</div>

		<UContainer class="relative z-10 text-center">

			<h1 ref="title" class="text-4xl md:text-6xl font-extrabold text-[#0F1729] mb-4 uppercase tracking-tight opacity-0">
				{{ blok.title || 'SORTIES & STAGES' }}
			</h1>

			<p ref="subtitle" class="text-gray-500 text-lg md:text-xl font-medium max-w-2xl mx-auto mb-8 opacity-0">
				{{ blok.subtitle || 'Vivez l\'escalade grandeur nature en falaise' }}
			</p>

			<div ref="line" class="h-1.5 bg-[#7FD857] rounded-full mx-auto opacity-0" style="width: 0"></div>

		</UContainer>
	</section>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const props = defineProps({
	blok: {
		type: Object,
		required: true
	}
})

const title = ref<HTMLElement | null>(null)
const subtitle = ref<HTMLElement | null>(null)
const line = ref<HTMLElement | null>(null)
const wave1 = ref<SVGSVGElement | null>(null)
const wave2 = ref<SVGSVGElement | null>(null)
const path1 = ref<SVGPathElement | null>(null)
const path2 = ref<SVGPathElement | null>(null)
const rock1 = ref<SVGPolygonElement | null>(null)
const rock2 = ref<SVGPolygonElement | null>(null)
const peaks = ref<(HTMLElement | null)[]>([])

onMounted(() => {
	const tl = gsap.timeline({ defaults: { ease: 'power2.out' } })

	tl.to(title.value, {
		opacity: 1,
		y: 0,
		duration: 1,
		delay: 0.3
	})
		.to(subtitle.value, {
			opacity: 1,
			y: 0,
			duration: 0.8
		}, '-=0.5')
		.to(line.value, {
			width: '64px',
			opacity: 1,
			duration: 0.6
		}, '-=0.4')

	if (path1.value) {
		gsap.to(path1.value, {
			strokeDashoffset: 0,
			duration: 2.5,
			ease: 'power1.inOut',
			delay: 0.6
		})
	}

	if (path2.value) {
		gsap.to(path2.value, {
			strokeDashoffset: 0,
			duration: 3,
			ease: 'power1.inOut',
			delay: 0.9
		})
	}

	if (wave1.value) {
		gsap.to(wave1.value, {
			y: 40,
			ease: 'none',
			scrollTrigger: {
				trigger: wave1.value,
				start: 'top bottom',
				end: 'bottom top',
				scrub: 1.2
			}
		})
	}

	if (wave2.value) {
		gsap.to(wave2.value, {
			y: 60,
			ease: 'none',
			scrollTrigger: {
				trigger: wave2.value,
				start: 'top bottom',
				end: 'bottom top',
				scrub: 1.8
			}
		})
	}

	if (rock1.value) {
		gsap.to(rock1.value, {
			rotation: 10,
			transformOrigin: 'center',
			duration: 4,
			repeat: -1,
			yoyo: true,
			ease: 'sine.inOut'
		})
	}

	if (rock2.value) {
		gsap.to(rock2.value, {
			rotation: -15,
			transformOrigin: 'center',
			duration: 5,
			repeat: -1,
			yoyo: true,
			ease: 'sine.inOut',
			delay: 1
		})
	}

	peaks.value.forEach((peak, index) => {
		if (peak) {
			gsap.to(peak, {
				opacity: 0.5,
				scale: 1.2,
				duration: 0.5,
				delay: 0.9 + index * 0.08,
				ease: 'back.out(2)'
			})

			gsap.to(peak, {
				y: -12,
				duration: 2.2 + Math.random() * 0.5,
				repeat: -1,
				yoyo: true,
				ease: 'sine.inOut',
				delay: Math.random() * 2
			})
		}
	})
})
</script>

<style scoped>
svg {
	will-change: transform;
}
</style>
