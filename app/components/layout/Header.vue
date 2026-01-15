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

				<!-- Menu déroulant Le Club -->
				<!-- NOTE: items doit être un tableau de groupes d'items -->
				<UDropdownMenu
						:items="clubMenuItems"
						:ui="{ content: 'w-48' }"
						:popper="{ placement: 'bottom-start' }"
				>
					<UButton
							color="white"
							variant="ghost"
							label="Le Club"
							trailing-icon="i-heroicons-chevron-down-20-solid"
							class="header__nav-dropdown"
					/>
				</UDropdownMenu>

				<NuxtLink to="/tarifs-et-cours" class="header__nav-link" active-class="header__nav-link--active">
					Tarifs & Cours
				</NuxtLink>

				<NuxtLink to="/sorties" class="header__nav-link" active-class="header__nav-link--active">
					Sorties
				</NuxtLink>

				<NuxtLink to="/contact" class="header__nav-link" active-class="header__nav-link--active">
					Contact
				</NuxtLink>
			</nav>

			<!-- Actions -->
			<div class="header__actions">
				<UButton
						color="neutral"
						variant="solid"
						size="md"
						label="Connexion"
						icon="i-heroicons-user"
						class="header__btn-login"
				/>

				<!-- Burger Menu Mobile -->
				<UButton
						color="neutral"
						variant="ghost"
						icon="i-heroicons-bars-3"
						class="header__burger"
						@click="isMobileMenuOpen = true"
				/>
			</div>
		</UContainer>

		<!-- Slideover Mobile -->
		<USlideover v-model:open="isMobileMenuOpen" side="right">
			<template #content>
				<UCard
						class="flex flex-col flex-1"
						:ui="{ body: { base: 'flex-1 p-0' }, header: { base: 'p-4' } }"
				>
					<template #header>
						<div class="flex items-center justify-between">
							<div class="header__logo-text">
								<span class="header__logo-vertical">VERTICAL</span>
								<span class="header__logo-pulse">PULSE</span>
							</div>
							<UButton
									color="neutral"
									variant="ghost"
									icon="i-heroicons-x-mark-20-solid"
									@click="isMobileMenuOpen = false"
							/>
						</div>
					</template>

					<nav class="flex flex-col p-4 gap-2">
						<UButton
								to="/"
								color="neutral"
								variant="ghost"
								size="xl"
								label="Accueil"
								class="justify-start"
								@click="isMobileMenuOpen = false"
						/>

						<!-- Collapsible Le Club Mobile -->
						<UCollapsible class="flex flex-col gap-1">
							<UButton
									color="neutral"
									variant="ghost"
									size="xl"
									class="justify-between group"
									label="Le Club"
									trailing-icon="i-heroicons-chevron-down-20-solid"
									:ui="{ trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200' }"
							/>

							<template #content>
								<div class="flex flex-col pl-4 gap-1 border-l-2 border-gray-100 ml-4">
									<UButton
											to="/le-club#histoire"
											color="neutral"
											variant="ghost"
											label="Notre Histoire"
											icon="i-heroicons-book-open"
											class="justify-start"
											@click="isMobileMenuOpen = false"
									/>
									<UButton
											to="/le-club#equipe"
											color="neutral"
											variant="ghost"
											label="L'Équipe"
											icon="i-heroicons-user-group"
											class="justify-start"
											@click="isMobileMenuOpen = false"
									/>
									<UButton
											to="/le-club#valeurs"
											color="neutral"
											variant="ghost"
											label="Nos Valeurs"
											icon="i-heroicons-heart"
											class="justify-start"
											@click="isMobileMenuOpen = false"
									/>
									<UButton
											to="/le-club#affiliations"
											color="neutral"
											variant="ghost"
											label="Affiliations"
											icon="i-heroicons-shield-check"
											class="justify-start"
											@click="isMobileMenuOpen = false"
									/>
								</div>
							</template>
						</UCollapsible>

						<UButton
								to="/tarifs-et-cours"
								color="neutral"
								variant="ghost"
								size="xl"
								label="Tarifs & Cours"
								class="justify-start"
								@click="isMobileMenuOpen = false"
						/>

						<UButton
								to="/sorties"
								color="neutral"
								variant="ghost"
								size="xl"
								label="Sorties"
								class="justify-start"
								@click="isMobileMenuOpen = false"
						/>

						<UButton
								to="/contact"
								color="neutral"
								variant="ghost"
								size="xl"
								label="Contact"
								class="justify-start"
								@click="isMobileMenuOpen = false"
						/>

						<UDivider class="my-4" />

						<UButton
								color="neutral"
								variant="solid"
								size="xl"
								label="Connexion"
								icon="i-heroicons-user"
								block
						/>
					</nav>
				</UCard>
			</template>
		</USlideover>
	</header>
</template>

<script setup>
const isScrolled = ref(false)
const isMobileMenuOpen = ref(false)

// Format correct pour UDropdownMenu v4 : Tableau de groupes (Array<Array<Item>>)
const clubMenuItems = [
	[
		{
			label: 'Découvrir',
			type: 'label' // Titre de section
		},
		{
			label: 'Notre Histoire',
			icon: 'i-heroicons-book-open',
			to: '/le-club#histoire'
		},
		{
			label: "L'Équipe",
			icon: 'i-heroicons-user-group',
			to: '/le-club#equipe'
		},
		{
			label: 'Nos Valeurs',
			icon: 'i-heroicons-heart',
			to: '/le-club#valeurs'
		}
	],
	[
		{
			label: 'Infos',
			type: 'label'
		},
		{
			label: 'Affiliations',
			icon: 'i-heroicons-shield-check',
			to: '/le-club#affiliations'
		},
		{
			label: 'Partenaires',
			icon: 'i-heroicons-building-office',
			to: '/le-club#partenaires'
		}
	]
]

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

	&__nav-dropdown {
		font-weight: 500;
		color: #0F1729;

		&:hover {
			color: #7FD857;
			background: transparent;
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
</style>
