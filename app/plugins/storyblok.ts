import HomeHero from '../storyblok/Home/Hero.vue'
import HomeActualites from '../storyblok/Home/Actualites.vue'
import HomeEvenements from '../storyblok/Home/ProchainsEvenements.vue'
import HomeCtaRejoindre from '../storyblok/Home/CtaRejoindre.vue'

export default defineNuxtPlugin(({ vueApp }) => {
  vueApp.component('home-hero', HomeHero)
  vueApp.component('home-actualites', HomeActualites)
  vueApp.component('home-prochains-evenements', HomeEvenements)
  vueApp.component('home-cta-rejoindre', HomeCtaRejoindre)
})
