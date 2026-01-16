<template>
	<section class="relative pt-32 pb-20 bg-white overflow-hidden">

		<!-- Éléments de fond (Montagnes & Lignes) -->
		<div class="absolute inset-0 pointer-events-none overflow-hidden">

			<!-- Montagnes stylisées (SVG) -->
			<svg class="absolute bottom-0 left-0 w-full h-[300px] text-gray-50" viewBox="0 0 1440 320" preserveAspectRatio="none">
				<path fill="currentColor" fill-opacity="1" d="M0,224L80,192C160,160,320,96,480,106.7C640,117,800,203,960,213.3C1120,224,1280,160,1360,128L1440,96L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"></path>
			</svg>
			<!-- Seconde couche montagne plus claire -->
			<svg class="absolute bottom-0 left-0 w-full h-[400px] text-gray-50/50" viewBox="0 0 1440 320" preserveAspectRatio="none">
				<path fill="currentColor" fill-opacity="1" d="M0,160L60,149.3C120,139,240,117,360,133.3C480,149,600,203,720,202.7C840,203,960,149,1080,133.3C1200,117,1320,139,1380,149.3L1440,160L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"></path>
			</svg>

			<!-- Lignes courbes décoratives (Top) -->
			<div class="absolute top-0 left-0 w-full h-64 opacity-20">
				<svg width="100%" height="100%" viewBox="0 0 1440 200" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path d="M-100 50 Q 600 250 1540 50" stroke="#7FD857" stroke-width="1.5" fill="none" />
					<path d="M-100 100 Q 600 300 1540 100" stroke="#0F1729" stroke-width="1" fill="none" opacity="0.3" />
				</svg>
			</div>

		</div>

		<UContainer class="relative z-10 text-center">

			<!-- Titre Principal -->
			<h1 class="text-4xl md:text-6xl font-extrabold text-[#0F1729] mb-4 uppercase tracking-tight">
				LE CLUB
			</h1>

			<!-- Sous-titre -->
			<p class="text-gray-500 text-lg md:text-xl font-medium max-w-2xl mx-auto mb-8">
				Plus qu'une association, une famille de grimpeurs.
			</p>

			<!-- Trait décoratif vert -->
			<div class="w-16 h-1.5 bg-[#7FD857] rounded-full mx-auto"></div>

		</UContainer>
	</section>
</template>

<script setup>
// Pas de logique nécessaire
</script>

<style scoped>
/* Les SVGs sont gérés via Tailwind classes pour la réactivité */
</style>
