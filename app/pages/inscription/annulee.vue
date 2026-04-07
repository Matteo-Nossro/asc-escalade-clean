<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center px-4">
    <UContainer class="max-w-lg w-full">
      <div class="bg-white rounded-3xl shadow-lg p-8 md:p-12 text-center">

        <!-- Icône annulation -->
        <div class="flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mx-auto mb-6">
          <UIcon name="i-heroicons-x-circle" class="w-10 h-10 text-gray-400" />
        </div>

        <h1 class="text-2xl md:text-3xl font-bold text-[#0F1729] mb-3">
          Inscription annulée
        </h1>

        <p class="text-gray-600 mb-8">
          Vous avez annulé le paiement. Votre inscription n'a pas été finalisée.
          Vous pouvez réessayer à tout moment.
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
useSeoMeta({
  title: 'Inscription annulée — ASC Escalade',
  robots: 'noindex',
})
</script>
