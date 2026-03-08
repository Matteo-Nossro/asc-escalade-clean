<template>
  <footer class="w-screen bg-[#0F1729] text-white pt-16 pb-8 border-t border-gray-800 -ml-[calc((100vw-100%)/2)]">
    <UContainer>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">

        <!-- Colonne 1 : Logo & Description -->
        <div class="flex flex-col gap-6 lg:col-span-2">
          <NuxtLink to="/" class="flex items-center gap-3 w-fit">
            <template v-if="config?.logo_image?.filename">
              <img :src="config.logo_image.filename" :alt="config.logo_text_top || 'Logo'" class="h-11 w-auto object-contain" />
            </template>
            <template v-else>
              <div class="w-10 h-10 bg-[#7FD857] rounded-lg flex items-center justify-center">
                <UIcon name="i-heroicons-mountain-solid" class="text-white text-2xl" />
              </div>
              <div class="flex flex-col leading-none">
                <span class="font-bold text-lg tracking-wide text-white">{{ config?.logo_text_top || 'ASC' }}</span>
                <span class="font-light text-lg tracking-wide text-[#7FD857]">{{ config?.logo_text_bottom || 'ESCALADE' }}</span>
              </div>
            </template>
          </NuxtLink>

          <p class="text-gray-400 text-sm leading-relaxed">
            {{ config?.footer_description || "L'association sportive d'escalade qui fait vibrer vos sensations." }}
          </p>

          <div v-if="socialLinks.length > 0" class="flex gap-3">
            <UButton
              v-for="social in socialLinks"
              :key="social._uid"
              :to="resolveLink(social.link)"
              target="_blank"
              color="neutral"
              variant="soft"
              :icon="social.icon || 'i-heroicons-link'"
              class="bg-white/5 hover:bg-[#7FD857] hover:text-white transition-colors border-none"
              :ui="{ rounded: 'rounded-lg' }"
              :aria-label="social.label"
            />
          </div>
        </div>

        <!-- Colonne 2 : Contact -->
        <div class="flex flex-col gap-6">
          <h3 class="text-[#7FD857] font-bold text-lg">Contact</h3>
          <ul class="flex flex-col gap-4">
            <li v-if="config?.address" class="flex items-start gap-3 text-gray-400">
              <UIcon name="i-heroicons-map-pin" class="w-5 h-5 text-[#7FD857] mt-1 shrink-0" />
              <span class="text-sm whitespace-pre-line">{{ config.address }}</span>
            </li>
            <li v-if="config?.phone" class="flex items-center gap-3 text-gray-400">
              <UIcon name="i-heroicons-phone" class="w-5 h-5 text-[#7FD857] shrink-0" />
              <a :href="`tel:${config.phone.replace(/\s/g, '')}`" class="text-sm hover:text-white transition-colors">
                {{ config.phone }}
              </a>
            </li>
            <li v-if="config?.email" class="flex items-center gap-3 text-gray-400">
              <UIcon name="i-heroicons-envelope" class="w-5 h-5 text-[#7FD857] shrink-0" />
              <a :href="`mailto:${config.email}`" class="text-sm hover:text-white transition-colors">
                {{ config.email }}
              </a>
            </li>
          </ul>
        </div>

        <!-- Colonne 3 : Navigation -->
        <div class="flex flex-col gap-6">
          <h3 class="text-[#7FD857] font-bold text-lg">Navigation</h3>
          <ul class="flex flex-col gap-3">
            <li v-for="link in navigationLinks" :key="link._uid">
              <NuxtLink
                :to="resolveLink(link.link)"
                class="text-gray-400 text-sm hover:text-[#7FD857] transition-colors"
              >
                {{ link.label }}
              </NuxtLink>
            </li>
          </ul>
        </div>

        <!-- Colonne 4 : Partenaires -->
        <div class="flex flex-col gap-6">
          <h3 class="text-[#7FD857] font-bold text-lg">Partenaires</h3>
          <div class="grid grid-cols-2 gap-4">
            <a
              v-for="partner in partners"
              :key="partner._uid"
              :href="resolveLink(partner.link)"
              target="_blank"
              class="text-gray-400 text-xs hover:text-white transition-colors uppercase font-semibold"
            >
              {{ partner.label }}
            </a>
          </div>
        </div>

      </div>

      <!-- Copyright -->
      <div class="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
        <p>© {{ new Date().getFullYear() }} ASC Escalade. Tous droits réservés.</p>
        <p>Designé avec passion pour la grimpe.</p>
      </div>
    </UContainer>
  </footer>
</template>

<script setup>
import { computed } from 'vue'

// ✅ Un seul appel via le composable partagé
const configData = await useSiteConfig()
const config = computed(() => configData.value)

const navigationLinks = computed(() => config.value?.footer_nav_links || [])
const socialLinks = computed(() => config.value?.social_links || [])
const partners = computed(() => config.value?.partners || [])

const resolveLink = (linkObj) => {
  if (!linkObj) return '#'
  if (linkObj.linktype === 'story') {
    return linkObj.cached_url?.startsWith('/') ? linkObj.cached_url : `/${linkObj.cached_url}`
  }
  return linkObj.url || '#'
}
</script>
