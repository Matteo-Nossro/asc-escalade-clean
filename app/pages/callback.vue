<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
    <div class="text-center">
      <div class="inline-flex items-center justify-center w-16 h-16 bg-[#7FD857] rounded-2xl mb-4 shadow-lg animate-pulse">
        <UIcon name="i-lucide-mountain" class="w-8 h-8 text-[#0F1729]" />
      </div>
      <p class="text-gray-600 mt-4">Connexion en cours…</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'

definePageMeta({ layout: false })

const { fetchProfile } = useAuth()

onMounted(async () => {
  await new Promise((resolve) => setTimeout(resolve, 500))
  const user = useSupabaseUser()
  if (user.value) {
    await fetchProfile()
    await navigateTo('/admin/dashboard')
  } else {
    await navigateTo('/login')
  }
})
</script>