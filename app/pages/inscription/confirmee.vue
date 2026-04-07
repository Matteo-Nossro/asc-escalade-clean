<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center px-4">
    <UContainer class="max-w-lg w-full">
      <div class="bg-white rounded-3xl shadow-lg p-8 md:p-12 text-center">

        <!-- Icône succès -->
        <div class="flex items-center justify-center w-20 h-20 rounded-full bg-[#7FD857]/15 mx-auto mb-6">
          <UIcon name="i-heroicons-check-circle" class="w-10 h-10 text-[#7FD857]" />
        </div>

        <h1 class="text-2xl md:text-3xl font-bold text-[#0F1729] mb-3">
          Inscription confirmée !
        </h1>

        <p class="text-gray-600 mb-2">
          Votre inscription a bien été enregistrée. Un email de confirmation vous a été envoyé.
        </p>

        <p v-if="!regId" class="text-sm text-gray-400 mb-8">
          La sortie est gratuite — aucun paiement requis.
        </p>
        <p v-else class="text-sm text-gray-400 mb-8">
          Référence : <span class="font-mono text-[#0F1729]">{{ regId }}</span>
        </p>

        <NuxtLink
          to="/sorties"
          class="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#7FD857] hover:bg-[#6bc546] text-[#0F1729] font-bold transition-colors"
        >
          <UIcon name="i-heroicons-arrow-left" class="w-5 h-5" />
          Retour aux sorties
        </NuxtLink>

      </div>
    </UContainer>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const regId = computed(() => route.query.reg as string | undefined)

useSeoMeta({
  title: 'Inscription confirmée — ASC Escalade',
  robots: 'noindex',
})
</script>
