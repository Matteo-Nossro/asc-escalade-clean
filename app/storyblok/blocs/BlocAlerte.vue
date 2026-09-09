<template>
  <div v-if="visible" v-editable="blok" :class="styles.fond">
    <UContainer class="py-3">
      <div class="flex items-center gap-3 text-sm md:text-base" :class="styles.texte">
        <UIcon :name="blok.icon || styles.icon" class="w-5 h-5 flex-shrink-0" :class="styles.iconColor" />
        <p class="flex-grow font-medium">
          <span v-if="blok.titre" class="font-bold">{{ blok.titre }} — </span>{{ blok.message }}
          <NuxtLink
            v-if="blok.lien_label && lien.href"
            :to="lien.href"
            :target="lien.external ? '_blank' : undefined"
            :rel="lien.external ? 'noopener' : undefined"
            class="underline font-bold whitespace-nowrap"
          >
            {{ blok.lien_label }}
          </NuxtLink>
        </p>
        <button
          v-if="blok.fermable"
          type="button"
          class="flex-shrink-0 opacity-70 hover:opacity-100"
          aria-label="Fermer"
          @click="fermer"
        >
          <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
        </button>
      </div>
    </UContainer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useStoryblokLink } from '~/composables/useStoryblokLink'

const props = defineProps({ blok: { type: Object, required: true } })

const { resolveLink } = useStoryblokLink()
const lien = computed(() => resolveLink(props.blok.lien))

const cle = computed(() => `alerte-${props.blok._uid || props.blok.message}`)
const visible = ref(true)

onMounted(() => {
  if (props.blok.fermable) {
    try {
      if (localStorage.getItem(cle.value) === '1') visible.value = false
    } catch {}
  }
})
const fermer = () => {
  visible.value = false
  try {
    localStorage.setItem(cle.value, '1')
  } catch {}
}

const styles = computed(() => {
  switch (props.blok.type) {
    case 'urgent':
      return {
        fond: 'bg-red-600',
        texte: 'text-white',
        icon: 'i-heroicons-exclamation-triangle',
        iconColor: 'text-white',
      }
    case 'info':
      return {
        fond: 'bg-[#0F1729]',
        texte: 'text-white',
        icon: 'i-heroicons-information-circle',
        iconColor: 'text-[#7FD857]',
      }
    default:
      return {
        fond: 'bg-[#7FD857]',
        texte: 'text-[#0F1729]',
        icon: 'i-heroicons-megaphone',
        iconColor: 'text-[#0F1729]',
      }
  }
})
</script>
