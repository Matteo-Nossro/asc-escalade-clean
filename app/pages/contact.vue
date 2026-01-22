<template>
	<div class="min-h-screen relative pb-32">

		<!-- Déco Fond Géométrique (Triangles gris très légers) -->
		<svg class="absolute top-0 left-0 w-full h-full pointer-events-none opacity-40" viewBox="0 0 1440 800" fill="none" preserveAspectRatio="none">
			<path d="M-100 0 L600 800 L1500 0 Z" fill="#F3F4F6"/>
			<path d="M1200 800 L800 0 L1600 0 Z" fill="#E5E7EB" opacity="0.5"/>
		</svg>

		<UContainer class="relative z-10 page-content min-h-screen">

			<!-- 1. En-tête -->
			<ContactHeader />

			<!-- 2. La Grande Carte Blanche (Container Principal) -->
			<div class=" mx-auto flex flex-col lg:flex-row min-h-[600px]">

				<!-- Colonne Gauche (Bleu Nuit) : Prend 35% de la largeur sur grand écran -->
				<div class="w-full lg:w-[35%] p-2 lg:p-3">
					<!-- On appelle le composant Infos -->
					<ContactInfos />
				</div>

				<!-- Colonne Droite (Formulaire) : Prend le reste (65%) -->
				<div class="w-full lg:w-[65%] p-4 lg:p-6">
					<ContactForm />
				</div>

			</div>

		</UContainer>
	</div>
</template>
