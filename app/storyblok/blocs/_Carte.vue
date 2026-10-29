<!-- Une carte de bloc-grille-cartes — usage interne. -->
<template>
  <article
    class="h-full bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col"
  >
    <NuxtImg
      v-if="carte.image?.filename"
      provider="storyblok"
      :src="carte.image.filename"
      :alt="carte.image.alt || carte.titre || ''"
      class="w-full aspect-[3/2] object-cover"
    />

    <div class="p-6 md:p-7 flex flex-col flex-grow">
      <div
        v-if="carte.icon && !carte.image?.filename"
        class="w-12 h-12 rounded-2xl bg-vp-green/15 flex items-center justify-center mb-4"
      >
        <UIcon :name="carte.icon" class="w-6 h-6 text-vp-dark" />
      </div>

      <span
        v-if="carte.etiquette"
        class="self-start text-xs font-bold uppercase tracking-wider text-[var(--vp-green-text)] mb-2"
      >
        {{ carte.etiquette }}
      </span>

      <h3 class="text-lg font-bold text-vp-dark">{{ carte.titre }}</h3>

      <p v-if="carte.prix" class="mt-1 text-2xl font-black text-vp-dark">{{ carte.prix }}</p>

      <p v-if="carte.texte" class="mt-2 text-sm text-gray-600 flex-grow">{{ carte.texte }}</p>

      <ul v-if="(carte.points || []).length" class="mt-3 space-y-1.5 flex-grow">
        <li
          v-for="(pt, pi) in carte.points"
          :key="pt._uid || pi"
          class="flex items-start gap-2 text-sm text-gray-700"
        >
          <UIcon name="i-heroicons-check" class="w-4 h-4 text-vp-green flex-shrink-0 mt-0.5" />
          {{ pt.texte }}
        </li>
      </ul>

      <div v-if="(carte.bouton || []).length" class="mt-5">
        <BlocBouton :blok="carte.bouton[0]" />
      </div>
    </div>
  </article>
</template>

<script setup>
import BlocBouton from './_BlocBouton.vue'

defineProps({ carte: { type: Object, required: true } })
</script>
