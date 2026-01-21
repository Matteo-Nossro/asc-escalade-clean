<template>
	<header class="header" :class="{ 'header--scrolled': isScrolled }">
		<UContainer class="header__container">
			<!-- Logo -->
			<NuxtLink to="/" class="header__logo">
				<div class="header__logo-icon">
					<UIcon name="i-heroicons-mountain-solid" class="text-white text-2xl" />
				</div>
				<div class="header__logo-text">
					<span class="header__logo-vertical">VERTICAL</span>
					<span class="header__logo-pulse">PULSE</span>
				</div>
			</NuxtLink>

			<!-- Navigation Desktop -->
			<nav class="header__nav">
				<NuxtLink to="/" class="header__nav-link" active-class="header__nav-link--active">
					Accueil
				</NuxtLink>

				<NuxtLink to="/club" class="header__nav-link" active-class="header__nav-link--active">
					Le Club
				</NuxtLink>

				<NuxtLink to="/tarifs" class="header__nav-link" active-class="header__nav-link--active">
					Tarifs & Cours
				</NuxtLink>

				<NuxtLink to="/sorties" class="header__nav-link" active-class="header__nav-link--active">
					Sorties
				</NuxtLink>

				<NuxtLink to="/actualites" class="header__nav-link" active-class="header__nav-link--active">
					Actualités
				</NuxtLink>

				<NuxtLink to="/contact" class="header__nav-link" active-class="header__nav-link--active">
					Contact
				</NuxtLink>
			</nav>

			<!-- Actions -->
			<div class="header__actions">
				<UButton
						to="/login"
						color="neutral"
						variant="solid"
						size="md"
						label="Connexion"
						icon="i-heroicons-user"
						class="header__btn-login"
				/>

				<UButton
						color="neutral"
						variant="ghost"
						icon="i-heroicons-bars-3"
						class="header__burger"
						@click="openMobileMenu"
				/>
			</div>
		</UContainer>

		<!-- Slideover Mobile avec ClientOnly -->
		<ClientOnly>
			<Teleport to="body">
				<Transition
						enter-active-class="transition-opacity duration-200"
						enter-from-class="opacity-0"
						enter-to-class="opacity-100"
						leave-active-class="transition-opacity duration-200"
						leave-from-class="opacity-100"
						leave-to-class="opacity-0"
				>
					<div
							v-if="isMobileMenuOpen"
							class="fixed inset-0 bg-black/50 z-[9998]"
							@click="closeMobileMenu"
					></div>
				</Transition>

				<Transition
						enter-active-class="transition-transform duration-300"
						enter-from-class="translate-x-full"
						enter-to-class="translate-x-0"
						leave-active-class="transition-transform duration-300"
						leave-from-class="translate-x-0"
						leave-to-class="translate-x-full"
				>
					<div
							v-if="isMobileMenuOpen"
							class="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-white shadow-2xl z-[9999] flex flex-col"
					>
						<!-- Header du menu mobile -->
						<div class="flex items-center justify-between p-6 border-b border-gray-200">
							<div class="header__logo-text">
								<span class="header__logo-vertical">VERTICAL</span>
								<span class="header__logo-pulse">PULSE</span>
							</div>
							<UButton
									color="neutral"
									variant="ghost"
									icon="i-heroicons-x-mark-20-solid"
									@click="closeMobileMenu"
							/>
						</div>

						<!-- Navigation mobile -->
						<nav class="flex-1 overflow-y-auto p-4">
							<div class="flex flex-col gap-2">
								<NuxtLink
										v-for="item in mobileMenuItems"
										:key="item.to"
										:to="item.to"
										class="mobile-nav-link"
										active-class="mobile-nav-link--active"
										@click="handleMenuClick"
								>
									<UIcon :name="item.icon" class="w-5 h-5 flex-shrink-0" />
									<span class="font-medium flex-1">{{ item.label }}</span>
									<UIcon name="i-heroicons-chevron-right" class="w-5 h-5 flex-shrink-0 opacity-50" />
								</NuxtLink>
							</div>
						</nav>

						<!-- Footer du menu mobile avec bouton connexion -->
						<div class="p-4 border-t border-gray-200">
							<UButton
									to="/login"
									color="neutral"
									variant="solid"
									size="xl"
									label="Connexion"
									icon="i-heroicons-user"
									block
									class="bg-[#0F1729] text-white hover:bg-[#1a2740]"
									@click="handleMenuClick"
							/>
						</div>
					</div>
				</Transition>
			</Teleport>
		</ClientOnly>
	</header>
</template>

<script setup lang="ts">
const isScrolled = ref(false)
const isMobileMenuOpen = ref(false)

const { isDesktop } = useBreakpoints()

// Menu Mobile - Items simples
const mobileMenuItems = [
	{
		label: 'Accueil',
		icon: 'i-heroicons-home',
		to: '/'
	},
	{
		label: 'Le Club',
		icon: 'i-heroicons-building-library',
		to: '/club'
	},
	{
		label: 'Tarifs & Cours',
		icon: 'i-heroicons-currency-euro',
		to: '/tarifs'
	},
	{
		label: 'Sorties',
		icon: 'i-heroicons-map',
		to: '/sorties'
	},
	{
		label: 'Actualités',
		icon: 'i-heroicons-newspaper',
		to: '/actualites'
	},
	{
		label: 'Contact',
		icon: 'i-heroicons-envelope',
		to: '/contact'
	}
]

// Ouvrir le menu
const openMobileMenu = () => {
	isMobileMenuOpen.value = true
	// Bloquer le scroll du body
	if (process.client) {
		document.body.style.overflow = 'hidden'
	}
}

// Fermer le menu
const closeMobileMenu = () => {
	isMobileMenuOpen.value = false
	// Débloquer le scroll du body
	if (process.client) {
		document.body.style.overflow = ''
	}
}

// Fermer le menu lors d'un clic sur un lien
const handleMenuClick = () => {
	setTimeout(() => {
		closeMobileMenu()
	}, 150)
}

// Fermer automatiquement le menu mobile quand on passe en desktop
watch(isDesktop, (newVal) => {
	if (newVal && isMobileMenuOpen.value) {
		closeMobileMenu()
	}
})

// Gestion du scroll
const handleScroll = () => {
	isScrolled.value = window.scrollY > 20
}

onMounted(() => {
	window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
	window.removeEventListener('resize', handleScroll)
	// Nettoyer le style du body au cas où
	if (process.client) {
		document.body.style.overflow = ''
	}
})
</script>

<style lang="scss" scoped>
.header {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	z-index: 1000;
	background: white;
	transition: all 0.3s ease;

	&--scrolled {
		box-shadow: 0 2px 20px rgba(0, 0, 0, 0.08);
	}

	&__container {
		padding-top: 1rem;
		padding-bottom: 1rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 3rem;
	}

	// Logo styles
	&__logo {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		text-decoration: none;
		transition: transform 0.2s ease;

		&:hover {
			transform: translateY(-2px);
		}
	}

	&__logo-icon {
		width: 45px;
		height: 45px;
		background: #7FD857;
		border-radius: 10px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	&__logo-text {
		display: flex;
		flex-direction: column;
		line-height: 1.1;
	}

	&__logo-vertical {
		font-size: 1.05rem;
		font-weight: 700;
		color: #0F1729;
		letter-spacing: 0.5px;
	}

	&__logo-pulse {
		font-size: 1.05rem;
		font-weight: 300;
		color: #7FD857;
		letter-spacing: 0.5px;
	}

	// Navigation Desktop
	&__nav {
		display: flex;
		align-items: center;
		gap: 2rem;

		@media (max-width: 1024px) {
			display: none;
		}
	}

	&__nav-link {
		color: #0F1729;
		text-decoration: none;
		font-size: 0.95rem;
		font-weight: 500;
		position: relative;
		transition: color 0.2s ease;
		padding: 0.5rem 0;

		&:hover {
			color: #7FD857;
		}

		&--active {
			color: #7FD857;

			&::after {
				content: '';
				position: absolute;
				bottom: 0;
				left: 0;
				right: 0;
				height: 2px;
				background: #7FD857;
				border-radius: 2px;
			}
		}
	}

	// Actions
	&__actions {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	&__btn-login {
		background-color: #0F1729;
		color: white;

		&:hover {
			background-color: #1a2740;
		}

		@media (max-width: 768px) {
			display: none;
		}
	}

	&__burger {
		display: none;

		@media (max-width: 1024px) {
			display: flex;
		}
	}
}

// Styles pour les liens du menu mobile
.mobile-nav-link {
	display: flex;
	align-items: center;
	gap: 1rem;
	padding: 1rem;
	border-radius: 0.75rem;
	text-decoration: none;
	transition: all 0.2s ease;
	background: white;
	color: #0F1729;

	&:hover {
		background: #F5F7FA;
	}

	&:active {
		background: #E5E7EB;
		transform: scale(0.98);
	}

	// Style pour le lien actif
	&--active {
		background: #F0FDF4;

		span {
			color: #7FD857;
			font-weight: 600;
		}

		svg {
			color: #7FD857;
		}
	}
}
</style>
