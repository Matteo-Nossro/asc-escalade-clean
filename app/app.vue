<template>
  <UApp>
    <LayoutHeader />
    <UMain>
      <NuxtPage />
    </UMain>
    <LayoutFooter />
  </UApp>
</template>

<script setup>
import { watch } from 'vue'


const colorMode = useColorMode()
colorMode.preference = 'light'

const user = useSupabaseUser()
const { fetchProfile } = useAuth()

watch(user, async (newUser) => {
  console.log('User changed:', newUser)
  if (newUser) {
    await fetchProfile()
  }
}, { immediate: true })

</script>
