<template>
	<section class="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden">

		<!-- Image de fond -->
		<div class="absolute inset-0 z-0">
			<img
					src="https://images.unsplash.com/photo-1516592673884-4a382d1124c2?q=80&w=2070&auto=format&fit=crop"
					alt="Mur d'escalade intérieur"
					class="w-full h-full object-cover"
			/>
			<!-- Overlay sombre pour la lisibilité -->
			<div class="absolute inset-0 bg-black/40"></div>
			<!-- Overlay dégradé bas pour la transition -->
			<div class="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent"></div>
		</div>

		<!-- Contenu -->
		<UContainer class="relative z-10 w-full">
			<div class="max-w-4xl mx-auto text-center flex flex-col items-center gap-6">

				<!-- Surtitre -->
				<span class="text-[#7FD857] font-bold tracking-[0.2em] uppercase text-sm md:text-base animate-fade-in-up">
          Club d'escalade Annecy
        </span>

				<!-- Titre Principal -->
				<h1 class="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white leading-tight drop-shadow-lg animate-fade-in-up delay-100">
					GRIMPEZ VERS<br>
					<span class="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300">
            DE NOUVEAUX SOMMETS
          </span>
				</h1>

				<!-- Sous-titre -->
				<p class="text-gray-200 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-4 animate-fade-in-up delay-200">
					Rejoignez une communauté passionnée. Mur, falaise, bloc - quel que soit votre niveau, Vertical Pulse est votre point de départ.
				</p>

				<!-- Boutons d'action -->
				<div class="flex flex-col sm:flex-row gap-4 w-full sm:w-auto animate-fade-in-up delay-300">
					<UButton
							to="/le-club"
							size="xl"
							class="bg-[#7FD857] hover:bg-[#6bc745] text-[#0F1729] font-bold px-8 py-4 justify-center"
							:ui="{ rounded: 'rounded-md' }"
					>
						Rejoindre le club
					</UButton>

					<UButton
							to="/sorties"
							size="xl"
							variant="outline"
							color="white"
							class="font-bold px-8 py-4 border-2 hover:bg-white hover:text-[#0F1729] justify-center"
							:ui="{ rounded: 'rounded-md' }"
					>
						Découvrir les sorties
					</UButton>
				</div>

			</div>
		</UContainer>

		<!-- Éléments décoratifs (lignes courbes en arrière-plan comme sur la maquette) -->
		<svg class="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20 z-0" xmlns="http://www.w3.org/2000/svg">
			<path d="M-100 600 Q 400 300 900 600 T 1900 600" stroke="white" stroke-width="2" fill="none" />
			<path d="M-100 800 Q 400 500 900 800 T 1900 800" stroke="#7FD857" stroke-width="2" fill="none" />
		</svg>

	</section>
</template>

<style scoped>
/* Animation d'apparition simple */
.animate-fade-in-up {
	animation: fadeInUp 0.8s ease-out forwards;
	opacity: 0;
	transform: translateY(20px);
}

.delay-100 { animation-delay: 0.1s; }
.delay-200 { animation-delay: 0.2s; }
.delay-300 { animation-delay: 0.3s; }

@keyframes fadeInUp {
	to {
		opacity: 1;
		transform: translateY(0);
	}
}
</style>
