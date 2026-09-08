<template>
  <section
    :id="blok.anchor_id || 'permanences'"
    ref="root"
    v-editable="blok"
    class="scroll-mt-28 py-16 md:py-24"
    :class="fond.section"
  >
    <UContainer>
      <div class="max-w-2xl mx-auto text-center mb-12" data-reveal>
        <span
          v-if="blok.surtitre"
          class="text-[var(--vp-green-text)] font-bold uppercase tracking-wider text-sm"
        >
          {{ blok.surtitre }}
        </span>
        <h2 class="text-3xl md:text-4xl font-bold mt-2" :class="fond.titre">
          {{ blok.title || "Les permanences d'inscription" }}
        </h2>
      </div>

      <div class="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
        <div
          v-for="(p, i) in permanences"
          :key="p._uid || i"
          data-reveal
          class="bg-white rounded-3xl shadow-lg p-8 flex flex-col"
        >
          <div class="flex items-center gap-3 mb-5">
            <div class="w-12 h-12 rounded-2xl bg-[#7FD857]/15 flex items-center justify-center flex-shrink-0">
              <UIcon :name="p.icon || 'i-heroicons-calendar-days'" class="w-6 h-6 text-[#0F1729]" />
            </div>
            <span
              v-if="p.tag"
              class="text-xs font-bold uppercase tracking-wider text-[var(--vp-green-text)]"
            >
              {{ p.tag }}
            </span>
          </div>

          <h3 class="text-xl font-bold text-[#0F1729] mb-2">{{ p.title }}</h3>
          <p v-if="p.audience" class="text-gray-500 text-sm mb-6 flex-grow">{{ p.audience }}</p>

          <dl class="space-y-2 text-sm">
            <div v-if="p.date" class="flex items-center gap-3">
              <UIcon name="i-heroicons-calendar" class="w-5 h-5 text-gray-400 flex-shrink-0" />
              <dd class="font-bold text-[#0F1729]">
                {{ p.date }}
                <span v-if="p.horaire" class="font-medium text-gray-500">— {{ p.horaire }}</span>
              </dd>
            </div>
            <div v-if="p.lieu" class="flex items-center gap-3">
              <UIcon name="i-heroicons-map-pin" class="w-5 h-5 text-gray-400 flex-shrink-0" />
              <dd class="font-medium text-gray-700">{{ p.lieu }}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div
        v-if="renderedEncadre"
        data-reveal
        class="mt-6 max-w-5xl mx-auto flex items-start gap-3 rounded-2xl bg-[#0F1729] text-white p-5"
      >
        <UIcon name="i-heroicons-flag" class="w-6 h-6 text-[#7FD857] flex-shrink-0" />
        <div
          class="text-sm md:text-base [&_p]:my-0 [&_strong]:font-bold [&_strong]:text-[#7FD857]"
          v-html="renderedEncadre"
        />
      </div>
    </UContainer>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'
import { renderRichText } from '@storyblok/vue'

const props = defineProps({
  blok: {
    type: Object,
    required: true,
  },
})

const root = ref(null)
useGsapReveal(root)

const fond = useInscriptionsFond(() => props.blok.fond)
const permanences = computed(() => props.blok.permanences || [])
const renderedEncadre = computed(() =>
  props.blok.encadre && props.blok.encadre.content?.length ? renderRichText(props.blok.encadre) : '',
)
</script>
