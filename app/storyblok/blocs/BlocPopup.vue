<template>
  <!-- Déclencheur affiché dans le flux de la page -->
  <span v-editable="blok" class="inline-block" :class="blok.pleine_largeur ? 'w-full' : ''">
    <UButton
      v-if="blok.declencheur_style === 'bouton'"
      type="button"
      size="lg"
      :icon="blok.declencheur_icon || undefined"
      class="font-bold bg-[#7FD857] hover:bg-[#6bc546] text-[#0F1729]"
      :class="blok.pleine_largeur ? 'w-full justify-center' : ''"
      @click="ouvrir"
    >
      {{ blok.declencheur_label || 'En savoir plus' }}
    </UButton>
    <button
      v-else
      type="button"
      class="inline-flex items-center gap-1.5 font-semibold text-[#0F1729] underline decoration-[#7FD857] decoration-2 underline-offset-2 hover:text-[#7FD857] transition-colors"
      @click="ouvrir"
    >
      <UIcon v-if="blok.declencheur_icon" :name="blok.declencheur_icon" class="w-4 h-4" />
      {{ blok.declencheur_label || 'En savoir plus' }}
    </button>
  </span>

  <!-- Fenêtre -->
  <Teleport to="body">
    <Transition name="popup">
      <div
        v-if="ouvert"
        class="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-6"
        @click.self="fermer"
      >
        <div class="absolute inset-0 bg-[#0F1729]/70 backdrop-blur-sm" @click="fermer" />

        <div
          ref="panneau"
          role="dialog"
          aria-modal="true"
          :aria-label="blok.titre || blok.declencheur_label || 'Informations'"
          class="relative w-full bg-white shadow-2xl rounded-t-3xl sm:rounded-3xl max-h-[92vh] sm:max-h-[88vh] flex flex-col"
          :class="tailleClass"
          @keydown.esc="fermer"
          @keydown.tab="piegerFocus"
        >
          <div class="flex items-start justify-between gap-4 p-5 sm:p-6 border-b border-gray-100 flex-shrink-0">
            <h2 v-if="blok.titre" class="text-lg sm:text-xl font-bold text-[#0F1729]">{{ blok.titre }}</h2>
            <span v-else />
            <button
              ref="btnFermer"
              type="button"
              class="flex-shrink-0 w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-[#0F1729]"
              aria-label="Fermer"
              @click="fermer"
            >
              <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
            </button>
          </div>

          <!-- `[&_section]:` ne touche que les composants hors kit (ex: inscriptions-niveaux)
               qui gardent leur balise <section> ; les bloc-* rendent un <div> en mode modal. -->
          <div
            class="overflow-y-auto p-5 sm:p-6 space-y-6 [&_section]:!py-0 [&_section]:!bg-transparent [&_section]:!scroll-mt-0"
          >
            <StoryblokComponent
              v-for="inner in contenu"
              :key="inner._uid"
              :blok="inner"
            />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, nextTick, onBeforeUnmount, provide } from 'vue'

const props = defineProps({ blok: { type: Object, required: true } })

provide('blocDansModal', true)

const contenu = computed(() => props.blok.contenu || [])
const ouvert = ref(false)
const panneau = ref(null)
const btnFermer = ref(null)
let dernierFocus = null

const tailleClass = computed(
  () =>
    ({
      M: 'sm:max-w-lg',
      L: 'sm:max-w-2xl',
      XL: 'sm:max-w-4xl',
    })[props.blok.taille] || 'sm:max-w-2xl',
)

const ouvrir = async () => {
  dernierFocus = document.activeElement
  ouvert.value = true
  document.body.style.overflow = 'hidden'
  await nextTick()
  btnFermer.value?.focus()
}

const fermer = () => {
  ouvert.value = false
  document.body.style.overflow = ''
  dernierFocus?.focus?.()
}

const piegerFocus = (e) => {
  if (!panneau.value) return
  const cibles = panneau.value.querySelectorAll(
    'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
  )
  if (!cibles.length) return
  const premier = cibles[0]
  const dernier = cibles[cibles.length - 1]
  if (e.shiftKey && document.activeElement === premier) {
    e.preventDefault()
    dernier.focus()
  } else if (!e.shiftKey && document.activeElement === dernier) {
    e.preventDefault()
    premier.focus()
  }
}

onBeforeUnmount(() => {
  document.body.style.overflow = ''
})
</script>

<style scoped>
.popup-enter-active,
.popup-leave-active {
  transition: opacity 0.2s ease;
}
.popup-enter-active > div:last-child,
.popup-leave-active > div:last-child {
  transition: transform 0.25s ease;
}
.popup-enter-from,
.popup-leave-to {
  opacity: 0;
}
.popup-enter-from > div:last-child,
.popup-leave-to > div:last-child {
  transform: translateY(2rem);
}
</style>
