<template>
  <section v-editable="blok" class="py-20 bg-white gsap-reveal">
    <UContainer>
      <div class="max-w-4xl mx-auto">
        <div class="bg-slate-900 rounded-[2.5rem] p-10 md:p-14 text-center shadow-2xl relative overflow-hidden">
          <!-- Décoration -->
          <div class="absolute -top-20 -right-20 w-64 h-64 bg-primary-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 pointer-events-none"></div>
          
          <div class="relative z-10">
            <h2 class="text-3xl md:text-4xl font-bold text-white mb-4">{{ blok.title }}</h2>
            <p class="text-slate-300 mb-10 max-w-xl mx-auto text-lg">{{ blok.description }}</p>
            
            <div class="flex flex-col sm:flex-row items-center justify-center gap-6 mb-10">
              <div v-if="blok.maxParticipants" class="bg-slate-800 px-8 py-4 rounded-2xl text-left min-w-[160px]">
                <span class="block text-sm text-slate-400 mb-1">Places dispo.</span>
                <span class="text-2xl font-bold text-white">
                  <!-- currentParticipants simulé/calculé ici, max vient de Storyblok -->
                  {{ remainingPlaces }} <span class="text-lg text-slate-500 font-normal">/ {{ blok.maxParticipants }}</span>
                </span>
              </div>
            </div>

            <!-- Rendu dynamique du bouton UNIQUE -->
            <div class="flex justify-center">
              <StoryblokComponent
                v-if="blok.button && blok.button.length > 0"
                :blok="blok.button[0]"
              />
            </div>
          </div>
        </div>
      </div>
    </UContainer>
  </section>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'

const props = defineProps({ blok: Object })

// Simulation d'un appel DB pour récupérer le nombre de participants actuels
const dbCurrentParticipants = ref(0)

onMounted(async () => {
  // Ici tu feras ton appel API/Supabase/etc.
  // const { data } = await supabase.from('participants').select('count', { count: 'exact' }).eq('event_id', props.blok.eventId)
  // dbCurrentParticipants.value = data.count || 0
  
  // Fake valeur pour l'exemple
  dbCurrentParticipants.value = 5 
})

// Calcul dynamique basé sur Storyblok (max) et la DB (current)
const remainingPlaces = computed(() => {
  if (!props.blok.maxParticipants) return 0
  return Math.max(0, props.blok.maxParticipants - dbCurrentParticipants.value)
})
</script>
