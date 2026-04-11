<template>
	<div v-editable="blok" class="relative max-w-6xl mx-auto mb-20 px-4">
		<div class="bg-white rounded-2xl shadow-xl p-8 md:p-12 text-center relative z-10 border border-gray-100">

			<h2 class="text-2xl font-bold text-[#0F1729] mb-4">
				{{ blok.title || 'Le Concept' }}
			</h2>

			<div
				v-if="renderedDescription"
				class="prose prose-gray max-w-2xl mx-auto mb-8"
				v-html="renderedDescription"
			/>
			<p v-else class="text-gray-500 mb-8 max-w-2xl mx-auto leading-relaxed">
				L'association propose régulièrement des sorties encadrées pour découvrir l'escalade en milieu naturel ou se perfectionner en salle. L'inscription est obligatoire et se fait directement en ligne.
			</p>

			<!-- Tags dynamiques depuis Storyblok -->
			<div v-if="blok.tags?.length" class="flex flex-wrap justify-center gap-3">
				<UBadge
					v-for="(tag, index) in blok.tags"
					:key="tag._uid || index"
					color="neutral"
					variant="soft"
					size="md"
					class="px-4 py-1.5 font-bold uppercase tracking-wide text-xs"
				>
					{{ tag.label }}
				</UBadge>
			</div>

			<!-- Fallback tags statiques -->
			<!-- <div v-else class="flex flex-wrap justify-center gap-3">
				<UBadge color="neutral" variant="soft" size="md" class="px-4 py-1.5 font-bold uppercase tracking-wide text-xs">Stage</UBadge>
				<UBadge color="neutral" variant="soft" size="md" class="px-4 py-1.5 font-bold uppercase tracking-wide text-xs">Falaise</UBadge>
				<UBadge color="neutral" variant="soft" size="md" class="px-4 py-1.5 font-bold uppercase tracking-wide text-xs">Climb Up</UBadge>
				<UBadge color="neutral" variant="soft" size="md" class="px-4 py-1.5 font-bold uppercase tracking-wide text-xs">Cime Altitude</UBadge>
			</div> -->

		</div>
	</div>
</template>

<script setup>
import { computed } from 'vue'
import { renderRichText } from '@storyblok/vue'

const props = defineProps({
	blok: {
		type: Object,
		required: true
	}
})

const renderedDescription = computed(() =>
	props.blok.description ? renderRichText(props.blok.description, {
		resolvers: {
			hardBreak: () => '<br />'
		}
	}) : ''
)
</script>
