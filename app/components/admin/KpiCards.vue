<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
    <AdminKpiCard
      label="Total membres"
      :value="stats.totalMembres"
      icon="i-heroicons-users"
      icon-bg="bg-green-50"
      icon-color="text-green-600"
    />
    <AdminKpiCard
      label="Licences actives"
      :value="stats.licencesActives"
      icon="i-heroicons-check-badge"
      icon-bg="bg-blue-50"
      icon-color="text-blue-600"
    />
    <AdminKpiCard
      label="Places disponibles"
      :value="stats.placesDispo"
      :sub-value="`/ ${stats.totalPlaces}`"
      icon="i-heroicons-ticket"
      icon-bg="bg-purple-50"
      icon-color="text-purple-600"
    />
    <AdminKpiCard
      label="Inscriptions en attente"
      :value="stats.inscriptionsAttente"
      icon="i-heroicons-clock"
      icon-bg="bg-yellow-50"
      icon-color="text-yellow-600"
    />
    <AdminKpiCard
      label="Adhérents payés"
      :value="stats.paymentDone"
      icon="i-heroicons-banknotes"
      icon-bg="bg-emerald-50"
      icon-color="text-emerald-600"
    />
    <AdminKpiCard
      label="Non payés"
      :value="stats.paymentPending"
      icon="i-heroicons-exclamation-circle"
      icon-bg="bg-red-50"
      icon-color="text-red-500"
    />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  stats: {
    totalMembres: number
    licencesActives: number
    placesDispo: number
    totalPlaces: number
    inscriptionsAttente: number
    paymentDone: number
    paymentPending: number
  }
}>()
</script>
