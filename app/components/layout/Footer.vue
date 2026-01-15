<template>
	<footer class="w-screen bg-[#0F1729] text-white pt-16 pb-8 border-t border-gray-800 -ml-[calc((100vw-100%)/2)]">
		<UContainer>
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">

				<!-- Colonne 1 : Logo & Description -->
				<div class="flex flex-col gap-6">
					<!-- Logo -->
					<NuxtLink to="/" class="flex items-center gap-3 w-fit">
						<div class="w-10 h-10 bg-[#7FD857] rounded-lg flex items-center justify-center">
							<UIcon name="i-heroicons-mountain-solid" class="text-white text-2xl" />
						</div>
						<div class="flex flex-col leading-none">
							<span class="font-bold text-lg tracking-wide text-white">VERTICAL</span>
							<span class="font-light text-lg tracking-wide text-[#7FD857]">PULSE</span>
						</div>
					</NuxtLink>

					<p class="text-gray-400 text-sm leading-relaxed">
						L'association sportive d'escalade qui fait vibrer vos sensations. Rejoignez une communauté passionnée de grimpeurs, débutants comme experts.
					</p>

					<!-- Réseaux Sociaux -->
					<div class="flex gap-3">
						<UButton
								to="https://facebook.com"
								target="_blank"
								color="neutral"
								variant="soft"
								icon="i-brands-facebook"
								class="bg-white/5 hover:bg-[#7FD857] hover:text-white transition-colors border-none"
								:ui="{ rounded: 'rounded-lg' }"
						/>
						<UButton
								to="https://instagram.com"
								target="_blank"
								color="neutral"
								variant="soft"
								icon="i-brands-instagram"
								class="bg-white/5 hover:bg-[#7FD857] hover:text-white transition-colors border-none"
								:ui="{ rounded: 'rounded-lg' }"
						/>
					</div>
				</div>

				<!-- Colonne 2 : Contact -->
				<div class="flex flex-col gap-6">
					<h3 class="text-[#7FD857] font-bold text-lg">Contact</h3>

					<ul class="flex flex-col gap-4">
						<li class="flex items-start gap-3 text-gray-400">
							<UIcon name="i-heroicons-map-pin" class="w-5 h-5 text-[#7FD857] mt-1 shrink-0" />
							<span class="text-sm">
                Gymnase Pierre de Coubertin<br>
                12 Avenue des Sports<br>
                74000 Annecy
              </span>
						</li>

						<li class="flex items-center gap-3 text-gray-400">
							<UIcon name="i-heroicons-phone" class="w-5 h-5 text-[#7FD857] shrink-0" />
							<a href="tel:0450123456" class="text-sm hover:text-white transition-colors">
								04 50 12 34 56
							</a>
						</li>

						<li class="flex items-center gap-3 text-gray-400">
							<UIcon name="i-heroicons-envelope" class="w-5 h-5 text-[#7FD857] shrink-0" />
							<a href="mailto:contact@verticalpulse.fr" class="text-sm hover:text-white transition-colors">
								contact@verticalpulse.fr
							</a>
						</li>
					</ul>
				</div>

				<!-- Colonne 3 : Navigation -->
				<div class="flex flex-col gap-6">
					<h3 class="text-[#7FD857] font-bold text-lg">Navigation</h3>

					<ul class="flex flex-col gap-3">
						<li v-for="link in navLinks" :key="link.label">
							<NuxtLink
									:to="link.to"
									class="text-gray-400 text-sm hover:text-[#7FD857] transition-colors"
							>
								{{ link.label }}
							</NuxtLink>
						</li>
					</ul>
				</div>

				<!-- Colonne 4 : Partenaires -->
				<div class="flex flex-col gap-6">
					<h3 class="text-[#7FD857] font-bold text-lg">Partenaires</h3>

					<div class="grid grid-cols-2 gap-4">
						<a href="#" class="text-gray-400 text-xs hover:text-white transition-colors uppercase font-semibold">
							FFME
						</a>
						<a href="#" class="text-gray-400 text-xs hover:text-white transition-colors uppercase font-semibold">
							FFH
						</a>
						<a href="#" class="text-gray-400 text-xs hover:text-white transition-colors uppercase font-semibold">
							Vieux Campeur
						</a>
						<a href="#" class="text-gray-400 text-xs hover:text-white transition-colors uppercase font-semibold">
							Ville d'Annecy
						</a>
					</div>
				</div>

			</div>

			<!-- Copyright -->
			<div class="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
				<p>© 2026 Vertical Pulse. Tous droits réservés.</p>
				<p>Designé avec passion pour la grimpe.</p>
			</div>
		</UContainer>
	</footer>
</template>

<script setup>
const navLinks = [
	{ label: 'Le Club', to: '/le-club' },
	{ label: 'Tarifs & Adhésion', to: '/tarifs-et-cours' },
	{ label: 'Sorties & Stages', to: '/sorties' },
	{ label: 'Espace Membre', to: '/connexion' },
	{ label: 'Mentions Légales', to: '/mentions-legales' }
]
</script>

<style scoped>
/* Les icônes brands (facebook, instagram) nécessitent parfois une config spécifique dans nuxt.config.ts si elles ne s'affichent pas.
   Sinon, on peut utiliser des icônes heroicons génériques comme fallback. */
</style>
