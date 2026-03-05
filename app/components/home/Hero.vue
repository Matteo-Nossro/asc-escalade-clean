<template>
	<section class="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden">

		<!-- Image de fond -->
		<div class="absolute inset-0 z-0">
			<SanityImage
					v-if="content.backgroundImage"
					:asset-id="content.backgroundImage.asset._ref"
					:width="1920"
					:height="1080"
					auto="format"
					class="w-full h-full object-cover"
			/>
			<img
					v-else
					src="https://images.unsplash.com/photo-1516592673884-4a382d1124c2?q=80&w=2070&auto=format&fit=crop"
					alt="Mur d'escalade intérieur"
					class="w-full h-full object-cover"
			/>
			<div class="absolute inset-0 bg-black/40"></div>
			<div class="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent"></div>
		</div>

		<!-- Particules flottantes -->
		<div class="absolute inset-0 pointer-events-none z-5">
			<div
					v-for="i in 15"
					:key="`particle-${i}`"
					:ref="el => particles[i] = el"
					class="absolute w-1 h-1 bg-white rounded-full opacity-0"
					:style="{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`
        }"
			></div>
		</div>

		<!-- Contenu -->
		<UContainer class="relative z-10 w-full">
			<div class="max-w-4xl mx-auto text-center flex flex-col items-center gap-6">

				<!-- Surtitre avec encodeDataAttribute -->
				<span
						ref="surtitleRef"
						:data-sanity="encodeDataAttribute(['hero', 'surtitle'])"
						class="text-[#7FD857] font-bold tracking-[0.2em] uppercase text-sm md:text-base opacity-0"
				>
          {{ content.surtitle }}
        </span>

				<!-- Titre Principal -->
				<h1 ref="titleRef" class="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white leading-tight drop-shadow-lg opacity-0">
          <span :data-sanity="encodeDataAttribute(['hero', 'title'])">
            {{ content.title }}
          </span><br>
					<span
							:data-sanity="encodeDataAttribute(['hero', 'titleHighlight'])"
							class="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300"
					>
            {{ content.titleHighlight }}
          </span>
				</h1>

				<!-- Sous-titre -->
				<p
						ref="subtitleRef"
						:data-sanity="encodeDataAttribute(['hero', 'subtitle'])"
						class="text-gray-200 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-4 opacity-0"
				>
					{{ content.subtitle }}
				</p>

				<!-- Boutons d'action -->
				<div ref="buttonsRef" class="flex flex-col sm:flex-row gap-4 w-full sm:w-auto opacity-0">
					<!-- Bouton principal -->
					<UButton
							:to="content.primaryButtonLink"
							size="xl"
							class="group relative bg-[#7FD857] hover:bg-[#6bc745] text-[#0F1729] font-bold px-8 py-4 justify-center overflow-hidden shadow-lg hover:shadow-xl transition-all"
							:ui="{ rounded: 'rounded-full' }"
					>
            <span
								:data-sanity="encodeDataAttribute(['hero', 'primaryButtonText'])"
								class="relative z-10 flex items-center gap-2"
						>
              {{ content.primaryButtonText }}
              <UIcon name="i-heroicons-arrow-right" class="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
						<div class="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
					</UButton>

					<!-- Bouton secondaire -->
					<UButton
							:to="content.secondaryButtonLink"
							size="xl"
							class="group relative bg-white/10 backdrop-blur-md hover:bg-white/20 text-white font-bold px-8 py-4 justify-center border-2 border-white/30 hover:border-white shadow-lg hover:shadow-xl transition-all"
							:ui="{ rounded: 'rounded-full' }"
					>
            <span
								:data-sanity="encodeDataAttribute(['hero', 'secondaryButtonText'])"
								class="relative z-10 flex items-center gap-2"
						>
              {{ content.secondaryButtonText }}
              <UIcon name="i-heroicons-map" class="w-5 h-5 group-hover:scale-110 transition-transform" />
            </span>
					</UButton>
				</div>

			</div>
		</UContainer>

		<!-- SVG décoratifs - Thème MONTAGNE -->
		<svg class="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20 z-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080">
			<path
					ref="mountain1Ref"
					d="M0 800 L200 600 L400 700 L600 500 L800 650 L1000 550 L1200 700 L1400 600 L1600 750 L1800 650 L1920 800"
					stroke="white"
					stroke-width="2"
					fill="none"
					stroke-dasharray="3500"
					stroke-dashoffset="3500"
			/>
			<path
					ref="mountain2Ref"
					d="M0 900 L150 750 L300 820 L500 680 L700 800 L900 700 L1100 820 L1300 740 L1500 850 L1700 780 L1920 900"
					stroke="#7FD857"
					stroke-width="2.5"
					fill="none"
					stroke-dasharray="3500"
					stroke-dashoffset="3500"
			/>
			<line ref="altLine1Ref" x1="0" y1="300" x2="1920" y2="300" stroke="white" stroke-width="1" opacity="0.3" stroke-dasharray="3000" stroke-dashoffset="3000" />
			<line ref="altLine2Ref" x1="0" y1="450" x2="1920" y2="450" stroke="white" stroke-width="1" opacity="0.3" stroke-dasharray="3000" stroke-dashoffset="3000" />
			<line ref="altLine3Ref" x1="0" y1="600" x2="1920" y2="600" stroke="#7FD857" stroke-width="1" opacity="0.3" stroke-dasharray="3000" stroke-dashoffset="3000" />
			<line ref="ridge1Ref" x1="200" y1="600" x2="600" y2="200" stroke="white" stroke-width="1.5" opacity="0.4" stroke-dasharray="600" stroke-dashoffset="600" />
			<line ref="ridge2Ref" x1="1400" y1="600" x2="1700" y2="150" stroke="#7FD857" stroke-width="1.5" opacity="0.4" stroke-dasharray="700" stroke-dashoffset="700" />
			<line ref="ridge3Ref" x1="800" y1="700" x2="1000" y2="250" stroke="white" stroke-width="1" opacity="0.3" stroke-dasharray="650" stroke-dashoffset="650" />
			<path ref="trail1Ref" d="M0 850 Q 300 800, 500 830 T 900 820 T 1920 850" stroke="white" stroke-width="1.5" fill="none" opacity="0.3" stroke-dasharray="8 4" stroke-dashoffset="4000" />
			<path ref="trail2Ref" d="M0 920 Q 400 870, 700 890 T 1200 910 T 1920 920" stroke="#7FD857" stroke-width="1.5" fill="none" opacity="0.3" stroke-dasharray="8 4" stroke-dashoffset="4000" />
			<circle ref="summit1Ref" cx="600" cy="500" r="0" stroke="white" stroke-width="2" fill="white" opacity="0.6" />
			<circle ref="summit2Ref" cx="1400" cy="600" r="0" stroke="#7FD857" stroke-width="2" fill="#7FD857" opacity="0.6" />
			<circle ref="summit3Ref" cx="1000" cy="550" r="0" stroke="white" stroke-width="1.5" fill="white" opacity="0.4" />
			<path ref="zigzagRef" d="M1500 950 L1550 900 L1500 850 L1550 800 L1600 750 L1650 700 L1700 650" stroke="#7FD857" stroke-width="2" fill="none" opacity="0.3" stroke-dasharray="800" stroke-dashoffset="800" />
		</svg>

		<!-- Indicateur de scroll -->
		<div ref="scrollIndicatorRef" class="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10 opacity-0">
			<div class="flex flex-col items-center gap-2 text-white/70 animate-bounce">
				<span class="text-xs uppercase tracking-wider">Scroll</span>
				<UIcon name="i-heroicons-chevron-down" class="w-5 h-5" />
			</div>
		</div>

	</section>
</template>

<script setup lang="ts">
import { gsap } from 'gsap'

// Props
const props = defineProps<{
	content: {
		surtitle: string
		title: string
		titleHighlight: string
		subtitle: string
		backgroundImage?: any
		primaryButtonText: string
		primaryButtonLink: string
		secondaryButtonText: string
		secondaryButtonLink: string
	},
	encodeDataAttribute: (path: string[]) => string

	// documentId: string,
	// documentType: string
}>()

// Utiliser le composable pour Visual Editing
const { sanityProps } = useSanityVisualEditing(props.documentId, props.documentType)

// 🔍 LOG DE DEBUG
console.log('Test sanityProps:', sanityProps('hero.surtitle'))
// Devrait afficher : { 'data-sanity': 'hero.surtitle' }


// Refs pour les animations
const surtitleRef = ref<HTMLElement | null>(null)
const titleRef = ref<HTMLElement | null>(null)
const subtitleRef = ref<HTMLElement | null>(null)
const buttonsRef = ref<HTMLElement | null>(null)
const scrollIndicatorRef = ref<HTMLElement | null>(null)

// Refs SVG
const mountain1Ref = ref<SVGPathElement | null>(null)
const mountain2Ref = ref<SVGPathElement | null>(null)
const altLine1Ref = ref<SVGLineElement | null>(null)
const altLine2Ref = ref<SVGLineElement | null>(null)
const altLine3Ref = ref<SVGLineElement | null>(null)
const ridge1Ref = ref<SVGLineElement | null>(null)
const ridge2Ref = ref<SVGLineElement | null>(null)
const ridge3Ref = ref<SVGLineElement | null>(null)
const trail1Ref = ref<SVGPathElement | null>(null)
const trail2Ref = ref<SVGPathElement | null>(null)
const summit1Ref = ref<SVGCircleElement | null>(null)
const summit2Ref = ref<SVGCircleElement | null>(null)
const summit3Ref = ref<SVGCircleElement | null>(null)
const zigzagRef = ref<SVGPathElement | null>(null)
const particles = ref<(HTMLElement | null)[]>([])

onMounted(() => {
	// Timeline principale pour le contenu
	const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

	tl.to(surtitleRef.value, { opacity: 1, y: 0, duration: 0.8, delay: 0.3 })
			.to(titleRef.value, { opacity: 1, y: 0, duration: 1, delay: 0.2 }, '-=0.5')
			.to(subtitleRef.value, { opacity: 1, y: 0, duration: 0.8 }, '-=0.6')
			.to(buttonsRef.value, { opacity: 1, y: 0, duration: 0.8 }, '-=0.4')
			.to(scrollIndicatorRef.value, { opacity: 1, duration: 0.5 }, '-=0.2')

	// Animations SVG
	if (mountain1Ref.value) {
		gsap.to(mountain1Ref.value, { strokeDashoffset: 0, duration: 3.5, ease: 'power1.inOut', delay: 0.5 })
	}
	if (mountain2Ref.value) {
		gsap.to(mountain2Ref.value, { strokeDashoffset: 0, duration: 4, ease: 'power1.inOut', delay: 0.8 })
	}

	const altLines = [
		{ ref: altLine1Ref.value, delay: 1.2 },
		{ ref: altLine2Ref.value, delay: 1.5 },
		{ ref: altLine3Ref.value, delay: 1.8 }
	]
	altLines.forEach(({ ref, delay }) => {
		if (ref) gsap.to(ref, { strokeDashoffset: 0, duration: 2, ease: 'power1.inOut', delay })
	})

	const ridges = [
		{ ref: ridge1Ref.value, delay: 2 },
		{ ref: ridge2Ref.value, delay: 2.2 },
		{ ref: ridge3Ref.value, delay: 2.4 }
	]
	ridges.forEach(({ ref, delay }) => {
		if (ref) gsap.to(ref, { strokeDashoffset: 0, duration: 1.5, ease: 'power2.out', delay })
	})

	if (trail1Ref.value) {
		gsap.to(trail1Ref.value, { strokeDashoffset: 0, duration: 3, ease: 'power1.inOut', delay: 2.5 })
	}
	if (trail2Ref.value) {
		gsap.to(trail2Ref.value, { strokeDashoffset: 0, duration: 3, ease: 'power1.inOut', delay: 2.8 })
	}

	const summits = [
		{ ref: summit1Ref.value, delay: 3 },
		{ ref: summit2Ref.value, delay: 3.2 },
		{ ref: summit3Ref.value, delay: 3.4 }
	]
	summits.forEach(({ ref, delay }) => {
		if (ref) {
			gsap.to(ref, { attr: { r: 3 }, duration: 0.6, ease: 'back.out(2)', delay })
			gsap.to(ref, { attr: { r: 5 }, duration: 2, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: delay + 1 })
		}
	})

	if (zigzagRef.value) {
		gsap.to(zigzagRef.value, { strokeDashoffset: 0, duration: 2, ease: 'power1.inOut', delay: 3 })
		gsap.to(zigzagRef.value, { strokeDashoffset: -800, duration: 8, repeat: -1, ease: 'linear', delay: 5 })
	}

	particles.value.forEach((particle) => {
		if (particle) {
			gsap.to(particle, {
				opacity: Math.random() * 0.6 + 0.2,
				y: -100 - Math.random() * 150,
				x: (Math.random() - 0.5) * 100,
				duration: 4 + Math.random() * 4,
				delay: Math.random() * 2,
				repeat: -1,
				ease: 'none'
			})
		}
	})
})

</script>

<style scoped>
[ref*="Ref"] {
	transform: translateY(30px);
}

@keyframes bounce {
	0%, 100% {
		transform: translateY(0);
	}
	50% {
		transform: translateY(-10px);
	}
}

.animate-bounce {
	animation: bounce 2s infinite;
}
</style>
