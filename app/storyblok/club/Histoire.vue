<template>
	<section v-editable="blok" id="histoire" class="py-20 bg-white">
		<UContainer>
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

				<!-- Colonne Gauche : Texte -->
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
					<!-- Fallback texte statique -->
					<div v-else class="space-y-6 text-gray-600 leading-relaxed text-justify">
						<p>Fondé en 1998 par une poignée de passionnés, l'ASC Escalade n'était au départ qu'un petit groupe d'amis se réunissant pour grimper sur les falaises locales.</p>
						<p>Aujourd'hui, l'association a bien grandi mais l'esprit reste le même : convivialité, partage et dépassement de soi. Nous avons pour mission de rendre l'escalade accessible à tous, quel que soit l'âge, le niveau ou la condition physique.</p>
						<p>Affiliés à la FFME et labellisés Handisport, nous nous engageons pour une pratique sécurisée et inclusive.</p>
					</div>
				</div>

				<!-- Colonne Droite : Image ou visuel décoratif -->
				<div class="relative h-[400px] bg-gray-50 rounded-3xl overflow-hidden flex items-center justify-center group">

					<!-- Image Storyblok si fournie -->
					<NuxtImg
						v-if="blok.image?.filename"
						provider="storyblok"
						:src="blok.image.filename"
						:alt="blok.image.alt || blok.title || 'Histoire du club'"
						format="webp"
						:quality="80"
						:width="600"
						:height="400"
						class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
					/>

					<!-- Fallback : visuel décoratif année de fondation -->
					<template v-else>
						<svg
								class="absolute bottom-0 w-full text-gray-200 opacity-50 transition-transform duration-700 group-hover:scale-105"
								viewBox="0 0 1440 320"
								preserveAspectRatio="none"
						>
							<path fill="currentColor" d="M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,181.3C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
						</svg>

						<div class="absolute w-64 h-64 border border-gray-200 rounded-full opacity-50"></div>
						<div class="absolute w-80 h-80 border border-gray-100 rounded-full opacity-30"></div>
					</template>

				</div>

			</div>
		</UContainer>
	</section>
</template>

<script setup lang="ts">
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
</script>
