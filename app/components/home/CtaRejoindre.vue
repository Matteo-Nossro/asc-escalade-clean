<template>
	<section class="relative py-32 overflow-hidden">
		<!-- Image de fond -->
		<div class="absolute inset-0 z-0">
			<img
					src="https://images.unsplash.com/photo-1516592673884-4a382d1124c2?q=80&w=2070&auto=format&fit=crop"
					alt="Mur d'escalade sombre"
					class="w-full h-full object-cover"
			/>
			<!-- Overlay bleu nuit dégradé -->
			<div class="absolute inset-0 bg-[#0F1729]/90 mix-blend-multiply"></div>
			<!-- Second overlay pour s'assurer de la lisibilité -->
			<div class="absolute inset-0 bg-gradient-to-t from-[#0F1729] via-transparent to-[#0F1729]/50"></div>
		</div>

		<UContainer class="relative z-10 text-center">
			<div class="max-w-3xl mx-auto flex flex-col items-center gap-8">

				<!-- Titre -->
				<h2 class="text-3xl md:text-5xl font-bold text-white leading-tight">
					Prêt à rejoindre l'aventure ?
				</h2>

				<!-- Texte descriptif -->
				<p class="text-gray-300 text-lg md:text-xl leading-relaxed max-w-2xl">
					Que vous soyez débutant ou expert, il y a une place pour vous chez Vertical Pulse.
					Venez essayer lors d'une séance d'initiation.
				</p>

				<!-- Bouton d'action -->
				<UButton
						to="/contact"
						size="xl"
						class="font-bold px-8 py-4 transition-transform hover:scale-105 bg-[#7FD857] hover:bg-[#6bc745] text-[#0F1729]"
						:ui="{ rounded: 'rounded-md' }"
				>
					Contactez-nous
				</UButton>

			</div>
		</UContainer>

		<!-- Éléments décoratifs (formes géométriques floues en arrière-plan) -->
		<div class="absolute top-1/2 left-10 w-64 h-64 bg-[#7FD857] rounded-full mix-blend-overlay filter blur-[100px] opacity-20 animate-pulse"></div>
		<div class="absolute bottom-0 right-10 w-96 h-96 bg-blue-500 rounded-full mix-blend-overlay filter blur-[120px] opacity-20"></div>
	</section>
</template>

<script setup>
// Pas de logique nécessaire pour ce composant statique
</script>

<style scoped>
/* L'animation pulse est gérée par Tailwind (animate-pulse) */
</style>
