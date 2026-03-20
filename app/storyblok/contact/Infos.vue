<template>
	<div v-editable="blok" class="bg-[#0F1729] text-white p-8 md:p-10 rounded-3xl h-full flex flex-col justify-between relative overflow-hidden shadow-xl">

		<div class="relative z-10 space-y-8">
			<div>
				<h3 class="text-2xl font-bold mb-4 text-white">
					{{ blok.title || 'Nos Coordonnées' }}
				</h3>
				<p class="text-gray-400 text-sm leading-relaxed mb-8">
					{{ blok.description || 'N\'hésitez pas à passer nous voir lors des créneaux d\'ouverture au gymnase pour échanger de vive voix.' }}
				</p>
			</div>

			<!-- Liste des infos avec icônes vertes -->
			<div class="space-y-6">

				<!-- Adresse -->
				<div class="flex items-start gap-4 group">
					<div class="w-10 h-10 rounded-lg bg-[#7FD857]/10 flex items-center justify-center text-[#7FD857] group-hover:bg-[#7FD857] group-hover:text-[#0F1729] transition-colors">
						<UIcon name="i-heroicons-map-pin" class="w-5 h-5" />
					</div>
					<div>
						<h4 class="font-bold text-white">Adresse</h4>
						<p class="text-gray-400 text-sm mt-1">
							{{ blok.address_name || 'Gymnase BOIVIN' }}<br>
							{{ blok.address_city || '21800, Chevigny St Sauveur' }}
						</p>
					</div>
				</div>

				<!-- Email -->
				<div class="flex items-start gap-4 group">
					<div class="w-10 h-10 rounded-lg bg-[#7FD857]/10 flex items-center justify-center text-[#7FD857] group-hover:bg-[#7FD857] group-hover:text-[#0F1729] transition-colors">
						<UIcon name="i-heroicons-envelope" class="w-5 h-5" />
					</div>
					<div>
						<h4 class="font-bold text-white">Email</h4>
						<a
							:href="`mailto:${blok.email || 'contact@escalade-chevigny.fr'}`"
							class="text-gray-400 text-sm mt-1 hover:text-[#7FD857] transition-colors"
						>
							{{ blok.email || 'contact@escalade-chevigny.fr' }}
						</a>
					</div>
				</div>

				<!-- Téléphone -->
				<div class="flex items-start gap-4 group">
					<div class="w-10 h-10 rounded-lg bg-[#7FD857]/10 flex items-center justify-center text-[#7FD857] group-hover:bg-[#7FD857] group-hover:text-[#0F1729] transition-colors">
						<UIcon name="i-heroicons-phone" class="w-5 h-5" />
					</div>
					<div>
						<h4 class="font-bold text-white">Téléphone</h4>
						<p class="text-gray-400 text-sm mt-1">
							{{ blok.phone || '03 80 46 46 71' }}
						</p>
					</div>
				</div>

			</div>
		</div>

		<!-- Mini Map -->
		<div class="mt-8 relative h-40 rounded-xl overflow-hidden opacity-80 border border-white/10 hover:opacity-100 transition-opacity">
			<iframe
					width="100%"
					height="100%"
					frameborder="0"
					scrolling="no"
					:src="blok.map_url || 'https://www.openstreetmap.org/export/embed.html?bbox=5.1170,47.3054,5.1383,47.2977&layer=mapnik&marker=47.3015,5.1282'"
			></iframe>
		</div>

	</div>
</template>

<script setup lang="ts">
const props = defineProps({
	blok: {
		type: Object,
		required: true
	}
})
</script>
