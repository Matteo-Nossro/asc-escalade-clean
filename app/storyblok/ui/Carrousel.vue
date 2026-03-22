<template>
  <section v-editable="blok" :id="blok.anchor_id || 'equipe'" class="py-20 bg-white">
    <UContainer>
      <h2 class="text-3xl font-bold text-center text-[#0F1729] mb-12">
        {{ blok.title || 'Le Bureau & Les Coachs' }}
      </h2>

      <!-- Carrousel Storyblok -->
      <UCarousel
        v-slot="{ item }"
        :items="teamMembers"
        :ui="{
          item: 'basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4 px-4'
        }"
        class="w-full"
        arrows
      >
        <div class="flex flex-col items-center">
          <!-- Image avec ratio forcé -->
          <div class="w-full aspect-[3/4] rounded-xl overflow-hidden mb-4 bg-gray-100">
            <img
              v-if="item.image?.filename"
              :src="`${item.image.filename}/m/400x600/filters:quality(75):format(webp)`"
              :alt="item.name"
              class="w-full h-full object-cover"
              loading="lazy"
              draggable="false"
            />
          </div>

          <!-- Nom et rôle -->
          <h3 class="text-lg font-bold text-[#0F1729] mb-1">{{ item.name }}</h3>
          <span class="text-sm font-medium text-[#7FD857] uppercase">{{ item.role }}</span>

          <!-- Bio optionnelle -->
          <p v-if="item.bio" class="mt-2 text-xs text-gray-600 text-center max-w-[200px]">
            {{ item.bio }}
          </p>
        </div>
      </UCarousel>
    </UContainer>
  </section>
</template>

<script setup>
const props = defineProps({
  blok: {
    type: Object,
    required: true
  }
})

// Normalise les membres depuis le répéteur Storyblok
const teamMembers = computed(() => {
  if (!props.blok.team_members || !Array.isArray(props.blok.team_members)) return []

  return props.blok.team_members.map(member => ({
    id: member._uid,
    name: member.name ,
    role: member.role ,
    image: member.image,
    bio: member.bio
  }))
})
</script>
