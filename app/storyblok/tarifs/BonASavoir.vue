<template>
  <div v-editable="blok" class="max-w-6xl mx-auto px-4 mt-20">
    <div class="bg-[#0F1729] rounded-xl p-6 md:p-8 text-center md:text-left relative overflow-hidden">
      
      <!-- Titre -->
      <div v-if="blok.title" class="w-full text-center border-b border-gray-800 pb-4 mb-6">
        <h3 class="text-white font-bold text-lg uppercase tracking-wide">
          {{ blok.title }}
        </h3>
      </div>

      <!-- Grille des infos -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8 text-center">
        <div v-for="(item, index) in items" :key="item._uid || index">
          <h4 v-if="item.title" class="text-[#7FD857] font-bold mb-2">
            {{ item.title }}
          </h4>
          <p v-if="item.content" class="text-gray-400 text-sm">
            {{ item.content }}
          </p>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  blok: {
    type: Object,
    required: true
  }
})

// Normalise les items du répéteur
const items = computed(() => {
  return props.blok.items || []
})
</script>
