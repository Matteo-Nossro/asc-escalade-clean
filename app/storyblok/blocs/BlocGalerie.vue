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
    <div class="grid gap-3 sm:gap-4" :class="colonnes" data-reveal>
      <button
        v-for="(photo, i) in photos"
        :key="photo.id || i"
        type="button"
        class="group relative overflow-hidden rounded-2xl aspect-square"
        @click="ouvrir(i)"
      >
        <img
          :src="`${photo.filename}/m/600x600/filters:quality(75):format(webp)`"
          :alt="photo.alt || ''"
          loading="lazy"
          class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </button>
    </div>

    <!-- Visionneuse -->
    <Teleport to="body">
      <div
        v-if="actif !== null"
        class="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
        @click="actif = null"
      >
        <img
          :src="`${photos[actif].filename}/m/1600x0/filters:quality(80):format(webp)`"
          :alt="photos[actif].alt || ''"
          class="max-w-full max-h-full object-contain rounded-lg"
        />
        <button
          class="absolute top-4 right-4 w-11 h-11 rounded-full bg-white/10 text-white flex items-center justify-center"
          @click.stop="actif = null"
        >
          <UIcon name="i-heroicons-x-mark" class="w-6 h-6" />
        </button>
        <button
          v-if="photos.length > 1"
          class="absolute left-4 w-11 h-11 rounded-full bg-white/10 text-white flex items-center justify-center"
          @click.stop="actif = (actif - 1 + photos.length) % photos.length"
        >
          <UIcon name="i-heroicons-chevron-left" class="w-6 h-6" />
        </button>
        <button
          v-if="photos.length > 1"
          class="absolute right-4 w-11 h-11 rounded-full bg-white/10 text-white flex items-center justify-center"
          @click.stop="actif = (actif + 1) % photos.length"
        >
          <UIcon name="i-heroicons-chevron-right" class="w-6 h-6" />
        </button>
      </div>
    </Teleport>
  </SectionShell>
</template>

<script setup>
import { ref, computed } from 'vue'
import SectionShell from './_SectionShell.vue'

const props = defineProps({ blok: { type: Object, required: true } })

const photos = computed(() => (props.blok.photos || []).filter((p) => p && p.filename))
const actif = ref(null)
const ouvrir = (i) => (actif.value = i)

const colonnes = computed(
  () =>
    ({
      2: 'grid-cols-2',
      3: 'grid-cols-2 sm:grid-cols-3',
      4: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
    })[Number(props.blok.colonnes) || 3] || 'grid-cols-2 sm:grid-cols-3',
)
</script>
