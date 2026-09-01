<template>
  <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-start">
    <div>
      <p class="text-gray-500 text-sm font-medium">{{ label }}</p>
      <h3 class="text-3xl font-bold text-gray-900 mt-2">
        {{ value }}
        <span v-if="subValue" class="text-gray-400 text-lg font-normal">{{ subValue }}</span>
      </h3>
    </div>
    <div :class="[iconBg, 'p-2 rounded-lg', iconColor]">
      <UIcon :name="icon" class="w-6 h-6" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label: string
  value: number | string
  subValue?: string
  icon: string
  iconBg: string
  iconColor: string
}>()
</script>
