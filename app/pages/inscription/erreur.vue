<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center px-4">
    <UContainer class="max-w-lg w-full">
      <div class="bg-white rounded-3xl shadow-lg p-8 md:p-12 text-center">

        <!-- Icône erreur -->
        <div class="flex items-center justify-center w-20 h-20 rounded-full bg-red-50 mx-auto mb-6">
          <UIcon name="i-heroicons-exclamation-triangle" class="w-10 h-10 text-red-500" />
        </div>

        <h1 class="text-2xl md:text-3xl font-bold text-[#0F1729] mb-3">
          Une erreur est survenue
        </h1>

        <p class="text-gray-600 mb-8">
          Le paiement n'a pas pu être traité. Votre inscription n'a pas été confirmée.
          Contactez-nous si le problème persiste.
        </p>

        <div class="flex flex-col sm:flex-row gap-3 justify-center">
          <NuxtLink
            to="/sorties"
            class="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#7FD857] hover:bg-[#6bc546] text-[#0F1729] font-bold transition-colors"
          >
            <UIcon name="i-heroicons-arrow-left" class="w-5 h-5" />
            Retour aux sorties
          </NuxtLink>

          <NuxtLink
            to="/contact"
            class="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border-2 border-gray-200 hover:border-[#7FD857] text-[#0F1729] font-bold transition-colors"
          >
            <UIcon name="i-heroicons-envelope" class="w-5 h-5" />
            Nous contacter
          </NuxtLink>
        </div>

      </div>
    </UContainer>
  </div>
</template>

<script setup lang="ts">
useSeoMeta({
  title: 'Erreur de paiement — ASC Escalade',
  robots: 'noindex',
})
</script>
