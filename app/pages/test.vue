<template>
	<div class="p-8">
		<h1 class="text-3xl font-bold mb-6">Test Nuxt UI</h1>

		<div class="space-y-4">
			<UButton color="primary" size="lg">
				Bouton Primary
			</UButton>

			<UButton color="black" icon="i-heroicons-user">
				Bouton avec icône
			</UButton>

			<UInput placeholder="Test input" />

			<UCard>
				<template #header>
					<h3 class="font-bold">Test Card</h3>
				</template>
				<p>Si vous voyez cette carte stylisée, Nuxt UI fonctionne !</p>
			</UCard>
		</div>
	</div>
</template>
<script setup lang="ts">
</script>