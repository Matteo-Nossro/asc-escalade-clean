<template>
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto px-4 items-center">

		<!-- CARTE 1 : LICENCE SÈCHE -->
		<div class="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 flex flex-col h-full hover:-translate-y-1 transition-transform duration-300">
			<h3 class="text-xl font-bold text-[#0F1729] mb-2">Licence Sèche</h3>
			<div class="flex items-baseline mb-6">
				<span class="text-4xl font-black text-[#7FD857]">130€</span>
				<span class="text-gray-400 ml-2 text-sm">/ an</span>
			</div>

			<ul class="space-y-4 mb-8 flex-grow">
				<li class="flex items-start gap-3 text-sm text-gray-600">
					<UIcon name="i-heroicons-check" class="w-5 h-5 text-[#7FD857] flex-shrink-0" />
					Licence FFME
				</li>
				<li class="flex items-start gap-3 text-sm text-gray-600">
					<UIcon name="i-heroicons-check" class="w-5 h-5 text-[#7FD857] flex-shrink-0" />
					Assurance Base
				</li>
				<li class="flex items-start gap-3 text-sm text-gray-400 line-through decoration-gray-300">
					Sorties Club
				</li>
				<li class="flex items-start gap-3 text-sm text-gray-400 line-through decoration-gray-300">
					Cours Hebdomadaires
				</li>
			</ul>

			<UButton to="#" block color="black" variant="solid" size="lg" class="font-bold">Choisir</UButton>
		</div>

		<!-- CARTE 2 : ADULTE AUTONOME (Populaire) -->
		<!-- Plus grande, bordure verte, tag Populaire -->
		<div class="relative bg-white rounded-2xl p-8 shadow-2xl border-2 border-[#7FD857] flex flex-col h-full transform scale-105 z-10">

			<div class="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#7FD857] text-[#0F1729] px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">
				Populaire
			</div>

			<h3 class="text-xl font-bold text-[#0F1729] mb-2">Adulte Autonome</h3>
			<div class="flex items-baseline mb-6">
				<span class="text-5xl font-black text-[#0F1729]">280€</span>
				<span class="text-gray-400 ml-2 text-sm">/ an</span>
			</div>

			<ul class="space-y-4 mb-8 flex-grow">
				<li class="flex items-start gap-3 text-sm text-gray-700 font-medium">
					<UIcon name="i-heroicons-check" class="w-5 h-5 text-[#7FD857] flex-shrink-0" />
					Licence FFME + Assur.
				</li>
				<li class="flex items-start gap-3 text-sm text-gray-700 font-medium">
					<UIcon name="i-heroicons-check" class="w-5 h-5 text-[#7FD857] flex-shrink-0" />
					Accès Créneaux Libres
				</li>
				<li class="flex items-start gap-3 text-sm text-gray-700 font-medium">
					<UIcon name="i-heroicons-check" class="w-5 h-5 text-[#7FD857] flex-shrink-0" />
					Prêt de matériel
				</li>
				<li class="flex items-start gap-3 text-sm text-gray-700 font-medium">
					<UIcon name="i-heroicons-check" class="w-5 h-5 text-[#7FD857] flex-shrink-0" />
					Sorties & Stages
				</li>
			</ul>

			<UButton to="#" block color="primary" variant="solid" size="lg" class="bg-[#7FD857] text-[#0F1729] hover:bg-[#6bc546] font-bold">
				S'inscrire
			</UButton>
		</div>

		<!-- CARTE 3 : ÉCOLE ESCALADE -->
		<div class="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 flex flex-col h-full hover:-translate-y-1 transition-transform duration-300">
			<h3 class="text-xl font-bold text-[#0F1729] mb-2">École Escalade</h3>
			<div class="flex items-baseline mb-6">
				<span class="text-lg font-bold text-gray-500 mr-1">Dès</span>
				<span class="text-4xl font-black text-[#7FD857]">180€</span>
				<span class="text-gray-400 ml-2 text-sm">/ an</span>
			</div>

			<ul class="space-y-4 mb-8 flex-grow">
				<li class="flex items-start gap-3 text-sm text-gray-600">
					<UIcon name="i-heroicons-check" class="w-5 h-5 text-[#7FD857] flex-shrink-0" />
					Encadrement BE
				</li>
				<li class="flex items-start gap-3 text-sm text-gray-600">
					<UIcon name="i-heroicons-check" class="w-5 h-5 text-[#7FD857] flex-shrink-0" />
					30 Séances / an
				</li>
				<li class="flex items-start gap-3 text-sm text-gray-600">
					<UIcon name="i-heroicons-check" class="w-5 h-5 text-[#7FD857] flex-shrink-0" />
					Matériel inclus
				</li>
				<li class="flex items-start gap-3 text-sm text-gray-600">
					<UIcon name="i-heroicons-check" class="w-5 h-5 text-[#7FD857] flex-shrink-0" />
					Passeports FFME
				</li>
			</ul>

			<UButton to="#" block color="black" variant="solid" size="lg" class="font-bold">Voir les cours</UButton>
		</div>

	</div>
</template>
