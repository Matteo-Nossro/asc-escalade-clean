// ==========================================
// Éléments de la page d'accueil
// ==========================================
import HomeHero from '../storyblok/Home/Hero.vue'
import HomeActualites from '../storyblok/Home/Actualites.vue'
import HomeEvenements from '../storyblok/Home/ProchainsEvenements.vue'
import HomeCtaRejoindre from '../storyblok/Home/CtaRejoindre.vue'

// ==========================================
// Éléments de l'UI général
// ==========================================
import Accordions from '../storyblok/ui/Accordions.vue'
import CallToAction from '../storyblok/ui/CallToAction.vue'
import CenteredImage from '../storyblok/ui/CenteredImage.vue'
import TabsSection from '../storyblok/ui/TabsSection.vue'
import TextWithImage from '../storyblok/ui/TextWithImage.vue'
import TextWithTitle from '../storyblok/ui/TextWithTitle.vue'


export default defineNuxtPlugin(({ vueApp }) => {
  // Enregistrement des éléments de la page d'accueil
  vueApp.component('home-hero', HomeHero)
  vueApp.component('home-actualites', HomeActualites)
  vueApp.component('home-prochains-evenements', HomeEvenements)
  vueApp.component('home-cta-rejoindre', HomeCtaRejoindre)

  // Enregistrement des éléments de l'UI général
  // Le premier argument ('nom-du-blok') DOIT correspondre EXACTEMENT 
  // au 'Technical name' que tu as défini dans Storyblok !
  vueApp.component('accordions', Accordions)
  vueApp.component('call_to_action', CallToAction)
  vueApp.component('centered_image', CenteredImage)
  vueApp.component('tabs_section', TabsSection)
  vueApp.component('text_with_image', TextWithImage)
  vueApp.component('text_with_title', TextWithTitle)
})