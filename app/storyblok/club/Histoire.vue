<template>
	<section v-editable="blok" id="histoire" class="py-20 bg-white">
		<UContainer>
			<div class="grid grid-cols-1 gap-16 items-center lg:grid-cols-2" :class="imageFirst ? 'lg:[&>*:first-child]:order-2 lg:[&>*:last-child]:order-1' : ''">

				<!-- Colonne Texte -->
				<div class="flex flex-col gap-6">
					<div class="flex items-center gap-3 mb-2">
						<UIcon name="i-heroicons-clock" class="w-8 h-8 text-[#7FD857]" />
						<h2 class="text-3xl font-bold text-[#0F1729]">
							{{ blok.title || 'Notre Histoire' }}
						</h2>
					</div>

					<div
						v-if="blok.content"
						class="space-y-4 text-gray-600 leading-relaxed text-justify prose prose-p:text-gray-600 prose-strong:text-[#0F1729] max-w-none"
						v-html="renderedContent"
					/>
					<div v-else class="space-y-6 text-gray-600 leading-relaxed text-justify">
						<p>Fondé en 1998 par une poignée de passionnés, l'ASC Escalade n'était au départ qu'un petit groupe d'amis se réunissant pour grimper sur les falaises locales.</p>
						<p>Aujourd'hui, l'association a bien grandi mais l'esprit reste le même : convivialité, partage et dépassement de soi. Nous avons pour mission de rendre l'escalade accessible à tous, quel que soit l'âge, le niveau ou la condition physique.</p>
						<p>Affiliés à la FFME et labellisés Handisport, nous nous engageons pour une pratique sécurisée et inclusive.</p>
					</div>
				</div>

				<!-- Colonne Image -->
				<div class="relative h-[400px] rounded-3xl overflow-hidden">

					<!-- Slider avant/après si deux images -->
					<template v-if="blok.image?.filename && blok.image_after?.filename">
						<div
							ref="containerRef"
							class="relative w-full h-full select-none cursor-col-resize"
							@mousedown="startDrag"
							@touchstart.passive="startDrag"
						>
							<!-- Image APRÈS -->
							<img
								:src="blok.image_after.filename"
								:alt="blok.label_after || 'Après'"
								class="absolute inset-0 w-full h-full object-cover pointer-events-none"
								draggable="false"
							/>
							<!-- Image AVANT coupée -->
							<img
								:src="blok.image.filename"
								:alt="blok.label_before || 'Avant'"
								class="absolute inset-0 w-full h-full object-cover pointer-events-none"
								:style="`clip-path: inset(0 ${100 - position}% 0 0)`"
								draggable="false"
							/>
							<!-- Séparateur -->
							<div
								class="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg pointer-events-none z-10"
								:style="`left: ${position}%`"
							/>
							<!-- Handle -->
							<div
								class="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-11 h-11 rounded-full bg-white shadow-xl flex items-center justify-center gap-0.5 pointer-events-none z-20"
								:style="`left: ${position}%`"
							>
								<UIcon name="i-heroicons-chevron-left" class="w-4 h-4 text-[#0F1729]" />
								<UIcon name="i-heroicons-chevron-right" class="w-4 h-4 text-[#0F1729]" />
							</div>
							<!-- Label AVANT -->
							<div
								class="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest text-white pointer-events-none z-10 transition-opacity duration-200"
								:style="`background: rgba(15,23,41,0.65); backdrop-filter: blur(4px); opacity: ${position < 15 ? 0 : 1}`"
							>
								{{ blok.label_before || 'Avant' }}
							</div>
							<!-- Label APRÈS -->
							<div
								class="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest text-white pointer-events-none z-10 transition-opacity duration-200"
								:style="`background: rgba(127,216,87,0.8); backdrop-filter: blur(4px); opacity: ${position > 85 ? 0 : 1}`"
							>
								{{ blok.label_after || 'Après' }}
							</div>
						</div>
					</template>

					<!-- Image simple -->
					<template v-else-if="blok.image?.filename">
						<NuxtImg
							provider="storyblok"
							:src="blok.image.filename"
							:alt="blok.image.alt || blok.title || 'Histoire du club'"
							format="webp"
							:quality="80"
							:width="600"
							:height="400"
							class="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
						/>
					</template>

					<!-- Fallback décoratif -->
					<template v-else>
						<div class="w-full h-full bg-gray-50 flex items-center justify-center">
							<div class="absolute w-64 h-64 border border-gray-200 rounded-full opacity-50"></div>
							<div class="absolute w-80 h-80 border border-gray-100 rounded-full opacity-30"></div>
						</div>
					</template>

				</div>

			</div>
		</UContainer>
	</section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { renderRichText } from '@storyblok/vue'

const props = defineProps({
	blok: {
		type: Object,
		required: true
	}
})

const renderedContent = computed(() =>
	props.blok.content ? renderRichText(props.blok.content) : ''
)

const imageFirst = computed(() => props.blok.image_position === 'left')

// Slider avant/après
const containerRef = ref<HTMLElement | null>(null)
const position = ref(50)
let dragging = false

function getX(e: MouseEvent | TouchEvent): number {
	if ('touches' in e) return e.touches[0].clientX
	return (e as MouseEvent).clientX
}

function startDrag(e: MouseEvent | TouchEvent) {
	dragging = true
	updatePosition(e)
	window.addEventListener('mousemove', onMove)
	window.addEventListener('mouseup', stopDrag)
	window.addEventListener('touchmove', onMove, { passive: true })
	window.addEventListener('touchend', stopDrag)
}

function onMove(e: MouseEvent | TouchEvent) {
	if (!dragging) return
	updatePosition(e)
}

function stopDrag() {
	dragging = false
	window.removeEventListener('mousemove', onMove)
	window.removeEventListener('mouseup', stopDrag)
	window.removeEventListener('touchmove', onMove)
	window.removeEventListener('touchend', stopDrag)
}

function updatePosition(e: MouseEvent | TouchEvent) {
	if (!containerRef.value) return
	const rect = containerRef.value.getBoundingClientRect()
	const x = getX(e) - rect.left
	position.value = Math.min(100, Math.max(0, (x / rect.width) * 100))
}
</script>
