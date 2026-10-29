<template>
  <SectionShell
    v-editable="blok"
    :fond="blok.fond"
    :anchor-id="blok.anchor_id"
    :surtitre="blok.surtitre"
    :titre="blok.titre || 'Nous trouver'"
    :intro="blok.intro"
    largeur="large"
  >
    <div class="grid lg:grid-cols-2 gap-6 items-stretch" data-reveal>
      <!-- Plan -->
      <component
        :is="itineraire.href ? 'a' : 'div'"
        :href="itineraire.href || undefined"
        :target="itineraire.href ? '_blank' : undefined"
        :rel="itineraire.href ? 'noopener' : undefined"
        class="rounded-3xl overflow-hidden shadow-lg min-h-[280px] bg-gray-100 flex"
      >
        <NuxtImg
          v-if="blok.plan?.filename"
          provider="storyblok"
          :src="blok.plan.filename"
          :alt="`Plan d'accès — ${blok.nom_lieu || ''}`"
          class="w-full h-full object-cover"
        />
        <span v-else class="m-auto"><UIcon name="i-heroicons-map" class="w-12 h-12 text-gray-300" /></span>
      </component>

      <!-- Infos pratiques -->
      <div class="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 flex flex-col">
        <h3 v-if="blok.nom_lieu" class="text-xl font-bold text-vp-dark mb-4">{{ blok.nom_lieu }}</h3>

        <dl class="space-y-4 text-sm flex-grow">
          <div v-if="blok.adresse" class="flex gap-3">
            <UIcon name="i-heroicons-map-pin" class="w-5 h-5 text-vp-green flex-shrink-0 mt-0.5" />
            <dd class="text-gray-700 whitespace-pre-line">{{ blok.adresse }}</dd>
          </div>
          <div v-if="blok.acces" class="flex gap-3">
            <UIcon name="i-heroicons-map" class="w-5 h-5 text-vp-green flex-shrink-0 mt-0.5" />
            <dd class="text-gray-700 whitespace-pre-line">{{ blok.acces }}</dd>
          </div>
          <div v-if="blok.parking" class="flex gap-3">
            <UIcon name="i-heroicons-truck" class="w-5 h-5 text-vp-green flex-shrink-0 mt-0.5" />
            <dd class="text-gray-700 whitespace-pre-line">{{ blok.parking }}</dd>
          </div>
        </dl>

        <UButton
          v-if="itineraire.href"
          :href="itineraire.href"
          target="_blank"
          rel="noopener"
          trailing-icon="i-heroicons-arrow-top-right-on-square"
          size="lg"
          class="mt-6 self-start bg-vp-dark hover:bg-vp-dark-hover text-white font-bold"
        >
          {{ blok.lien_itineraire_label || 'Itinéraire' }}
        </UButton>
      </div>
    </div>
  </SectionShell>
</template>

<script setup>
import { computed } from 'vue'
import SectionShell from './_SectionShell.vue'
import { useStoryblokLink } from '~/composables/useStoryblokLink'

const props = defineProps({ blok: { type: Object, required: true } })

const { resolveLink } = useStoryblokLink()
const itineraire = computed(() => resolveLink(props.blok.lien_itineraire))
</script>
