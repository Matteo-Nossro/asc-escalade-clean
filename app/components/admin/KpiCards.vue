<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
  }
}>()
</script>
