<template>
  <SectionShell
    v-editable="blok"
    :fond="blok.fond"
    :anchor-id="blok.anchor_id"
    :surtitre="blok.surtitre"
    :titre="blok.titre"
    :intro="blok.intro"
    largeur="large"
  >
    <!-- Carrousel : défilement horizontal -->
    <div v-if="carrousel" class="relative">
      <div
        ref="piste"
        class="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-4 -mx-1 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div
          v-for="(carte, i) in cartes"
          :key="carte._uid || i"
          data-reveal
          class="snap-start shrink-0 w-[80%] sm:w-[45%] lg:w-[31%]"
        >
          <Carte :carte="carte" />
        </div>
      </div>

      <button
        v-for="dir in ['prev', 'next']"
        :key="dir"
        type="button"
        class="hidden md:flex absolute top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white shadow-lg border border-gray-100 items-center justify-center hover:bg-vp-green hover:text-vp-dark transition-colors z-10"
        :class="dir === 'prev' ? '-left-4' : '-right-4'"
        :aria-label="dir === 'prev' ? 'Précédent' : 'Suivant'"
        @click="defiler(dir)"
      >
        <UIcon :name="dir === 'prev' ? 'i-heroicons-chevron-left' : 'i-heroicons-chevron-right'" class="w-5 h-5" />
      </button>
    </div>

    <!-- Grille -->
    <template v-else>
      <div class="grid gap-6 items-stretch" :class="colonnes">
        <div v-for="(carte, i) in visibles" :key="carte._uid || i" data-reveal>
          <Carte :carte="carte" />
        </div>
      </div>

      <div v-if="reste > 0" class="mt-8 text-center">
        <UButton
          size="lg"
          class="bg-vp-dark hover:bg-vp-dark-hover text-white font-bold"
          trailing-icon="i-heroicons-chevron-down"
          @click="tout = true"
        >
          Voir les {{ reste }} autres
        </UButton>
      </div>
    </template>
  </SectionShell>
</template>

<script setup>
import { ref, computed } from 'vue'
import SectionShell from './_SectionShell.vue'
import Carte from './_Carte.vue'

const props = defineProps({ blok: { type: Object, required: true } })

const cartes = computed(() => props.blok.cartes || [])
const carrousel = computed(() => props.blok.affichage === 'carrousel')

// Grille : limite + « Voir plus »
const tout = ref(false)
const limite = computed(() => Number(props.blok.nb_visibles) || 0)
const visibles = computed(() =>
  limite.value > 0 && !tout.value ? cartes.value.slice(0, limite.value) : cartes.value,
)
const reste = computed(() => cartes.value.length - visibles.value.length)

const colonnes = computed(
  () =>
    ({
      2: 'sm:grid-cols-2',
      3: 'sm:grid-cols-2 lg:grid-cols-3',
      4: 'sm:grid-cols-2 lg:grid-cols-4',
    })[Number(props.blok.colonnes) || 3] || 'sm:grid-cols-2 lg:grid-cols-3',
)

// Carrousel : flèches
const piste = ref(null)
const defiler = (dir) => {
  if (!piste.value) return
  const pas = piste.value.clientWidth * 0.8
  piste.value.scrollBy({ left: dir === 'next' ? pas : -pas, behavior: 'smooth' })
}
</script>
