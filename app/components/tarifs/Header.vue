<template>
	<section class="relative pt-32 pb-20 bg-white overflow-hidden">

		<!-- Éléments de fond -->
		<div class="absolute inset-0 pointer-events-none overflow-hidden">

			<!-- Collines arrondies (différentes des montagnes) -->
			<svg
					ref="hill1"
					class="absolute bottom-0 left-0 w-full h-[280px] text-gray-50"
					viewBox="0 0 1440 320"
					preserveAspectRatio="none"
			>
				<path
						fill="currentColor"
						fill-opacity="1"
						d="M0,160L60,181.3C120,203,240,245,360,240C480,235,600,181,720,181.3C840,181,960,235,1080,234.7C1200,235,1320,181,1380,154.7L1440,128L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"
				/>
			</svg>

			<svg
					ref="hill2"
					class="absolute bottom-0 left-0 w-full h-[380px] text-gray-50/50"
					viewBox="0 0 1440 320"
					preserveAspectRatio="none"
			>
				<path
						fill="currentColor"
						fill-opacity="1"
						d="M0,192L60,208C120,224,240,256,360,250.7C480,245,600,203,720,197.3C840,192,960,224,1080,218.7C1200,213,1320,171,1380,149.3L1440,128L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"
				/>
			</svg>

			<!-- Grille de prix stylisée -->
			<div class="absolute top-0 left-0 w-full h-64 opacity-15">
				<svg width="100%" height="100%" viewBox="0 0 1440 200" fill="none" xmlns="http://www.w3.org/2000/svg">
					<!-- Lignes horizontales -->
					<line
							ref="gridLine1"
							x1="0" y1="60" x2="1440" y2="60"
							stroke="#7FD857"
							stroke-width="1.5"
							opacity="0.4"
							stroke-dasharray="15 10"
							stroke-dashoffset="1440"
					/>
					<line
							ref="gridLine2"
							x1="0" y1="100" x2="1440" y2="100"
							stroke="#7FD857"
							stroke-width="1.5"
							opacity="0.3"
							stroke-dasharray="15 10"
							stroke-dashoffset="1440"
					/>
					<line
							ref="gridLine3"
							x1="0" y1="140" x2="1440" y2="140"
							stroke="#0F1729"
							stroke-width="1"
							opacity="0.2"
							stroke-dasharray="15 10"
							stroke-dashoffset="1440"
					/>
				</svg>
			</div>

			<!-- Symboles Euro décoratifs -->
			<div
					v-for="i in 6"
					:key="`euro-${i}`"
					:ref="el => euros[i] = el"
					class="absolute text-[#7FD857] opacity-0 font-bold text-2xl"
					:style="{
          left: `${12 + i * 16}%`,
          top: `${25 + (i % 2) * 30}%`
        }"
			>
				€
			</div>

			<!-- Carrés géométriques (comme des tickets) -->
			<svg class="absolute bottom-20 right-16 w-32 h-32 opacity-8" viewBox="0 0 100 100">
				<rect ref="ticket1" x="10" y="10" width="80" height="30" rx="3" stroke="#7FD857" stroke-width="1.5" fill="none" />
				<rect ref="ticket2" x="15" y="50" width="70" height="25" rx="3" stroke="#7FD857" stroke-width="1" fill="none" opacity="0.6" />
				<line x1="25" y1="20" x2="75" y2="20" stroke="#7FD857" stroke-width="0.5" opacity="0.4" />
				<line x1="25" y1="30" x2="60" y2="30" stroke="#7FD857" stroke-width="0.5" opacity="0.4" />
			</svg>

		</div>

		<UContainer class="relative z-10 text-center">

			<!-- Titre Principal -->
			<h1 ref="title" class="text-4xl md:text-6xl font-extrabold text-[#0F1729] mb-4 uppercase tracking-tight opacity-0">
				TARIFS & COURS
			</h1>

			<!-- Sous-titre -->
			<p ref="subtitle" class="text-gray-500 text-lg md:text-xl font-medium max-w-2xl mx-auto mb-8 opacity-0">
				Trouvez la formule qui vous correspond
			</p>

			<!-- Trait décoratif -->
			<div ref="line" class="h-1.5 bg-[#7FD857] rounded-full mx-auto opacity-0" style="width: 0"></div>

		</UContainer>
	</section>
</template>

<script setup lang="ts">
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const title = ref<HTMLElement | null>(null)
const subtitle = ref<HTMLElement | null>(null)
const line = ref<HTMLElement | null>(null)
const badge = ref<HTMLElement | null>(null)
const hill1 = ref<SVGSVGElement | null>(null)
const hill2 = ref<SVGSVGElement | null>(null)
const gridLine1 = ref<SVGLineElement | null>(null)
const gridLine2 = ref<SVGLineElement | null>(null)
const gridLine3 = ref<SVGLineElement | null>(null)
const ticket1 = ref<SVGRectElement | null>(null)
const ticket2 = ref<SVGRectElement | null>(null)
const euros = ref<(HTMLElement | null)[]>([])

onMounted(() => {
	// Timeline principale
	const tl = gsap.timeline({ defaults: { ease: 'power2.out' } })

	tl.to(badge.value, {
		opacity: 1,
		y: 0,
		duration: 0.8,
		delay: 0.2
	})
			.to(title.value, {
				opacity: 1,
				y: 0,
				duration: 1,
				delay: 0.3
			}, '-=0.5')
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

	// Animation des lignes de grille
	const gridLines = [gridLine1.value, gridLine2.value, gridLine3.value]
	gridLines.forEach((line, index) => {
		if (line) {
			gsap.to(line, {
				strokeDashoffset: 0,
				duration: 2 + index * 0.3,
				ease: 'power1.inOut',
				delay: 0.5 + index * 0.2
			})
		}
	})

	// Parallax sur les collines
	if (hill1.value) {
		gsap.to(hill1.value, {
			y: 35,
			ease: 'none',
			scrollTrigger: {
				trigger: hill1.value,
				start: 'top bottom',
				end: 'bottom top',
				scrub: 1
			}
		})
	}

	if (hill2.value) {
		gsap.to(hill2.value, {
			y: 55,
			ease: 'none',
			scrollTrigger: {
				trigger: hill2.value,
				start: 'top bottom',
				end: 'bottom top',
				scrub: 1.5
			}
		})
	}

	// Animation des symboles Euro
	euros.value.forEach((euro, index) => {
		if (euro) {
			gsap.to(euro, {
				opacity: 0.15,
				scale: 1,
				duration: 0.5,
				delay: 1 + index * 0.1,
				ease: 'back.out(2)'
			})

			gsap.to(euro, {
				y: -10,
				rotation: index % 2 === 0 ? 5 : -5,
				duration: 3 + Math.random(),
				repeat: -1,
				yoyo: true,
				ease: 'sine.inOut',
				delay: Math.random() * 2
			})
		}
	})

	// Animation des tickets
	if (ticket1.value) {
		gsap.to(ticket1.value, {
			x: 5,
			duration: 3,
			repeat: -1,
			yoyo: true,
			ease: 'sine.inOut'
		})
	}

	if (ticket2.value) {
		gsap.to(ticket2.value, {
			x: -5,
			duration: 4,
			repeat: -1,
			yoyo: true,
			ease: 'sine.inOut',
			delay: 1
		})
	}
})
</script>

<style scoped>
svg {
	will-change: transform;
}
</style>
