<template>
	<header class="header" :class="{ 'header--scrolled': isScrolled }">
		<UContainer class="header__container">
			<!-- Logo -->
			<NuxtLink to="/" class="header__logo">
				<div class="header__logo-icon">
					<UIcon name="i-heroicons-mountain-solid" class="text-white text-2xl" />
				</div>
				<span class="header__logo-text">
          <span class="header__logo-vertical">VERTICAL</span>
          <span class="header__logo-pulse">PULSE</span>
        </span>
			</NuxtLink>

			<!-- Navigation Desktop -->
			<nav class="header__nav">
				<NuxtLink to="/" class="header__nav-link">
					Accueil
				</NuxtLink>

				<!-- Menu déroulant Le Club -->
				<UDropdownMenu :items="clubMenuItems" :popper="{ placement: 'bottom-start' }">
					<button class="header__nav-link header__nav-link--dropdown">
						Le Club
						<UIcon name="i-heroicons-chevron-down-20-solid" class="w-4 h-4 transition-transform" />
					</button>
				</UDropdownMenu>

				<NuxtLink to="/tarifs-et-cours" class="header__nav-link">
					Tarifs & Cours
				</NuxtLink>

				<NuxtLink to="/sorties" class="header__nav-link">
					Sorties
				</NuxtLink>

				<NuxtLink to="/contact" class="header__nav-link">
					Contact
				</NuxtLink>
			</nav>

			<!-- Actions -->
			<div class="header__actions">
				<UButton
						color="black"
						size="md"
						icon="i-heroicons-user"
						class="header__btn-login"
				>
					Connexion
				</UButton>

				<!-- Menu Mobile -->
				<UButton
						color="white"
						variant="ghost"
						icon="i-heroicons-bars-3"
						class="header__burger"
						@click="isMobileMenuOpen = true"
				/>
			</div>
		</UContainer>

		<!-- Mobile Slideover -->
		<USlideover v-model="isMobileMenuOpen" side="right">
			<UCard class="flex flex-col flex-1" :ui="{ body: { base: 'flex-1', padding: 'p-0' }, ring: '', divide: 'divide-y divide-gray-100' }">
				<template #header>
					<div class="flex items-center justify-between">
						<div class="header__logo-text">
							<span class="header__logo-vertical">VERTICAL</span>
							<span class="header__logo-pulse">PULSE</span>
						</div>
						<UButton
								color="gray"
								variant="ghost"
								icon="i-heroicons-x-mark-20-solid"
								@click="isMobileMenuOpen = false"
						/>
					</div>
				</template>

				<div class="flex flex-col gap-2 p-4">
					<UButton
							to="/"
							color="white"
							variant="ghost"
							size="lg"
							class="justify-start"
							@click="isMobileMenuOpen = false"
					>
						Accueil
					</UButton>

					<!-- Menu Le Club mobile avec sous-menu -->
					<UAccordion :items="mobileClubAccordion" :ui="{ item: { padding: 'py-2' } }">
						<template #default="{ item, open }">
							<UButton
									color="white"
									variant="ghost"
									size="lg"
									class="justify-start w-full"
							>
                <span class="flex items-center justify-between w-full">
                  {{ item.label }}
                  <UIcon
											name="i-heroicons-chevron-down-20-solid"
											class="w-5 h-5 transition-transform"
											:class="[open && 'transform rotate-180']"
									/>
                </span>
							</UButton>
						</template>

						<template #item="{ item }">
							<div class="flex flex-col gap-1 pl-4">
								<UButton
										v-for="subItem in item.children"
										:key="subItem.label"
										:to="subItem.to"
										color="gray"
										variant="ghost"
										size="md"
										class="justify-start"
										@click="isMobileMenuOpen = false"
								>
									<UIcon :name="subItem.icon" class="w-4 h-4" />
									{{ subItem.label }}
								</UButton>
							</div>
						</template>
					</UAccordion>

					<UButton
							to="/tarifs-et-cours"
							color="white"
							variant="ghost"
							size="lg"
							class="justify-start"
							@click="isMobileMenuOpen = false"
					>
						Tarifs & Cours
					</UButton>

					<UButton
							to="/sorties"
							color="white"
							variant="ghost"
							size="lg"
							class="justify-start"
							@click="isMobileMenuOpen = false"
					>
						Sorties
					</UButton>

					<UButton
							to="/contact"
							color="white"
							variant="ghost"
							size="lg"
							class="justify-start"
							@click="isMobileMenuOpen = false"
					>
						Contact
					</UButton>

					<UDivider class="my-2" />

					<UButton
							color="black"
							size="lg"
							icon="i-heroicons-user"
							class="justify-center"
					>
						Connexion
					</UButton>
				</div>
			</UCard>
		</USlideover>
	</header>
</template>

<script setup>
const isScrolled = ref(false)
const isMobileMenuOpen = ref(false)

// Menu déroulant "Le Club" - Desktop
const clubMenuItems = [
	[{
		label: 'Notre Histoire',
		icon: 'i-heroicons-book-open',
		to: '/le-club#histoire'
	}, {
		label: "L'Équipe",
		icon: 'i-heroicons-user-group',
		to: '/le-club#equipe'
	}, {
		label: 'Nos Valeurs',
		icon: 'i-heroicons-heart',
		to: '/le-club#valeurs'
	}],
	[{
		label: 'Affiliations',
		icon: 'i-heroicons-shield-check',
		to: '/le-club#affiliations',
		badge: 'FFME'
	}, {
		label: 'Partenaires',
		icon: 'i-heroicons-building-office',
		to: '/le-club#partenaires'
	}]
]

// Accordion mobile "Le Club"
const mobileClubAccordion = [{
	label: 'Le Club',
	defaultOpen: false,
	children: [
		{ label: 'Notre Histoire', icon: 'i-heroicons-book-open', to: '/le-club#histoire' },
		{ label: "L'Équipe", icon: 'i-heroicons-user-group', to: '/le-club#equipe' },
		{ label: 'Nos Valeurs', icon: 'i-heroicons-heart', to: '/le-club#valeurs' },
		{ label: 'Affiliations', icon: 'i-heroicons-shield-check', to: '/le-club#affiliations' },
		{ label: 'Partenaires', icon: 'i-heroicons-building-office', to: '/le-club#partenaires' }
	]
}]

const handleScroll = () => {
	isScrolled.value = window.scrollY > 20
}

onMounted(() => {
	window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
	window.removeEventListener('scroll', handleScroll)
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

	// Logo
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
		background: var(--vp-green);
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
		color: var(--vp-dark);
		letter-spacing: 0.5px;
	}

	&__logo-pulse {
		font-size: 1.05rem;
		font-weight: 300;
		color: var(--vp-green);
		letter-spacing: 0.5px;
	}

	// Navigation
	&__nav {
		display: flex;
		align-items: center;
		gap: 2rem;
		flex: 1;

		@media (max-width: 1024px) {
			display: none;
		}
	}

	&__nav-link {
		color: var(--vp-dark);
		text-decoration: none;
		font-size: 0.95rem;
		font-weight: 500;
		position: relative;
		transition: color 0.2s ease;
		background: none;
		border: none;
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 0.25rem;

		&:hover {
			color: var(--vp-green);
		}

		&.router-link-active {
			color: var(--vp-green);

			&::after {
				content: '';
				position: absolute;
				bottom: -8px;
				left: 0;
				right: 0;
				height: 2px;
				background: var(--vp-green);
				border-radius: 2px;
			}
		}

		&--dropdown {
			font-family: inherit;
			padding: 0;
		}
	}

	// Actions
	&__actions {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	&__btn-login {
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
</style>
