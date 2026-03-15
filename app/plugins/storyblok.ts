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

// ==========================================
// Éléments de la page actualités
// ==========================================
import ActualitesHeader from '../storyblok/actualites/Header.vue'

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
import ContactHeader from '../storyblok/contact/Header.vue'
import ContactInfos from '../storyblok/contact/Infos.vue'
import ContactForm from '../storyblok/contact/Form.vue'

// ==========================================
// Éléments de la page sorties
// ==========================================
import SortiesHeader from '../storyblok/sorties/Header.vue'
import SortiesConcept from '../storyblok/sorties/Concept.vue'
import SortiesListe from '../storyblok/sorties/ListeSorties.vue'

// ==========================================
// Éléments de la page tarifs
// ==========================================
import TarifsPage from '../storyblok/tarifs/TarifsPage.vue'
import TarifsPlanning from '../storyblok/tarifs/Planning.vue'
import TarifsHeader from '../storyblok/tarifs/Header.vue'


// ==========================================
// Éléments de Layout
// ==========================================
// import Header from '../storyblok/layout/Header.vue'
// import Footer from '../storyblok/layout/Footer.vue'
import SiteConfig from '../storyblok/SiteConfig.vue'


export default defineNuxtPlugin(({ vueApp }) => {
  // Enregistrement des éléments de la page d'accueil
  vueApp.component('home-hero', HomeHero)
  vueApp.component('home-actualites', HomeActualites)
  vueApp.component('home-prochains-evenements', HomeEvenements)
  vueApp.component('home-cta-rejoindre', HomeCtaRejoindre)


  vueApp.component('actualites_header', ActualitesHeader)

  vueApp.component('club_hero', ClubHero)
  vueApp.component('club_histoire', ClubHistoire)
  vueApp.component('club_equipe', ClubEquipe)
  vueApp.component('club_statistiques', ClubStatistiques)
  vueApp.component('club_galerie', ClubGalerie)
  vueApp.component('club_partenaires', ClubPartenaires)

  vueApp.component('contact_header', ContactHeader)
  vueApp.component('contact_infos', ContactInfos)
  vueApp.component('contact_form', ContactForm)

  vueApp.component('sorties_header', SortiesHeader)
  vueApp.component('sorties_concept', SortiesConcept)
  vueApp.component('sorties_liste', SortiesListe)

  vueApp.component('tarifs_page', TarifsPage)
  vueApp.component('tarifs-planning', TarifsPlanning)
  vueApp.component('tarifs_hero ', TarifsHeader)

  // Enregistrement des éléments de l'UI général
  // Le premier argument ('nom-du-blok') DOIT correspondre EXACTEMENT 
  // au 'Technical name' que tu as défini dans Storyblok !
  vueApp.component('accordions', Accordions)
  vueApp.component('call_to_action', CallToAction)
  vueApp.component('centered_image', CenteredImage)
  vueApp.component('tabs_section', TabsSection)
  vueApp.component('text_with_image', TextWithImage)
  vueApp.component('text_with_title', TextWithTitle)

  // Enregistrement des éléments de layout
  // vueApp.component('global_header', Header)
  // vueApp.component('global_footer', Footer)
  vueApp.component('site_config', SiteConfig)
})