<template>
	<div v-editable="blok">

		<!-- ============================================================ -->
		<!-- DESKTOP — timeline horizontale pineée, scroll vertical→horiz -->
		<!-- ============================================================ -->
		<section
			ref="sectionRef"
			class="hidden lg:flex flex-col relative"
			style="height: calc(100vh - 96px); overflow: hidden; background: #FAFAF9"
		>

			<!-- Décors -->
			<div aria-hidden="true" class="absolute inset-0 pointer-events-none overflow-hidden">
				<div class="absolute -top-40 right-0 w-[600px] h-[600px] rounded-full blur-3xl" style="background: rgba(127,216,87,0.05)" />
				<div class="absolute -bottom-40 left-1/3 w-[500px] h-[500px] rounded-full blur-3xl" style="background: rgba(15,23,41,0.04)" />
			</div>

			<!-- En-tête fixe -->
			<div ref="headerRef" class="shrink-0 pt-26 pb-2 text-center px-8 relative z-10">
				<p class="text-[#7FD857] text-[11px] tracking-[0.35em] uppercase font-semibold mb-0.5">
					{{ blok.eyebrow || 'Depuis le début' }}
				</p>
				<h2 class="text-4xl xl:text-5xl font-extrabold text-[#0F1729] tracking-tight">
					{{ blok.title || 'Notre Histoire' }}
				</h2>
				<p class="flex items-center justify-center gap-2 mt-1 text-gray-300 text-[10px] tracking-[0.2em] uppercase">
					Parcourez notre histoire
					<UIcon name="i-heroicons-arrow-right" class="w-3 h-3 text-[#7FD857]" />
				</p>
			</div>

			<!-- Zone scrollable -->
			<div class="flex-1 relative min-h-0 overflow-hidden">

				<div
					ref="trackRef"
					class="absolute top-0 bottom-0 left-0 flex items-stretch will-change-transform"
					style="width: max-content"
				>

					<!-- Ligne grise de fond (dans le track, scroll avec lui) -->
					<div
						class="absolute top-1/2 -translate-y-1/2 h-px bg-gray-200 pointer-events-none z-0"
						:style="`left: ${PADDING}px; right: ${PADDING}px`"
					/>
					<!-- Ligne verte de progression -->
					<div
						ref="lineRef"
						class="absolute top-1/2 -translate-y-1/2 h-px bg-[#7FD857] pointer-events-none z-0"
						:style="`left: ${PADDING}px; width: 0`"
					/>

					<!-- Padding gauche -->
					<div class="shrink-0" :style="`width: ${PADDING}px`" />

					<!-- ---- Étapes ---- -->
					<div
						v-for="(step, index) in steps"
						:key="step._uid || index"
						class="relative flex flex-col items-center shrink-0 h-full"
						:style="`width: ${CARD_W}px; padding-left: 28px; padding-right: 28px`"
					>

						<!-- Moitié HAUTE -->
						<div class="flex-1 flex flex-col justify-end pb-4 w-full">

							<!-- Pair → image en haut -->
							<template v-if="index % 2 === 0">
								<div :ref="el => { if (el) topRefs[index] = el }">
									<div class="w-full overflow-hidden" style="height: 140px">
										<img
											v-if="step.image?.filename"
											:src="step.image.filename"
											:alt="step.image.alt || step.title"
											class="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
										/>
										<div v-else class="w-full h-full flex items-center justify-center" style="background: #F0F0EE">
											<UIcon name="i-heroicons-photo" class="w-10 h-10 text-gray-300" />
										</div>
									</div>
								</div>
							</template>

							<!-- Impair → texte en haut -->
							<template v-else>
								<div :ref="el => { if (el) topRefs[index] = el }">
									<p
										v-if="step.annotation"
										class="text-gray-300 italic leading-tight mb-3"
										style="font-family: Georgia, 'Times New Roman', serif; font-size: 16px"
									>{{ step.annotation }}</p>
									<p
										class="text-[#7FD857] font-black tracking-tighter"
										style="font-size: 60px; line-height: 0.85"
									>{{ step.date }}</p>
									<h3 class="text-[#0F1729] font-bold text-sm mt-3 mb-1.5 leading-snug">{{ step.title }}</h3>
									<p class="text-gray-400 text-[13px] leading-relaxed">{{ step.description }}</p>
								</div>
							</template>

						</div>

						<!-- Nœud sur la ligne -->
						<div
							:ref="el => { if (el) nodeRefs[index] = el }"
							class="relative z-10 shrink-0"
						>
							<div class="w-3.5 h-3.5 rounded-full bg-[#7FD857] shadow-md" style="outline: 3px solid rgba(127,216,87,0.2); outline-offset: 3px" />
							<div
								:ref="el => { if (el) haloRefs[index] = el }"
								class="absolute inset-0 rounded-full"
								style="background: rgba(127,216,87,0.3)"
							/>
						</div>

						<!-- Moitié BASSE -->
						<div class="flex-1 flex flex-col justify-start pt-4 w-full">

							<!-- Pair → texte en bas -->
							<template v-if="index % 2 === 0">
								<div :ref="el => { if (el) bottomRefs[index] = el }">
									<p
										v-if="step.annotation"
										class="text-gray-300 italic leading-tight mb-3"
										style="font-family: Georgia, 'Times New Roman', serif; font-size: 16px"
									>{{ step.annotation }}</p>
									<p
										class="text-[#7FD857] font-black tracking-tighter"
										style="font-size: 60px; line-height: 0.85"
									>{{ step.date }}</p>
									<h3 class="text-[#0F1729] font-bold text-sm mt-3 mb-1.5 leading-snug">{{ step.title }}</h3>
									<p class="text-gray-400 text-[13px] leading-relaxed">{{ step.description }}</p>
								</div>
							</template>

							<!-- Impair → image en bas -->
							<template v-else>
								<div :ref="el => { if (el) bottomRefs[index] = el }">
									<div class="w-full overflow-hidden" style="height: 140px">
										<img
											v-if="step.image?.filename"
											:src="step.image.filename"
											:alt="step.image.alt || step.title"
											class="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
										/>
										<div v-else class="w-full h-full flex items-center justify-center" style="background: #F0F0EE">
											<UIcon name="i-heroicons-photo" class="w-10 h-10 text-gray-300" />
										</div>
									</div>
								</div>
							</template>

						</div>

					</div>
					<!-- /Étapes -->

					<!-- Padding droit -->
					<div class="shrink-0" :style="`width: ${PADDING}px`" />

				</div>
			</div>

		</section>

		<!-- ====================================== -->
		<!-- MOBILE — timeline verticale éditoriale -->
		<!-- ====================================== -->
		<section class="lg:hidden py-20 relative overflow-hidden" style="background: #FAFAF9">

			<div aria-hidden="true" class="absolute inset-0 pointer-events-none">
				<div class="absolute top-0 right-0 w-60 h-60 rounded-full blur-3xl" style="background: rgba(127,216,87,0.06)" />
			</div>

			<UContainer class="relative z-10">

				<div class="text-center mb-16">
					<p class="text-[#7FD857] text-[11px] tracking-[0.35em] uppercase font-semibold mb-1">
						{{ blok.eyebrow || 'Depuis le début' }}
					</p>
					<h2 class="text-4xl font-extrabold text-[#0F1729] tracking-tight">
						{{ blok.title || 'Notre Histoire' }}
					</h2>
				</div>

				<div class="relative">
					<div class="absolute left-0 top-0 bottom-0 w-px bg-gray-200" />
					<div ref="mobileLineRef" class="absolute left-0 top-0 w-px bg-[#7FD857] h-0" />

					<div class="flex flex-col gap-14 pl-8">
						<div
							v-for="(step, index) in steps"
							:key="`m-${step._uid || index}`"
							:ref="el => { if (el) mobileCardRefs[index] = el }"
							class="relative"
						>
							<!-- Nœud -->
							<div class="absolute -left-8 top-1 w-3 h-3 rounded-full bg-[#7FD857] shadow" style="outline: 3px solid rgba(127,216,87,0.2); outline-offset: 2px" />

							<!-- Annotation -->
							<p
								v-if="step.annotation"
								class="italic mb-2 leading-tight"
								style="font-family: Georgia, serif; font-size: 20px; color: #ccc"
							>{{ step.annotation }}</p>

							<!-- Année -->
							<p class="text-[#7FD857] font-black tracking-tighter" style="font-size: 60px; line-height: 0.85">{{ step.date }}</p>

							<!-- Titre + texte -->
							<h3 class="text-[#0F1729] font-bold mt-2.5 mb-1 text-base leading-snug">{{ step.title }}</h3>
							<p v-if="step.description" class="text-gray-400 text-sm leading-relaxed mb-4">{{ step.description }}</p>

							<!-- Image -->
							<div v-if="step.image?.filename" class="w-full overflow-hidden" style="height: 200px">
								<img
									:src="step.image.filename"
									:alt="step.image.alt || step.title"
									class="w-full h-full object-cover"
								/>
							</div>
						</div>
					</div>

				</div>
			</UContainer>
		</section>

	</div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const PADDING = 120
const CARD_W  = 380
const NAV_H   = 96 // hauteur du header fixe (6rem)

const props = defineProps({
	blok: {
		type: Object,
		required: true
	}
})

const steps = computed(() => {
	if (props.blok.steps?.length) return props.blok.steps
	return [
		{ _uid: '1', title: 'Fondation du club', date: '1998', annotation: 'les débuts...', description: 'Une poignée de passionnés crée l\'ASC Escalade à Chevigny-Saint-Sauveur.', image: { filename: '' } },
		{ _uid: '2', title: 'Première salle', date: '2002', annotation: '', description: 'Ouverture de la première structure d\'escalade intérieure.', image: { filename: '' } },
		{ _uid: '3', title: 'Affiliation FFME', date: '2008', annotation: 'officiellement reconnus !', description: 'Affiliation officielle à la Fédération Française de la Montagne et de l\'Escalade.', image: { filename: '' } },
		{ _uid: '4', title: 'Label Handisport', date: '2015', annotation: '', description: 'Engagement pour une pratique inclusive, ouverture à tous.', image: { filename: '' } },
		{ _uid: '5', title: 'Mur 12 mètres', date: '2019', annotation: 'le plus haut de la région !', description: 'Installation d\'un nouveau mur de 12 mètres, nouvelle dimension.', image: { filename: '' } },
		{ _uid: '6', title: 'Aujourd\'hui', date: '2024', annotation: 'l\'aventure continue...', description: 'Plus de 350 adhérents et une passion intacte pour la grimpe.', image: { filename: '' } },
	]
})

const sectionRef    = ref(null)
const headerRef     = ref(null)
const trackRef      = ref(null)
const lineRef       = ref(null)
const mobileLineRef = ref(null)
const topRefs       = ref([])
const bottomRefs    = ref([])
const nodeRefs      = ref([])
const haloRefs      = ref([])
const mobileCardRefs = ref([])

let horizontalTween = null

onMounted(() => {
	nextTick(() => {
		setupDesktop()
		setupMobile()
	})
})

onBeforeUnmount(() => {
	ScrollTrigger.getAll().forEach(st => st.kill())
})

function setupDesktop() {
	if (!sectionRef.value || !trackRef.value) return

	const section    = sectionRef.value
	const track      = trackRef.value
	const scrollDist = track.scrollWidth - window.innerWidth
	if (scrollDist <= 0) return

	// En-tête
	gsap.from(headerRef.value, { opacity: 0, y: -18, duration: 0.9, ease: 'power3.out' })

	// Scroll horizontal principal (pin + scrub)
	horizontalTween = gsap.to(track, {
		x: -scrollDist,
		ease: 'none',
		scrollTrigger: {
			trigger: section,
			pin: true,
			scrub: 1.2,
			start: `top ${NAV_H}px`,
			end: `+=${scrollDist}`,
			anticipatePin: 1,
		}
	})

	// Ligne de progression verte
	if (lineRef.value) {
		const lineMax = track.scrollWidth - PADDING * 2
		gsap.to(lineRef.value, {
			width: lineMax,
			ease: 'none',
			scrollTrigger: {
				trigger: section,
				scrub: 1.2,
				start: `top ${NAV_H}px`,
				end: `+=${scrollDist}`,
			}
		})
	}

	// Nœuds
	nodeRefs.value.forEach((node) => {
		if (!node) return
		gsap.from(node, {
			opacity: 0, scale: 0,
			duration: 0.5, ease: 'back.out(2)',
			scrollTrigger: {
				trigger: node,
				containerAnimation: horizontalTween,
				start: 'left 85%',
				toggleActions: 'play none none none',
			}
		})
	})

	// Halo pulsant
	haloRefs.value.forEach((halo, i) => {
		if (!halo) return
		gsap.to(halo, { scale: 3, opacity: 0, duration: 2.2, repeat: -1, ease: 'power2.out', delay: i * 0.5 })
	})

	// Blocs texte / image (topRefs + bottomRefs)
	const allContentRefs = [
		...topRefs.value.map((el, i) => ({ el, dir: i % 2 === 0 ? -1 : 1 })),
		...bottomRefs.value.map((el, i) => ({ el, dir: i % 2 === 0 ? 1 : -1 })),
	]

	allContentRefs.forEach(({ el, dir }) => {
		if (!el) return
		gsap.from(el, {
			opacity: 0, y: 22 * dir,
			duration: 0.7, ease: 'power3.out',
			scrollTrigger: {
				trigger: el,
				containerAnimation: horizontalTween,
				start: 'left 92%',
				toggleActions: 'play none none none',
			}
		})
	})
}

function setupMobile() {
	if (!mobileLineRef.value) return

	gsap.from(mobileLineRef.value, {
		height: 0,
		duration: 2.2, ease: 'power2.inOut',
		scrollTrigger: { trigger: mobileLineRef.value, start: 'top 80%', toggleActions: 'play none none none' }
	})

	mobileCardRefs.value.forEach((card) => {
		if (!card) return
		gsap.from(card, {
			opacity: 0, x: 28,
			duration: 0.7, ease: 'power3.out',
			scrollTrigger: { trigger: card, start: 'top 88%', toggleActions: 'play none none none' }
		})
	})
}
</script>
