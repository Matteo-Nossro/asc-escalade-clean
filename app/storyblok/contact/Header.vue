<template>
	<section v-editable="blok" class="relative pt-32 pb-20">

		<!-- Éléments de fond -->
		<div class="absolute inset-0 pointer-events-none">

			<!-- Ondes sonores / Communication -->
			<svg
					ref="wave1"
					class="absolute bottom-0 left-0 w-full h-[300px] text-gray-50"
					viewBox="0 0 1440 320"
					preserveAspectRatio="none"
			>
				<path
						fill="currentColor"
						fill-opacity="1"
						d="M0,64L48,85.3C96,107,192,149,288,154.7C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,154.7C1248,149,1344,107,1392,85.3L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
				/>
			</svg>

			<svg
					ref="wave2"
					class="absolute bottom-0 left-0 w-full h-[400px] text-gray-50/50"
					viewBox="0 0 1440 320"
					preserveAspectRatio="none"
			>
				<path
						fill="currentColor"
						fill-opacity="1"
						d="M0,192L48,197.3C96,203,192,213,288,197.3C384,181,480,139,576,133.3C672,128,768,160,864,181.3C960,203,1056,213,1152,197.3C1248,181,1344,139,1392,117.3L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
				/>
			</svg>

			<!-- Lignes de connexion / réseau -->
			<div class="absolute top-0 left-0 w-full h-64 opacity-20">
				<svg width="100%" height="100%" viewBox="0 0 1440 200" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path
							ref="connectionLine1"
							d="M100 50 L 300 80 L 500 60 L 700 90 L 900 70 L 1100 100 L 1340 80"
							stroke="#7FD857"
							stroke-width="2"
							fill="none"
							stroke-dasharray="2000"
							stroke-dashoffset="2000"
					/>
					<path
							ref="connectionLine2"
							d="M150 100 L 350 130 L 550 110 L 750 140 L 950 120 L 1150 150 L 1340 130"
							stroke="#7FD857"
							stroke-width="1.5"
							fill="none"
							opacity="0.6"
							stroke-dasharray="2000"
							stroke-dashoffset="2000"
					/>
					<path
							ref="connectionLine3"
							d="M200 150 L 400 170 L 600 160 L 800 180 L 1000 170 L 1200 190 L 1340 175"
							stroke="#0F1729"
							stroke-width="1"
							fill="none"
							opacity="0.3"
							stroke-dasharray="2000"
							stroke-dashoffset="2000"
					/>

					<!-- Nœuds de connexion -->
					<circle ref="node1" cx="300" cy="80" r="4" fill="#7FD857" opacity="0" />
					<circle ref="node2" cx="500" cy="60" r="4" fill="#7FD857" opacity="0" />
					<circle ref="node3" cx="700" cy="90" r="4" fill="#7FD857" opacity="0" />
					<circle ref="node4" cx="900" cy="70" r="4" fill="#7FD857" opacity="0" />
					<circle ref="node5" cx="1100" cy="100" r="4" fill="#7FD857" opacity="0" />
				</svg>
			</div>

			<!-- Icônes de communication flottantes -->
			<div
					v-for="(icon, i) in contactIcons"
					:key="`icon-${i}`"
					:ref="el => floatingIcons[i] = el"
					class="absolute opacity-0"
					:style="{
          left: `${12 + i * 18}%`,
          top: `${22 + (i % 3) * 20}%`
        }"
			>
				<UIcon :name="icon" class="w-6 h-6 text-[#7FD857]" />
			</div>

			<!-- Enveloppe stylisée -->
			<svg class="absolute top-16 right-12 w-32 h-32 opacity-8" viewBox="0 0 100 100">
				<rect ref="envelope" x="15" y="30" width="70" height="45" rx="3" stroke="#7FD857" stroke-width="1.5" fill="none" />
				<path ref="envelopeFlap" d="M15 30 L50 55 L85 30" stroke="#7FD857" stroke-width="1.5" fill="none" />
				<line x1="15" y1="75" x2="40" y2="55" stroke="#7FD857" stroke-width="1" opacity="0.5" />
				<line x1="85" y1="75" x2="60" y2="55" stroke="#7FD857" stroke-width="1" opacity="0.5" />
			</svg>

			<!-- Bulles de message -->
			<svg class="absolute bottom-32 left-16 w-28 h-28 opacity-8" viewBox="0 0 100 100">
				<rect ref="bubble1" x="20" y="20" width="50" height="30" rx="8" stroke="#7FD857" stroke-width="1.5" fill="none" />
				<path d="M35 50 L40 60 L45 50" stroke="#7FD857" stroke-width="1.5" fill="none" />
				<line x1="28" y1="30" x2="55" y2="30" stroke="#7FD857" stroke-width="1" opacity="0.5" />
				<line x1="28" y1="38" x2="45" y2="38" stroke="#7FD857" stroke-width="1" opacity="0.5" />
			</svg>

			<!-- Points de connexion décoratifs -->
			<div
					v-for="i in 8"
					:key="`dot-${i}`"
					:ref="el => connectionDots[i] = el"
					class="absolute w-2 h-2 bg-[#7FD857] rounded-full opacity-0"
					:style="{
          left: `${8 + i * 12}%`,
          top: `${18 + (i % 4) * 18}%`
        }"
			></div>

		</div>

		<UContainer class="relative z-10 text-center">
			<!-- Titre Principal -->
			<h1 ref="title" class="text-4xl md:text-6xl font-extrabold text-[#0F1729] mb-4 uppercase tracking-tight">
				{{ blok.title || 'CONTACTEZ-NOUS' }}
			</h1>

			<!-- Sous-titre -->
			<p ref="subtitle" class="text-gray-500 text-lg md:text-xl font-medium max-w-2xl mx-auto mb-8">
				{{ blok.subtitle || 'Une question ? Envie de rejoindre l\'aventure ?' }}
			</p>

			<!-- Trait décoratif -->
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
const wave1 = ref<SVGSVGElement | null>(null)
const wave2 = ref<SVGSVGElement | null>(null)
const connectionLine1 = ref<SVGPathElement | null>(null)
const connectionLine2 = ref<SVGPathElement | null>(null)
const connectionLine3 = ref<SVGPathElement | null>(null)
const node1 = ref<SVGCircleElement | null>(null)
const node2 = ref<SVGCircleElement | null>(null)
const node3 = ref<SVGCircleElement | null>(null)
const node4 = ref<SVGCircleElement | null>(null)
const node5 = ref<SVGCircleElement | null>(null)
const envelope = ref<SVGRectElement | null>(null)
const envelopeFlap = ref<SVGPathElement | null>(null)
const bubble1 = ref<SVGRectElement | null>(null)
const floatingIcons = ref<(HTMLElement | null)[]>([])
const connectionDots = ref<(HTMLElement | null)[]>([])

const contactIcons = [
	'i-heroicons-envelope',
	'i-heroicons-phone',
	'i-heroicons-map-pin',
	'i-heroicons-chat-bubble-left',
	'i-heroicons-at-symbol'
]

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

	const connectionLines = [connectionLine1.value, connectionLine2.value, connectionLine3.value]
	connectionLines.forEach((line, index) => {
		if (line) {
			gsap.to(line, {
				strokeDashoffset: 0,
				duration: 2.2 + index * 0.3,
				ease: 'power1.inOut',
				delay: 0.5 + index * 0.2
			})
		}
	})

	const nodes = [node1.value, node2.value, node3.value, node4.value, node5.value]
	nodes.forEach((node, index) => {
		if (node) {
			gsap.to(node, {
				opacity: 0.8,
				scale: 1.5,
				duration: 0.4,
				delay: 1.5 + index * 0.1,
				ease: 'back.out(2)'
			})

			gsap.to(node, {
				scale: 2,
				opacity: 0.3,
				duration: 2,
				repeat: -1,
				yoyo: true,
				ease: 'sine.inOut',
				delay: 2 + index * 0.2
			})
		}
	})

	if (wave1.value) {
		gsap.to(wave1.value, {
			y: 38,
			ease: 'none',
			scrollTrigger: {
				trigger: wave1.value,
				start: 'top bottom',
				end: 'bottom top',
				scrub: 1.1
			}
		})
	}

	if (wave2.value) {
		gsap.to(wave2.value, {
			y: 58,
			ease: 'none',
			scrollTrigger: {
				trigger: wave2.value,
				start: 'top bottom',
				end: 'bottom top',
				scrub: 1.6
			}
		})
	}

	if (envelope.value) {
		gsap.to(envelope.value, {
			y: -8,
			duration: 3,
			repeat: -1,
			yoyo: true,
			ease: 'sine.inOut'
		})
	}

	if (envelopeFlap.value) {
		gsap.to(envelopeFlap.value, {
			attr: { d: "M15 30 L50 50 L85 30" },
			duration: 3,
			repeat: -1,
			yoyo: true,
			ease: 'sine.inOut',
			delay: 1
		})
	}

	if (bubble1.value) {
		gsap.to(bubble1.value, {
			y: 5,
			rotation: 3,
			duration: 3.5,
			repeat: -1,
			yoyo: true,
			ease: 'sine.inOut',
			delay: 0.5
		})
	}

	floatingIcons.value.forEach((icon, index) => {
		if (icon) {
			gsap.to(icon, {
				opacity: 0.35,
				scale: 1,
				duration: 0.5,
				delay: 1 + index * 0.15,
				ease: 'back.out(2)'
			})

			gsap.to(icon, {
				y: -12,
				rotation: index % 2 === 0 ? 8 : -8,
				duration: 2.8 + Math.random() * 0.6,
				repeat: -1,
				yoyo: true,
				ease: 'sine.inOut',
				delay: Math.random() * 2
			})
		}
	})

	connectionDots.value.forEach((dot, index) => {
		if (dot) {
			gsap.to(dot, {
				opacity: 0.4,
				scale: 1.3,
				duration: 0.5,
				delay: 0.9 + index * 0.09,
				ease: 'back.out(2)'
			})

			gsap.to(dot, {
				y: -10,
				scale: 1.5,
				duration: 2.3 + Math.random() * 0.5,
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
