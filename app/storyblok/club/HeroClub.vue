<template>
	<section v-editable="blok" class="relative pt-32 pb-20 bg-white overflow-hidden">

		<!-- Éléments de fond -->
		<div class="absolute inset-0 pointer-events-none overflow-hidden">

			<svg
					ref="mountain1"
					class="absolute bottom-0 left-0 w-full h-[300px] text-gray-50"
					viewBox="0 0 1440 320"
					preserveAspectRatio="none"
			>
				<path
						fill="currentColor"
						fill-opacity="1"
						d="M0,224L80,192C160,160,320,96,480,106.7C640,117,800,203,960,213.3C1120,224,1280,160,1360,128L1440,96L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"
				/>
			</svg>

			<svg
					ref="mountain2"
					class="absolute bottom-0 left-0 w-full h-[400px] text-gray-50/50"
					viewBox="0 0 1440 320"
					preserveAspectRatio="none"
			>
				<path
						fill="currentColor"
						fill-opacity="1"
						d="M0,160L60,149.3C120,139,240,117,360,133.3C480,149,600,203,720,202.7C840,203,960,149,1080,133.3C1200,117,1320,139,1380,149.3L1440,160L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"
				/>
			</svg>

			<div class="absolute top-0 left-0 w-full h-64 opacity-20">
				<svg width="100%" height="100%" viewBox="0 0 1440 200" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path
							ref="curve1"
							d="M-100 50 Q 600 250 1540 50"
							stroke="#7FD857"
							stroke-width="2"
							fill="none"
							stroke-dasharray="2000"
							stroke-dashoffset="2000"
					/>
					<path
							ref="curve2"
							d="M-100 100 Q 600 300 1540 100"
							stroke="#0F1729"
							stroke-width="1"
							fill="none"
							opacity="0.3"
							stroke-dasharray="2000"
							stroke-dashoffset="2000"
					/>
				</svg>
			</div>

			<div
					v-for="i in 8"
					:key="`dot-${i}`"
					:ref="el => dots[i] = el"
					class="absolute w-2 h-2 bg-[#7FD857] rounded-full opacity-0"
					:style="{
          left: `${10 + i * 12}%`,
          top: `${20 + (i % 3) * 20}%`
        }"
			></div>

			<svg class="absolute top-10 right-10 w-32 h-32 opacity-10" viewBox="0 0 100 100">
				<circle ref="circle1" cx="50" cy="50" r="20" stroke="#7FD857" stroke-width="1" fill="none" />
				<circle ref="circle2" cx="50" cy="50" r="30" stroke="#7FD857" stroke-width="1" fill="none" />
				<circle ref="circle3" cx="50" cy="50" r="40" stroke="#7FD857" stroke-width="1" fill="none" />
			</svg>

		</div>

		<UContainer class="relative z-10 text-center">

			<h1 ref="title" class="text-4xl md:text-6xl font-extrabold text-[#0F1729] mb-4 uppercase tracking-tight">
				{{ blok.title || 'LE CLUB' }}
			</h1>

			<p ref="subtitle" class="text-gray-500 text-lg md:text-xl font-medium max-w-2xl mx-auto mb-8">
				{{ blok.subtitle || 'Plus qu\'une association, une famille de grimpeurs.' }}
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
const mountain1 = ref<SVGSVGElement | null>(null)
const mountain2 = ref<SVGSVGElement | null>(null)
const curve1 = ref<SVGPathElement | null>(null)
const curve2 = ref<SVGPathElement | null>(null)
const circle1 = ref<SVGCircleElement | null>(null)
const circle2 = ref<SVGCircleElement | null>(null)
const circle3 = ref<SVGCircleElement | null>(null)
const dots = ref<(HTMLElement | null)[]>([])

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

	if (curve1.value) {
		gsap.to(curve1.value, {
			strokeDashoffset: 0,
			duration: 2,
			ease: 'power1.inOut',
			delay: 0.5
		})
	}

	if (curve2.value) {
		gsap.to(curve2.value, {
			strokeDashoffset: 0,
			duration: 2.5,
			ease: 'power1.inOut',
			delay: 0.8
		})
	}

	if (mountain1.value) {
		gsap.to(mountain1.value, {
			y: 30,
			ease: 'none',
			scrollTrigger: {
				trigger: mountain1.value,
				start: 'top bottom',
				end: 'bottom top',
				scrub: 1
			}
		})
	}

	if (mountain2.value) {
		gsap.to(mountain2.value, {
			y: 50,
			ease: 'none',
			scrollTrigger: {
				trigger: mountain2.value,
				start: 'top bottom',
				end: 'bottom top',
				scrub: 1.5
			}
		})
	}

	if (circle1.value && circle2.value && circle3.value) {
		gsap.to([circle1.value, circle2.value, circle3.value], {
			attr: { r: (i: number) => `${25 + i * 10}` },
			opacity: 0.05,
			duration: 3,
			repeat: -1,
			yoyo: true,
			ease: 'sine.inOut',
			stagger: 0.3
		})
	}

	dots.value.forEach((dot, index) => {
		if (dot) {
			gsap.to(dot, {
				opacity: 0.4,
				scale: 1,
				duration: 0.5,
				delay: 0.8 + index * 0.1,
				ease: 'back.out(2)'
			})

			gsap.to(dot, {
				y: -10,
				duration: 2 + Math.random(),
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
