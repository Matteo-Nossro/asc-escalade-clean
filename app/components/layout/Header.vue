<template>
  <header class="header" :class="{ 'header--scrolled': isScrolled }">
    <UContainer class="header__container">

      <!-- Logo -->
      <NuxtLink to="/" class="header__logo">
        <template v-if="config?.logo_image?.filename">
          <img :src="config.logo_image.filename" :alt="config.logo_text_top || 'Logo'" class="h-11 w-auto object-contain" />
        </template>
        <template v-else>
          <div class="header__logo-icon">
            <UIcon name="i-heroicons-mountain-solid" class="text-white text-2xl" />
          </div>
          <div class="header__logo-text">
            <span class="header__logo-vertical">{{ config?.logo_text_top || 'ASC' }}</span>
            <span class="header__logo-pulse">{{ config?.logo_text_bottom || 'ESCALADE' }}</span>
          </div>
        </template>
      </NuxtLink>

      <!-- Navigation Desktop -->
      <nav class="header__nav">
        <NuxtLink
          v-for="link in navigationLinks"
          :key="link._uid"
          :to="resolveLink(link.link)"
          class="header__nav-link"
          active-class="header__nav-link--active"
        >
          {{ link.label }}
        </NuxtLink>
      </nav>

      <!-- Actions -->
      <div class="header__actions">
        <UButton
          to="/login"
          color="neutral"
          variant="solid"
          size="md"
          label="Connexion"
          icon="i-heroicons-user"
          class="header__btn-login"
        />
        <UButton
          color="neutral"
          variant="ghost"
          icon="i-heroicons-bars-3"
          class="header__burger"
          @click="openMobileMenu"
        />
      </div>
    </UContainer>

    <!-- Slideover Mobile -->
    <ClientOnly>
      <Teleport to="body">
        <Transition
          enter-active-class="transition-opacity duration-200"
          enter-from-class="opacity-0"
          enter-to-class="opacity-100"
          leave-active-class="transition-opacity duration-200"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <div
            v-if="isMobileMenuOpen"
            class="fixed inset-0 bg-black/50 z-[9998]"
            @click="closeMobileMenu"
          ></div>
        </Transition>

        <Transition
          enter-active-class="transition-transform duration-300"
          enter-from-class="translate-x-full"
          enter-to-class="translate-x-0"
          leave-active-class="transition-transform duration-300"
          leave-from-class="translate-x-0"
          leave-to-class="translate-x-full"
        >
          <div
            v-if="isMobileMenuOpen"
            class="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-white shadow-2xl z-[9999] flex flex-col"
          >
            <!-- Header du menu mobile -->
            <div class="flex items-center justify-between p-6 border-b border-gray-200">
              <div class="flex items-center gap-3">
                <template v-if="config?.logo_image?.filename">
                  <img :src="config.logo_image.filename" class="h-8 w-auto object-contain" />
                </template>
                <template v-else>
                  <div class="header__logo-text">
                    <span class="header__logo-vertical">{{ config?.logo_text_top || 'ASC' }}</span>
                    <span class="header__logo-pulse">{{ config?.logo_text_bottom || 'ESCALADE' }}</span>
                  </div>
                </template>
              </div>
              <UButton
                color="neutral"
                variant="ghost"
                icon="i-heroicons-x-mark-20-solid"
                @click="closeMobileMenu"
              />
            </div>

            <!-- Navigation mobile -->
            <nav class="flex-1 overflow-y-auto p-4">
              <div class="flex flex-col gap-2">
                <NuxtLink
                  v-for="link in navigationLinks"
                  :key="link._uid"
                  :to="resolveLink(link.link)"
                  class="mobile-nav-link"
                  active-class="mobile-nav-link--active"
                  @click="handleMenuClick"
                >
                  <UIcon :name="link.icon || 'i-heroicons-chevron-right'" class="w-5 h-5 flex-shrink-0" />
                  <span class="font-medium flex-1">{{ link.label }}</span>
                  <UIcon name="i-heroicons-chevron-right" class="w-5 h-5 flex-shrink-0 opacity-50" />
                </NuxtLink>
              </div>
            </nav>

            <!-- Footer du menu mobile -->
            <div class="p-4 border-t border-gray-200">
              <UButton
                to="/login"
                color="neutral"
                variant="solid"
                size="xl"
                label="Connexion"
                icon="i-heroicons-user"
                block
                class="bg-[#0F1729] text-white hover:bg-[#1a2740]"
                @click="handleMenuClick"
              />
            </div>
          </div>
        </Transition>
      </Teleport>
    </ClientOnly>
  </header>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

const isScrolled = ref(false)
const isMobileMenuOpen = ref(false)
const { isDesktop } = useBreakpoints()

// ✅ Un seul appel via le composable partagé
const configData = await useSiteConfig()
const config = computed(() => configData.value)

const navigationLinks = computed(() => config.value?.nav_links || [])

const resolveLink = (linkObj) => {
  if (!linkObj) return '#'
  if (linkObj.linktype === 'story') {
    return linkObj.cached_url?.startsWith('/') ? linkObj.cached_url : `/${linkObj.cached_url}`
  }
  return linkObj.url || '#'
}

const openMobileMenu = () => {
  isMobileMenuOpen.value = true
  if (process.client) document.body.style.overflow = 'hidden'
}

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false
  if (process.client) document.body.style.overflow = ''
}

const handleMenuClick = () => {
  setTimeout(() => closeMobileMenu(), 150)
}

watch(isDesktop, (newVal) => {
  if (newVal && isMobileMenuOpen.value) closeMobileMenu()
})

const handleScroll = () => {
  isScrolled.value = window.scrollY > 20
}

onMounted(() => window.addEventListener('scroll', handleScroll))
onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  if (process.client) document.body.style.overflow = ''
})
</script>

<style lang="scss" scoped>
.header {
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 1000;
  background: white;
  transition: all 0.3s ease;

  &--scrolled {
    box-shadow: 0 2px 20px rgba(0, 0, 0, 0.08);
  }

  &__container {
    padding-top: 1rem;
    padding-bottom: 1rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 3rem;
  }

  &__logo {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    text-decoration: none;
    transition: transform 0.2s ease;
    &:hover { transform: translateY(-2px); }
  }

  &__logo-icon {
    width: 45px; height: 45px;
    background: #7FD857;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__logo-text {
    display: flex;
    flex-direction: column;
    line-height: 1.1;
  }

  &__logo-vertical {
    font-size: 1.05rem;
    font-weight: 700;
    color: #0F1729;
    letter-spacing: 0.5px;
  }

  &__logo-pulse {
    font-size: 1.05rem;
    font-weight: 300;
    color: #7FD857;
    letter-spacing: 0.5px;
  }

  &__nav {
    display: flex;
    align-items: center;
    gap: 2rem;
    @media (max-width: 1024px) { display: none; }
  }

  &__nav-link {
    color: #0F1729;
    text-decoration: none;
    font-size: 0.95rem;
    font-weight: 500;
    position: relative;
    transition: color 0.2s ease;
    padding: 0.5rem 0;

    &:hover { color: #7FD857; }

    &--active {
      color: #7FD857;
      &::after {
        content: '';
        position: absolute;
        bottom: 0; left: 0; right: 0;
        height: 2px;
        background: #7FD857;
        border-radius: 2px;
      }
    }
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  &__btn-login {
    background-color: #0F1729;
    color: white;
    &:hover { background-color: #1a2740; }
    @media (max-width: 768px) { display: none; }
  }

  &__burger {
    display: none;
    @media (max-width: 1024px) { display: flex; }
  }
}

.mobile-nav-link {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: 0.75rem;
  text-decoration: none;
  transition: all 0.2s ease;
  background: white;
  color: #0F1729;

  &:hover { background: #F5F7FA; }
  &:active { background: #E5E7EB; transform: scale(0.98); }

  &--active {
    background: #F0FDF4;
    span { color: #7FD857; font-weight: 600; }
    svg { color: #7FD857; }
  }
}
</style>
