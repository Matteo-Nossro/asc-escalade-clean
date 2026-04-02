// ==========================================
// Composants racine
// ==========================================
import Page from '../storyblok/Page.vue'
import Post from '../storyblok/Post.vue'
import SiteConfig from '../storyblok/SiteConfig.vue'

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
import Galerie from '../storyblok/ui/Galerie.vue'

// ==========================================
// Éléments de la page actualités
// ==========================================
import ActualitesHeader from '../storyblok/actualites/Header.vue'
import ActualitesPage from '../storyblok/actualites/Page.vue'

// ==========================================
// Éléments de la page club
// ==========================================
import ClubHero from '../storyblok/club/HeroClub.vue'
import ClubHistoire from '../storyblok/club/Histoire.vue'
import ClubEquipe from '../storyblok/club/Equipe.vue'
import ClubStatistiques from '../storyblok/club/Statistiques.vue'
import ClubGalerie from '../storyblok/club/Galerie.vue'
import ClubPartenaires from '../storyblok/club/Partenaires.vue'

// ==========================================
// Éléments de la page contact
// ==========================================
import ContactPage from '../storyblok/contact/ContactPage.vue'
import ContactHeader from '../storyblok/contact/Header.vue'
import ContactInfos from '../storyblok/contact/Infos.vue'
import ContactForm from '../storyblok/contact/Form.vue'

// ==========================================
// Éléments de la page sorties
// ==========================================
import SortiesHeader from '../storyblok/sorties/Header.vue'
import SortiesConcept from '../storyblok/sorties/Concept.vue'
import SortiesListe from '../storyblok/sorties/ListeSorties.vue'
import SortiesPage from '../storyblok/sorties/Page.vue'

// ==========================================
// Éléments de la page tarifs
// ==========================================
import TarifsPage from '../storyblok/tarifs/TarifsPage.vue'
import TarifsPlanning from '../storyblok/tarifs/Planning.vue'
import TarifsHeader from '../storyblok/tarifs/Header.vue'
import TarifsBonASavoir from '../storyblok/tarifs/BonASavoir.vue'
import TarifsGrilleTarifs from '../storyblok/tarifs/GrilleTarifs.vue'

// ==========================================
// UI complémentaires
// ==========================================
import UiBouton from '../storyblok/ui/Bouton.vue'
import UiCarrousel from '../storyblok/ui/Carrousel.vue'
import ActionBouton from '../storyblok/ui/ActionBouton.vue'


export default defineNuxtPlugin(({ vueApp }) => {
  // Racine
  vueApp.component('page', Page)
  vueApp.component('post', Post)
  vueApp.component('site-config', SiteConfig)

  // Page d'accueil
  vueApp.component('home-hero', HomeHero)
  vueApp.component('home-actualites', HomeActualites)
  vueApp.component('home-prochains-evenements', HomeEvenements)
  vueApp.component('home-cta-rejoindre', HomeCtaRejoindre)

  // Actualités
  vueApp.component('actualites-page', ActualitesPage)
  vueApp.component('actualites-header', ActualitesHeader)

  // Club
  vueApp.component('club-hero', ClubHero)
  vueApp.component('club-histoire', ClubHistoire)
  vueApp.component('club-equipe', ClubEquipe)
  vueApp.component('club-statistiques', ClubStatistiques)
  vueApp.component('club-galerie', ClubGalerie)
  vueApp.component('club-partenaires', ClubPartenaires)

  // Contact
  vueApp.component('contact-page', ContactPage)
  vueApp.component('contact-header', ContactHeader)
  vueApp.component('contact-infos', ContactInfos)
  vueApp.component('contact-form', ContactForm)

  // Sorties
  vueApp.component('sorties-page', SortiesPage)
  vueApp.component('sorties-header', SortiesHeader)
  vueApp.component('sorties-concept', SortiesConcept)
  vueApp.component('sorties-liste', SortiesListe)

  // Tarifs
  vueApp.component('tarifs-page', TarifsPage)
  vueApp.component('tarifs-planning', TarifsPlanning)
  vueApp.component('tarifs-hero', TarifsHeader)
  vueApp.component('tarifs-bon-a-savoir', TarifsBonASavoir)
  vueApp.component('tarifs-grille-tarifs', TarifsGrilleTarifs)

  // UI général
  vueApp.component('action-bouton', ActionBouton)
  vueApp.component('bouton', UiBouton)
  vueApp.component('carrousel', UiCarrousel)
  vueApp.component('accordions', Accordions)
  vueApp.component('call-to-action', CallToAction)
  vueApp.component('centered-image', CenteredImage)
  vueApp.component('tabs-section', TabsSection)
  vueApp.component('text-with-image', TextWithImage)
  vueApp.component('text-with-title', TextWithTitle)
  vueApp.component('galerie', Galerie)
})
