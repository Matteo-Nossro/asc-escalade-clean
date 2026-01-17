<template>
	<UApp>
		<UHeader>
			<Header/>
		</UHeader>

		<UMain>
			<NuxtPage/>
		</UMain>

<!--		<UFooter>-->
			<Footer/>

<!--		</UFooter>-->

	</UApp>
</template>

<script setup>
import Header from "~/components/layout/Header.vue";
import Footer from "~/components/layout/Footer.vue";

const colorMode = useColorMode()

// Forcer le mode light
colorMode.preference = 'light'
</script>
