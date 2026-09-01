import { defineAsyncComponent } from 'vue'

/**
 * Enregistrement des composants Storyblok.
 *
 * Les composants « racine » (page / post / site-config) sont chargés en dur : ils
 * sont présents sur quasiment toutes les pages.
 *
 * Tous les blocs de contenu sont chargés en `defineAsyncComponent` → chaque bloc
 * devient un chunk séparé, téléchargé uniquement sur les pages qui l'utilisent.
 * Cela sort du bundle commun les grosses dépendances tirées par certains blocs
 * (éditeur rich-text Storyblok, carrousel embla, lightbox…).
 */

// Racine — toujours nécessaires, chargées en dur
import Page from '../storyblok/Page.vue'
import Post from '../storyblok/Post.vue'
import SiteConfig from '../storyblok/SiteConfig.vue'

// Helper : composant Storyblok chargé à la demande
const lazy = (loader: () => Promise<unknown>) =>
  defineAsyncComponent(loader as () => Promise<{ default: unknown }>)

export default defineNuxtPlugin(({ vueApp }) => {
  // Racine
  vueApp.component('page', Page)
  vueApp.component('post', Post)
  vueApp.component('site-config', SiteConfig)

  // Page d'accueil
  vueApp.component('home-hero', lazy(() => import('../storyblok/Home/Hero.vue')))
  vueApp.component('home-actualites', lazy(() => import('../storyblok/Home/Actualites.vue')))
  vueApp.component('home-prochains-evenements', lazy(() => import('../storyblok/Home/ProchainsEvenements.vue')))
  vueApp.component('home-cta-rejoindre', lazy(() => import('../storyblok/Home/CtaRejoindre.vue')))

  // Actualités
  vueApp.component('actualites-page', lazy(() => import('../storyblok/actualites/Page.vue')))
  vueApp.component('actualites-header', lazy(() => import('../storyblok/actualites/Header.vue')))

  // Club
  vueApp.component('club-hero', lazy(() => import('../storyblok/club/HeroClub.vue')))
  vueApp.component('club-histoire', lazy(() => import('../storyblok/club/Histoire.vue')))
  vueApp.component('club-timeline', lazy(() => import('../storyblok/club/Timeline.vue')))
  vueApp.component('club-equipe', lazy(() => import('../storyblok/club/Equipe.vue')))
  vueApp.component('club-statistiques', lazy(() => import('../storyblok/club/Statistiques.vue')))
  vueApp.component('club-galerie', lazy(() => import('../storyblok/club/Galerie.vue')))
  vueApp.component('club-partenaires', lazy(() => import('../storyblok/club/Partenaires.vue')))
  vueApp.component('club-initiateurs', lazy(() => import('../storyblok/club/Initiateurs.vue')))

  // Contact
  vueApp.component('contact-page', lazy(() => import('../storyblok/contact/ContactPage.vue')))
  vueApp.component('contact-header', lazy(() => import('../storyblok/contact/Header.vue')))
  vueApp.component('contact-infos', lazy(() => import('../storyblok/contact/Infos.vue')))
  vueApp.component('contact-form', lazy(() => import('../storyblok/contact/Form.vue')))

  // Sorties
  vueApp.component('sorties-page', lazy(() => import('../storyblok/sorties/Page.vue')))
  vueApp.component('sorties-header', lazy(() => import('../storyblok/sorties/Header.vue')))
  vueApp.component('sorties-concept', lazy(() => import('../storyblok/sorties/Concept.vue')))
  vueApp.component('sorties-liste', lazy(() => import('../storyblok/sorties/ListeSorties.vue')))

  // Tarifs
  vueApp.component('tarifs-page', lazy(() => import('../storyblok/tarifs/TarifsPage.vue')))
  vueApp.component('tarifs-planning', lazy(() => import('../storyblok/tarifs/Planning.vue')))
  vueApp.component('tarifs-hero', lazy(() => import('../storyblok/tarifs/Header.vue')))
  vueApp.component('tarifs-bon-a-savoir', lazy(() => import('../storyblok/tarifs/BonASavoir.vue')))
  vueApp.component('tarifs-grille-tarifs', lazy(() => import('../storyblok/tarifs/GrilleTarifs.vue')))
  vueApp.component('liste-groupe-accordeon', lazy(() => import('../storyblok/tarifs/ListeGroupeAccordeon.vue')))

  // UI général
  vueApp.component('action-bouton', lazy(() => import('../storyblok/ui/ActionBouton.vue')))
  vueApp.component('bouton', lazy(() => import('../storyblok/ui/Bouton.vue')))
  vueApp.component('carrousel', lazy(() => import('../storyblok/ui/Carrousel.vue')))
  vueApp.component('accordions', lazy(() => import('../storyblok/ui/Accordions.vue')))
  vueApp.component('call-to-action', lazy(() => import('../storyblok/ui/CallToAction.vue')))
  vueApp.component('centered-image', lazy(() => import('../storyblok/ui/CenteredImage.vue')))
  vueApp.component('tabs-section', lazy(() => import('../storyblok/ui/TabsSection.vue')))
  vueApp.component('text-with-image', lazy(() => import('../storyblok/ui/TextWithImage.vue')))
  vueApp.component('text-with-title', lazy(() => import('../storyblok/ui/TextWithTitle.vue')))
  vueApp.component('galerie', lazy(() => import('../storyblok/ui/Galerie.vue')))
  vueApp.component('before-after', lazy(() => import('../storyblok/ui/BeforeAfter.vue')))
})
