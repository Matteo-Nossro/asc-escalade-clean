<template>
	<!-- Le parent gère la largeur, ici on gère le style interne du bloc bleu -->
	<div class="bg-[#0F1729] text-white p-8 md:p-10 rounded-3xl h-full flex flex-col justify-between relative overflow-hidden shadow-xl">

		<div class="relative z-10 space-y-8">
			<div>
				<h3 class="text-2xl font-bold mb-4 text-white">Nos Coordonnées</h3>
				<p class="text-gray-400 text-sm leading-relaxed mb-8">
					N'hésitez pas à passer nous voir lors des créneaux d'ouverture au gymnase pour échanger de vive voix.
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
							Gymnase Municipal<br>
							39100 Dole, France
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
						<a href="mailto:contact@verticalpulse.fr" class="text-gray-400 text-sm mt-1 hover:text-[#7FD857] transition-colors">
							contact@verticalpulse.fr
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
							03 84 00 00 00
						</p>
					</div>
				</div>

			</div>
		</div>

		<!-- Mini Map décorative en bas du bloc -->
		<div class="mt-8 relative h-40 rounded-xl overflow-hidden opacity-80 border border-white/10 hover:opacity-100 transition-opacity">
			<iframe
					width="100%"
					height="100%"
					frameborder="0"
					scrolling="no"
					src="https://www.openstreetmap.org/export/embed.html?bbox=5.4800,47.0850,5.5050,47.1000&amp;layer=mapnik&amp;marker=47.0927,5.4925"
					class="grayscale invert contrast-125 brightness-75"
			></iframe>
			<div class="absolute inset-0 flex items-center justify-center pointer-events-none">
				<UIcon name="i-heroicons-map-pin" class="w-8 h-8 text-[#7FD857] drop-shadow-lg animate-bounce" />
			</div>
		</div>

	</div>
</template>
