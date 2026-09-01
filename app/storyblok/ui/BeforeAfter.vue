<template>
	<section v-editable="blok" class="py-12">
		<UContainer>

			<!-- Titre optionnel -->
			<div v-if="blok.title" class="text-center mb-8">
				<h2 class="text-3xl font-extrabold text-[#0F1729] tracking-tight">{{ blok.title }}</h2>
				<p v-if="blok.subtitle" class="text-gray-400 mt-2">{{ blok.subtitle }}</p>
			</div>

			<!-- Conteneur slider -->
			<div
				ref="containerRef"
				class="relative select-none overflow-hidden rounded-2xl shadow-xl cursor-col-resize"
				:style="`aspect-ratio: ${aspectRatio}`"
				@mousedown="startDrag"
				@touchstart.passive="startDrag"
			>
				<!-- Image APRÈS — pleine taille fixe -->
				<img
					v-if="blok.image_after?.filename"
					:src="blok.image_after.filename"
					:alt="blok.label_after || 'Après'"
					class="absolute inset-0 w-full h-full object-cover pointer-events-none"
					draggable="false"
				/>
				<div v-else class="absolute inset-0 flex items-center justify-center bg-gray-100">
					<UIcon name="i-heroicons-photo" class="w-16 h-16 text-gray-300" />
				</div>

				<!-- Image AVANT — même taille, coupée par clip-path -->
				<img
					v-if="blok.image_before?.filename"
					:src="blok.image_before.filename"
					:alt="blok.label_before || 'Avant'"
					class="absolute inset-0 w-full h-full object-cover pointer-events-none"
					:style="`clip-path: inset(0 ${100 - position}% 0 0)`"
					draggable="false"
				/>
				<div
					v-else
					class="absolute inset-0 flex items-center justify-center bg-gray-200"
					:style="`clip-path: inset(0 ${100 - position}% 0 0)`"
				>
					<UIcon name="i-heroicons-photo" class="w-16 h-16 text-gray-400" />
				</div>

				<!-- Séparateur vertical -->
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
					style="background: rgba(15,23,41,0.65); backdrop-filter: blur(4px)"
					:style="position < 15 ? 'opacity: 0' : 'opacity: 1'"
				>
					{{ blok.label_before || 'Avant' }}
				</div>

				<!-- Label APRÈS -->
				<div
					class="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest text-white pointer-events-none z-10 transition-opacity duration-200"
					style="background: rgba(127,216,87,0.8); backdrop-filter: blur(4px)"
					:style="position > 85 ? 'opacity: 0' : 'opacity: 1'"
				>
					{{ blok.label_after || 'Après' }}
				</div>

			</div>

		</UContainer>
	</section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps({
	blok: {
		type: Object,
		required: true
	}
})

const containerRef = ref(null)
const position = ref(50)
let dragging = false

const aspectRatio = computed(() => props.blok.aspect_ratio || '16/9')

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
	const rect = (containerRef.value as HTMLElement).getBoundingClientRect()
	const x = getX(e) - rect.left
	position.value = Math.min(100, Math.max(0, (x / rect.width) * 100))
}
</script>
