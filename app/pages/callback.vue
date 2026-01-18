<template>
	<div class="min-h-screen flex items-center justify-center bg-gray-50">
		<div class="text-center">
			<UIcon name="i-lucide-loader-2" class="w-12 h-12 text-[#7FD857] animate-spin mx-auto mb-4" />
			<p class="text-gray-600">Connexion en cours...</p>
		</div>
	</div>
</template>

<script setup lang="ts">
definePageMeta({
	layout: false
})

onMounted(async () => {
	// const { handleRedirectCallback } = useAuth()
	// await handleRedirectCallback()
	// await navigateTo('/admin/dashboard')
})
</script>
