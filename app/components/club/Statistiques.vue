<template>
	<section class="py-16 bg-white relative border-t border-gray-100 overflow-hidden">

		<!-- Fond décoratif (Forme triangulaire très légère) -->
		<div class="absolute inset-0 pointer-events-none flex items-end justify-center opacity-10">
			<!-- On force la couleur text-gray-100 pour éviter le noir -->
			<svg viewBox="0 0 1000 300" class="w-full h-full text-gray-200 fill-current" preserveAspectRatio="none">
				<path d="M500 50 L1000 300 H0 Z" />
			</svg>
		</div>

		<UContainer class="relative z-10">
			<div class="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">

				<!-- Stat 1 -->
				<div class="flex flex-col items-center gap-2">
					<UIcon name="i-heroicons-user-group" class="w-8 h-8 text-[#7FD857]" />
					<span class="text-4xl font-extrabold text-[#0F1729]">350</span>
					<span class="text-xs font-bold text-gray-500 uppercase tracking-widest">Adhérents</span>
				</div>

				<!-- Stat 2 -->
				<div class="flex flex-col items-center gap-2">
					<!-- Icône Montagne SVG inline pour éviter les problèmes -->
					<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#7FD857" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
						<path d="M8 3l4 8 5-5 5 15H2L8 3z"></path>
					</svg>
					<span class="text-4xl font-extrabold text-[#0F1729]">12m</span>
					<span class="text-xs font-bold text-gray-500 uppercase tracking-widest">De Haut</span>
				</div>

				<!-- Stat 3 -->
				<div class="flex flex-col items-center gap-2">
					<UIcon name="i-heroicons-sparkles" class="w-8 h-8 text-[#7FD857]" />
					<span class="text-4xl font-extrabold text-[#0F1729]">25</span>
					<span class="text-xs font-bold text-gray-500 uppercase tracking-widest">Années</span>
				</div>

				<!-- Stat 4 -->
				<div class="flex flex-col items-center gap-2">
					<UIcon name="i-heroicons-hand-raised" class="w-8 h-8 text-[#7FD857]" />
					<span class="text-4xl font-extrabold text-[#0F1729]">15</span>
					<span class="text-xs font-bold text-gray-500 uppercase tracking-widest">Bénévoles</span>
				</div>

			</div>
		</UContainer>
	</section>
</template>
