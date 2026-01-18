<template>
	<div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">

		<!-- Carte de Login -->
		<div class="w-full max-w-md">

			<!-- Logo et Titre -->
			<div class="text-center mb-8">
				<div class="inline-flex items-center justify-center w-16 h-16 bg-[#7FD857] rounded-2xl mb-4 shadow-lg">
					<UIcon name="i-lucide-mountain" class="w-8 h-8 text-[#0F1729]" />
				</div>
				<h1 class="text-3xl font-bold text-gray-900 mb-2">Vertical Pulse</h1>
				<p class="text-gray-600">Connectez-vous à votre espace</p>
			</div>

			<!-- Formulaire -->
			<div class="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">

				<!-- Message d'erreur -->
				<UAlert
						v-if="error"
						color="error"
						variant="soft"
						:title="error"
						class="mb-6"
						icon="i-lucide-alert-circle"
						:close-button="{ icon: 'i-lucide-x', color: 'error', variant: 'ghost' }"
						@close="error = ''"
				/>

				<form @submit.prevent="handleLogin" class="space-y-6">

					<!-- Email -->
					<UFormField label="Adresse email" required>
						<UInput
								v-model="credentials.email"
								type="email"
								placeholder="votre.email@exemple.com"
								icon="i-lucide-mail"
								size="lg"
								required
								:disabled="loading"
								class="w-full"
								:ui="{
                wrapper: 'w-full',
                base: 'w-full'
              }"
						/>
					</UFormField>

					<!-- Mot de passe -->
					<UFormField label="Mot de passe" required>
						<UInput
								v-model="credentials.password"
								:type="showPassword ? 'text' : 'password'"
								placeholder="••••••••"
								icon="i-lucide-lock"
								size="lg"
								required
								:disabled="loading"
								class="w-full"
								:ui="{
                wrapper: 'w-full',
                base: 'w-full',
                trailing: { padding: { md: 'pr-3' } }
              }"
						>
							<template #trailing>
								<UButton
										:icon="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
										color="neutral"
										variant="ghost"
										size="sm"
										@click="showPassword = !showPassword"
										type="button"
										aria-label="Afficher le mot de passe"
								/>
							</template>
						</UInput>
					</UFormField>

					<!-- Se souvenir de moi & Mot de passe oublié -->
					<div class="flex items-center justify-between">
						<UCheckbox
								v-model="rememberMe"
								label="Se souvenir de moi"
								:disabled="loading"
						/>
						<NuxtLink
								to="/forgot-password"
								class="text-sm text-[#7FD857] hover:text-[#6bc546] font-medium transition-colors"
						>
							Mot de passe oublié ?
						</NuxtLink>
					</div>

					<!-- Bouton de connexion -->
					<UButton
							type="submit"
							size="xl"
							block
							:loading="loading"
							:disabled="loading"
							class="bg-[#7FD857] hover:bg-[#6bc546] text-[#0F1729] font-bold shadow-lg hover:shadow-xl transition-all"
					>
						<template #leading>
							<UIcon name="i-lucide-log-in" class="w-5 h-5" />
						</template>
						{{ loading ? 'Connexion en cours...' : 'Se connecter' }}
					</UButton>

				</form>

				<!-- Divider -->
				<div class="relative my-8">
					<div class="absolute inset-0 flex items-center">
						<div class="w-full border-t border-gray-200"></div>
					</div>
					<div class="relative flex justify-center text-sm">
						<span class="px-4 bg-white text-gray-500">Ou continuer avec</span>
					</div>
				</div>

				<!-- Social Login (optionnel) -->
				<div class="grid grid-cols-2 gap-3">
					<UButton
							color="white"
							variant="solid"
							size="lg"
							@click="loginWithGoogle"
							:disabled="loading"
							class="border-2 border-gray-200 hover:border-gray-300"
					>
						<template #leading>
							<UIcon name="i-lucide-chrome" class="w-5 h-5 text-red-500" />
						</template>
						Google
					</UButton>

					<UButton
							color="white"
							variant="solid"
							size="lg"
							@click="loginWithMicrosoft"
							:disabled="loading"
							class="border-2 border-gray-200 hover:border-gray-300"
					>
						<template #leading>
							<UIcon name="i-lucide-microsoft" class="w-5 h-5 text-blue-600" />
						</template>
						Microsoft
					</UButton>
				</div>

				<!-- Lien inscription -->
				<div class="mt-6 text-center">
					<p class="text-sm text-gray-600">
						Pas encore de compte ?
						<NuxtLink
								to="/register"
								class="text-[#7FD857] hover:text-[#6bc546] font-bold transition-colors ml-1"
						>
							Créer un compte
						</NuxtLink>
					</p>
				</div>

			</div>

			<!-- Footer -->
			<div class="mt-6 text-center text-sm text-gray-500">
				<p>© 2026 Vertical Pulse - Club d'Escalade de Dole</p>
			</div>

		</div>

	</div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// Meta pour la page
definePageMeta({
	layout: false,  // Pas de layout pour la page de login
	// middleware: 'guest'  // Redirige si déjà connecté
})

// Réactivité
const credentials = ref({
	email: '',
	password: ''
})

const showPassword = ref(false)
const rememberMe = ref(false)
const loading = ref(false)
const error = ref('')

// Fonction de connexion principale
const handleLogin = async () => {
	try {
		loading.value = true
		error.value = ''

		// Validation basique
		if (!credentials.value.email || !credentials.value.password) {
			error.value = 'Veuillez remplir tous les champs'
			return
		}

		// TODO: Intégrer Auth0 ici
		// const { login } = useAuth0()
		// await login(credentials.value.email, credentials.value.password)

		// Pour le moment, simulation
		await new Promise(resolve => setTimeout(resolve, 1500))

		// Redirection après connexion réussie
		await navigateTo('/admin/dashboard')

	} catch (err: any) {
		error.value = err.message || 'Une erreur est survenue lors de la connexion'
	} finally {
		loading.value = false
	}
}

// Connexion avec Google
const loginWithGoogle = async () => {
	try {
		loading.value = true
		error.value = ''

		// TODO: Intégrer Auth0 Social Login
		// const { loginWithRedirect } = useAuth0()
		// await loginWithRedirect({ connection: 'google-oauth2' })

		console.log('Login with Google')
	} catch (err: any) {
		error.value = err.message || 'Erreur lors de la connexion avec Google'
	} finally {
		loading.value = false
	}
}

// Connexion avec Microsoft
const loginWithMicrosoft = async () => {
	try {
		loading.value = true
		error.value = ''

		// TODO: Intégrer Auth0 Social Login
		// const { loginWithRedirect } = useAuth0()
		// await loginWithRedirect({ connection: 'windowslive' })

		console.log('Login with Microsoft')
	} catch (err: any) {
		error.value = err.message || 'Erreur lors de la connexion avec Microsoft'
	} finally {
		loading.value = false
	}
}
</script>
