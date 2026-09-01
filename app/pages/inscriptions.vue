<script setup>
import { ref, onMounted } from 'vue'
import { useSeo } from '~/composables/useSeo'

// ─────────────────────────────────────────────────────────────────────────────
// Contenu de la page — saison 2026 / 2027
// Source : ancienne page « Tarifs / Inscription » du site escalade-chevigny.fr
// ─────────────────────────────────────────────────────────────────────────────

const SEASON = '2026 / 2027'

const permanences = [
  {
    icon: 'i-heroicons-arrow-path',
    tag: 'Adhérents de la saison précédente',
    title: 'Ré-inscriptions',
    audience: 'Enfants et ados déjà licenciés en 2025 / 2026',
    date: 'Vendredi 4 septembre 2026',
    hours: 'de 18 h à 20 h',
    place: 'Gymnase Boivin',
  },
  {
    icon: 'i-heroicons-sparkles',
    tag: 'Nouveaux adhérents',
    title: 'Inscriptions + essai sur le mur',
    audience: 'Essai sur le mur pour les enfants au même moment',
    date: 'Samedi 5 septembre 2026',
    hours: 'de 14 h à 18 h',
    place: 'Gymnase Boivin',
  },
]

// Documents à télécharger (fichiers réels dans public/documents/).
const documentsAdulte = [
  {
    title: "Fiche d'inscription 2026-2027",
    hint: 'Adultes — avec attestation de santé intégrée',
    href: '/documents/fiche-inscription-adulte.docx',
    icon: 'i-heroicons-document-text',
  },
  {
    title: 'Questionnaire de santé',
    hint: '18 ans ou plus au cours de la saison',
    href: '/documents/questionnaire-sante-adulte.pdf',
    icon: 'i-heroicons-clipboard-document-check',
  },
]

const documentsMineur = [
  {
    title: "Fiche d'inscription 2026-2027",
    hint: 'Mineurs (nés après le 31/08/2009) — avec attestation de santé',
    href: '/documents/fiche-inscription-mineur.docx',
    icon: 'i-heroicons-document-text',
  },
  {
    title: 'Questionnaire de santé',
    hint: 'Mineurs — nés après le 31/08/2009',
    href: '/documents/questionnaire-sante-mineur.pdf',
    icon: 'i-heroicons-clipboard-document-check',
  },
]

const certificatMedical = {
  title: 'Certificat médical FFME',
  hint: 'Modèle type — adultes ou mineurs, si le questionnaire de santé l\'exige',
  href: '/documents/certificat-medical-ffme.pdf',
  icon: 'i-heroicons-heart',
}

const certificatCas = [
  {
    num: '1er cas',
    title: 'Licenciés jeunes (nés après le 31/08/2009) et adultes',
    detail: 'ayant répondu « oui » à l\'une des questions du questionnaire de santé.',
  },
  {
    num: '2e cas',
    title: 'Compétiteurs adultes',
    detail: 'à partir des 1/2 finales de Championnat de France et de Coupe de France (certificat valable 3 ans).',
  },
]

// Grille des cotisations — colonnes fidèles à la répartition FFME / club
const cotisations = [
  { cat: 'Baby — 4 à 6 ans', ffme: '47,50 €', ct21: '10 €', ligue: '3 €', club: '94,50 €', total: '155 €' },
  { cat: '< 18 ans — 1 séance', ffme: '47,50 €', ct21: '10 €', ligue: '3 €', club: '164,50 €', total: '225 €' },
  { cat: 'Adultes', ffme: '60 €', ct21: '10 €', ligue: '3 €', club: '167 €', total: '240 €' },
  { cat: 'Jeunes niveau 4 mousquetons / Compétition', hint: '1 séance club + 1 séance en salle extérieure privée', ffme: '47,50 €', ct21: '10 €', ligue: '3 €', club: '194,50 €', total: '255 €' },
  { cat: 'Adultes niveau 4 mousquetons / Compétition', hint: '1 séance club + 1 séance en salle extérieure privée', ffme: '60 €', ct21: '10 €', ligue: '3 €', club: '197 €', total: '270 €' },
]

const reductions = [
  '2ᵉ inscription d\'une même famille : −20 €',
  '3ᵉ inscription et plus : −40 €',
  'Étudiants, personnes en situation de handicap, demandeurs d\'emploi : −20 €',
]

const paiements = ['Chèques vacances', 'Coupons sport', 'Pass\'Sport', 'Aide CCAS', 'CAF']

const partenaires = [
  { name: 'CIME Altitude 245', url: 'https://www.cime-dijon.com/' },
  { name: 'Vertical Art Dijon', url: 'https://dijon.vertical-art.fr/' },
  { name: "Climb'Up Dijon", url: 'https://dijon.climb-up.fr/' },
]

// ─────────────────────────────────────────────────────────────────────────────
// Animations
// ─────────────────────────────────────────────────────────────────────────────

const badge = ref(null)
const title = ref(null)
const subtitle = ref(null)
const line = ref(null)

onMounted(async () => {
  // Pas d'animation si l'utilisateur préfère les animations réduites.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const [{ gsap }, { ScrollTrigger }] = await Promise.all([
    import('gsap'),
    import('gsap/ScrollTrigger'),
  ])
  gsap.registerPlugin(ScrollTrigger)

  if (badge.value) gsap.from(badge.value, { opacity: 0, y: 20, duration: 0.7, ease: 'power2.out' })
  // Le titre est le candidat LCP : glissement seul, jamais masqué.
  if (title.value) gsap.from(title.value, { y: 24, duration: 0.9, delay: 0.1, ease: 'power2.out' })
  if (subtitle.value) gsap.from(subtitle.value, { opacity: 0, y: 20, duration: 0.8, delay: 0.3, ease: 'power2.out' })
  if (line.value) gsap.from(line.value, { opacity: 0, width: 0, duration: 0.6, delay: 0.5, ease: 'power2.out' })

  gsap.utils.toArray('[data-reveal]').forEach((el) => {
    gsap.from(el, {
      opacity: 0,
      y: 40,
      duration: 0.7,
      ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 85%' },
    })
  })
})

useSeo({
  title: 'Inscriptions',
  description:
    `Inscriptions à l'ASC Escalade pour la saison ${SEASON} : dates des permanences au gymnase Boivin, documents à télécharger, informations de santé, assurance et tarifs des cotisations.`,
})
</script>

<template>
  <div class="bg-white">

    <!-- ═══════════════════════════ HERO ═══════════════════════════ -->
    <section class="relative pt-32 pb-16 md:pb-20 overflow-hidden">
      <div class="absolute inset-0 pointer-events-none">
        <svg class="absolute bottom-0 left-0 w-full h-[220px] text-gray-50" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path fill="currentColor" d="M0,160L60,181.3C120,203,240,245,360,240C480,235,600,181,720,181.3C840,181,960,235,1080,234.7C1200,235,1320,181,1380,154.7L1440,128L1440,320L0,320Z" />
        </svg>
      </div>

      <UContainer class="relative z-10 text-center">
        <div
          ref="badge"
          class="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#7FD857]/10 text-[#0F1729] font-bold text-sm md:text-base mb-6"
        >
          <UIcon name="i-heroicons-calendar-days" class="w-5 h-5 text-[#7FD857]" />
          Saison {{ SEASON }}
        </div>

        <h1 ref="title" class="text-4xl md:text-6xl font-extrabold text-[#0F1729] mb-4 uppercase tracking-tight">
          Inscriptions
        </h1>

        <p ref="subtitle" class="text-gray-500 text-lg md:text-xl font-medium max-w-2xl mx-auto mb-8">
          Rejoindre l'ASC Escalade se fait en présentiel, lors des permanences au gymnase Boivin.
          Voici tout ce qu'il faut préparer.
        </p>

        <div ref="line" class="h-1.5 bg-[#7FD857] rounded-full mx-auto" style="width: 64px" />

        <nav class="mt-10 flex flex-wrap justify-center gap-3">
          <a v-for="anchor in [
              { href: '#permanences', label: 'Dates' },
              { href: '#documents', label: 'Documents' },
              { href: '#sante', label: 'Santé' },
              { href: '#tarifs', label: 'Tarifs' },
            ]"
            :key="anchor.href"
            :href="anchor.href"
            class="px-4 py-2 rounded-full border border-gray-200 text-sm font-semibold text-gray-600 hover:border-[#7FD857] hover:text-[#0F1729] transition-colors"
          >
            {{ anchor.label }}
          </a>
        </nav>
      </UContainer>
    </section>

    <!-- ═══════════════════════ PERMANENCES ═══════════════════════ -->
    <section id="permanences" class="scroll-mt-28 bg-gray-50 py-16 md:py-24">
      <UContainer>
        <div class="max-w-2xl mx-auto text-center mb-12" data-reveal>
          <span class="text-[var(--vp-green-text)] font-bold uppercase tracking-wider text-sm">Étape 1</span>
          <h2 class="text-3xl md:text-4xl font-bold text-[#0F1729] mt-2">Les permanences d'inscription</h2>
        </div>

        <div class="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          <div
            v-for="p in permanences"
            :key="p.title"
            data-reveal
            class="bg-white rounded-3xl shadow-lg p-8 flex flex-col"
          >
            <div class="flex items-center gap-3 mb-5">
              <div class="w-12 h-12 rounded-2xl bg-[#7FD857]/15 flex items-center justify-center flex-shrink-0">
                <UIcon :name="p.icon" class="w-6 h-6 text-[#0F1729]" />
              </div>
              <span class="text-xs font-bold uppercase tracking-wider text-[var(--vp-green-text)]">{{ p.tag }}</span>
            </div>

            <h3 class="text-xl font-bold text-[#0F1729] mb-2">{{ p.title }}</h3>
            <p class="text-gray-500 text-sm mb-6 flex-grow">{{ p.audience }}</p>

            <dl class="space-y-2 text-sm">
              <div class="flex items-center gap-3">
                <UIcon name="i-heroicons-calendar" class="w-5 h-5 text-gray-400 flex-shrink-0" />
                <dd class="font-bold text-[#0F1729]">{{ p.date }} <span class="font-medium text-gray-500">— {{ p.hours }}</span></dd>
              </div>
              <div class="flex items-center gap-3">
                <UIcon name="i-heroicons-map-pin" class="w-5 h-5 text-gray-400 flex-shrink-0" />
                <dd class="font-medium text-gray-700">{{ p.place }}</dd>
              </div>
            </dl>
          </div>
        </div>

        <div data-reveal class="mt-6 max-w-5xl mx-auto flex items-start gap-3 rounded-2xl bg-[#0F1729] text-white p-5">
          <UIcon name="i-heroicons-flag" class="w-6 h-6 text-[#7FD857] flex-shrink-0" />
          <p class="text-sm md:text-base">
            <span class="font-bold">Reprise des entraînements</span> à compter du
            <span class="font-bold text-[#7FD857]">lundi 14 septembre 2026</span>.
          </p>
        </div>
      </UContainer>
    </section>

    <!-- ═══════════════════════ DOCUMENTS ═══════════════════════ -->
    <section id="documents" class="scroll-mt-28 py-16 md:py-24">
      <UContainer>
        <div class="max-w-2xl mx-auto text-center mb-12" data-reveal>
          <span class="text-[var(--vp-green-text)] font-bold uppercase tracking-wider text-sm">Étape 2</span>
          <h2 class="text-3xl md:text-4xl font-bold text-[#0F1729] mt-2">Les documents à préparer</h2>
          <p class="text-gray-500 mt-3">
            À compléter et à apporter le jour de l'inscription. Selon vos réponses au questionnaire de
            santé, l'attestation de santé suffit — le certificat médical n'est plus systématiquement obligatoire.
          </p>
        </div>

        <div class="grid lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
          <!-- Adultes -->
          <div data-reveal class="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8">
            <div class="flex items-center gap-3 mb-6">
              <div class="w-11 h-11 rounded-2xl bg-[#7FD857]/15 flex items-center justify-center flex-shrink-0">
                <UIcon name="i-heroicons-user" class="w-6 h-6 text-[#0F1729]" />
              </div>
              <h3 class="text-lg font-bold text-[#0F1729]">
                Adultes <span class="font-medium text-gray-400 text-sm">— 18 ans et +</span>
              </h3>
            </div>
            <ul class="space-y-3">
              <li v-for="doc in documentsAdulte" :key="doc.title">
                <a
                  :href="doc.href"
                  target="_blank"
                  rel="noopener"
                  class="group flex items-center gap-3 rounded-xl border border-gray-100 p-3 hover:border-[#7FD857] hover:bg-[#7FD857]/5 transition-colors"
                >
                  <UIcon :name="doc.icon" class="w-5 h-5 text-[#0F1729] flex-shrink-0" />
                  <span class="flex-1 min-w-0">
                    <span class="block text-sm font-bold text-[#0F1729]">{{ doc.title }}</span>
                    <span class="block text-xs text-gray-500">{{ doc.hint }}</span>
                  </span>
                  <UIcon name="i-heroicons-arrow-down-tray" class="w-4 h-4 text-gray-400 group-hover:text-[#7FD857] transition-colors flex-shrink-0" />
                </a>
              </li>
            </ul>
          </div>

          <!-- Mineurs -->
          <div data-reveal class="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8">
            <div class="flex items-center gap-3 mb-6">
              <div class="w-11 h-11 rounded-2xl bg-[#7FD857]/15 flex items-center justify-center flex-shrink-0">
                <UIcon name="i-heroicons-users" class="w-6 h-6 text-[#0F1729]" />
              </div>
              <h3 class="text-lg font-bold text-[#0F1729]">
                Mineurs <span class="font-medium text-gray-400 text-sm">— nés après le 31/08/2009</span>
              </h3>
            </div>
            <ul class="space-y-3">
              <li v-for="doc in documentsMineur" :key="doc.title">
                <a
                  :href="doc.href"
                  target="_blank"
                  rel="noopener"
                  class="group flex items-center gap-3 rounded-xl border border-gray-100 p-3 hover:border-[#7FD857] hover:bg-[#7FD857]/5 transition-colors"
                >
                  <UIcon :name="doc.icon" class="w-5 h-5 text-[#0F1729] flex-shrink-0" />
                  <span class="flex-1 min-w-0">
                    <span class="block text-sm font-bold text-[#0F1729]">{{ doc.title }}</span>
                    <span class="block text-xs text-gray-500">{{ doc.hint }}</span>
                  </span>
                  <UIcon name="i-heroicons-arrow-down-tray" class="w-4 h-4 text-gray-400 group-hover:text-[#7FD857] transition-colors flex-shrink-0" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <!-- Certificat médical — commun adultes / mineurs -->
        <div data-reveal class="max-w-5xl mx-auto mt-6">
          <a
            :href="certificatMedical.href"
            target="_blank"
            rel="noopener"
            class="group flex items-center gap-4 rounded-3xl border border-gray-100 bg-white shadow-sm p-6 hover:border-[#7FD857] hover:shadow-lg transition-all"
          >
            <div class="w-11 h-11 rounded-2xl bg-[#7FD857]/15 flex items-center justify-center flex-shrink-0">
              <UIcon :name="certificatMedical.icon" class="w-6 h-6 text-[#0F1729]" />
            </div>
            <span class="flex-1 min-w-0">
              <span class="block font-bold text-[#0F1729]">{{ certificatMedical.title }}</span>
              <span class="block text-xs text-gray-500">{{ certificatMedical.hint }}</span>
            </span>
            <span class="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0F1729] group-hover:text-[#7FD857] transition-colors flex-shrink-0">
              <UIcon name="i-heroicons-arrow-down-tray" class="w-4 h-4" />
              <span class="hidden sm:inline">Télécharger</span>
            </span>
          </a>
        </div>
      </UContainer>
    </section>

    <!-- ═══════════════════════ SANTÉ ═══════════════════════ -->
    <section id="sante" class="scroll-mt-28 bg-gray-50 py-16 md:py-24">
      <UContainer>
        <div class="max-w-2xl mx-auto text-center mb-12" data-reveal>
          <span class="text-[var(--vp-green-text)] font-bold uppercase tracking-wider text-sm">Informations de santé</span>
          <h2 class="text-3xl md:text-4xl font-bold text-[#0F1729] mt-2">Attestation de santé & certificat médical</h2>
        </div>

        <div class="grid lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
          <!-- Étape 1 -->
          <div data-reveal class="bg-white rounded-3xl shadow-lg p-8">
            <div class="flex items-center gap-3 mb-4">
              <span class="w-8 h-8 rounded-full bg-[#0F1729] text-white text-sm font-bold flex items-center justify-center">1</span>
              <h3 class="text-lg font-bold text-[#0F1729]">Selon le questionnaire de santé</h3>
            </div>
            <p class="text-sm text-gray-600 mb-4">
              Deux possibilités selon vos réponses (mineurs ou adultes) : <strong>l'attestation de santé</strong>
              — intégrée à la fiche d'inscription — <strong>ou un certificat médical</strong>.
            </p>
            <p class="text-sm rounded-xl bg-[#7FD857]/10 text-[#0F1729] p-3">
              Le certificat médical n'est pas obligatoire : il est remplacé par l'attestation de santé.
              Il reste exigé, et à présenter lors de l'inscription, dans deux cas :
            </p>

            <div class="mt-4 space-y-3">
              <div v-for="cas in certificatCas" :key="cas.num" class="border border-gray-100 rounded-xl p-4">
                <span class="text-xs font-bold uppercase tracking-wider text-[var(--vp-green-text)]">{{ cas.num }}</span>
                <p class="font-semibold text-[#0F1729] text-sm mt-1">{{ cas.title }}</p>
                <p class="text-xs text-gray-500 mt-1">{{ cas.detail }}</p>
              </div>
            </div>
          </div>

          <!-- Étape 2 -->
          <div data-reveal class="bg-white rounded-3xl shadow-lg p-8 flex flex-col">
            <div class="flex items-center gap-3 mb-4">
              <span class="w-8 h-8 rounded-full bg-[#0F1729] text-white text-sm font-bold flex items-center justify-center">2</span>
              <h3 class="text-lg font-bold text-[#0F1729]">Renseigner ses informations sur myFFME</h3>
            </div>
            <p class="text-sm text-gray-600 flex-grow">
              Le licencié doit obligatoirement saisir ses informations de santé (attestation de santé ou
              téléchargement du certificat médical) sur le site de la fédération, après avoir reçu par mail
              de la FFME le lien pour visualiser et télécharger sa licence.
            </p>
            <UButton
              to="https://app.myffme.fr/authentification"
              target="_blank"
              trailing-icon="i-heroicons-arrow-top-right-on-square"
              size="lg"
              class="mt-6 self-start bg-[#0F1729] hover:bg-[#1a2740] text-white font-bold"
            >
              Accéder à myFFME
            </UButton>
          </div>
        </div>
      </UContainer>
    </section>

    <!-- ═══════════════════════ ASSURANCE & RÈGLEMENT ═══════════════════════ -->
    <section class="py-16 md:py-24">
      <UContainer>
        <div class="grid lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
          <div data-reveal class="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
            <div class="w-12 h-12 rounded-2xl bg-[#7FD857]/15 flex items-center justify-center mb-5">
              <UIcon name="i-heroicons-shield-check" class="w-6 h-6 text-[#0F1729]" />
            </div>
            <h3 class="text-xl font-bold text-[#0F1729] mb-3">Assurance</h3>
            <p class="text-sm text-gray-600 mb-4">
              Le club souscrit au nom de l'adhérent une <strong>assurance responsabilité civile</strong>
              obligatoire, incluse dans le montant de l'adhésion. Pour ajouter une garantie complémentaire
              (garantie corporelle, assistance, ski…), précisez-le lors de l'adhésion ou complétez le
              bulletin d'adhésion n° 1.
            </p>
            <div class="flex flex-wrap gap-3">
              <a href="/documents/bulletin-adhesion-1-assurance.pdf" target="_blank" rel="noopener"
                class="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0F1729] hover:text-[#7FD857] transition-colors">
                <UIcon name="i-heroicons-document-arrow-down" class="w-4 h-4" /> Bulletin d'adhésion n° 1
              </a>
              <a href="/documents/notice-information-assurance-ffme.pdf" target="_blank" rel="noopener"
                class="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0F1729] hover:text-[#7FD857] transition-colors">
                <UIcon name="i-heroicons-document-arrow-down" class="w-4 h-4" /> Notice d'information FFME
              </a>
            </div>
          </div>

          <div data-reveal class="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 flex flex-col">
            <div class="w-12 h-12 rounded-2xl bg-[#7FD857]/15 flex items-center justify-center mb-5">
              <UIcon name="i-heroicons-book-open" class="w-6 h-6 text-[#0F1729]" />
            </div>
            <h3 class="text-xl font-bold text-[#0F1729] mb-3">Règlement intérieur</h3>
            <p class="text-sm text-gray-600 flex-grow">
              Merci de prendre connaissance du règlement intérieur du club (et de l'affiche
              « falaise ») lors de votre adhésion.
            </p>
            <UButton
              to="/documents/reglement-interieur-escalade.pdf"
              external
              target="_blank"
              rel="noopener"
              variant="outline"
              size="lg"
              trailing-icon="i-heroicons-arrow-top-right-on-square"
              class="mt-6 self-start border-[#0F1729] text-[#0F1729] hover:bg-[#0F1729] hover:text-white font-bold"
            >
              Lire le règlement
            </UButton>
          </div>
        </div>
      </UContainer>
    </section>

    <!-- ═══════════════════════ TARIFS ═══════════════════════ -->
    <section id="tarifs" class="scroll-mt-28 bg-gray-50 py-16 md:py-24">
      <UContainer>
        <div class="max-w-2xl mx-auto text-center mb-4" data-reveal>
          <span class="text-[var(--vp-green-text)] font-bold uppercase tracking-wider text-sm">Cotisations {{ SEASON }}</span>
          <h2 class="text-3xl md:text-4xl font-bold text-[#0F1729] mt-2">Tarifs des cotisations</h2>
          <p class="text-gray-500 mt-3">
            Tarifs votés lors de l'assemblée générale du club du 29 juin 2026.
          </p>
        </div>

        <div data-reveal class="max-w-5xl mx-auto overflow-x-auto rounded-3xl shadow-lg bg-white">
          <table class="w-full min-w-[720px] text-sm">
            <thead>
              <tr class="bg-[#0F1729] text-white text-left">
                <th class="px-5 py-4 font-bold">Catégorie</th>
                <th class="px-4 py-4 font-semibold text-center">Licence FFME<br><span class="font-normal text-white/60 text-xs">+ assurance</span></th>
                <th class="px-4 py-4 font-semibold text-center">CT21<br><span class="font-normal text-white/60 text-xs">FFME</span></th>
                <th class="px-4 py-4 font-semibold text-center">Ligue<br><span class="font-normal text-white/60 text-xs">FFME</span></th>
                <th class="px-4 py-4 font-semibold text-center">Cotisation<br><span class="font-normal text-white/60 text-xs">club</span></th>
                <th class="px-5 py-4 font-bold text-center bg-[#7FD857] text-[#0F1729]">Total<br>adhérent</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, i) in cotisations" :key="row.cat" :class="i % 2 ? 'bg-gray-50/60' : 'bg-white'">
                <td class="px-5 py-4">
                  <div class="font-bold text-[#0F1729]">{{ row.cat }}</div>
                  <div v-if="row.hint" class="text-xs text-gray-500 mt-0.5">{{ row.hint }}</div>
                </td>
                <td class="px-4 py-4 text-center text-gray-700">{{ row.ffme }}</td>
                <td class="px-4 py-4 text-center text-gray-700">{{ row.ct21 }}</td>
                <td class="px-4 py-4 text-center text-gray-700">{{ row.ligue }}</td>
                <td class="px-4 py-4 text-center text-gray-700">{{ row.club }}</td>
                <td class="px-5 py-4 text-center font-black text-[#0F1729] bg-[#7FD857]/10">{{ row.total }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p class="max-w-5xl mx-auto text-center text-xs text-gray-500 mt-3" data-reveal>
          La licence est prise en charge à 100 % par le club. Elle comprend une assurance responsabilité
          civile couvrant les activités au sein du club, ainsi qu'un tee-shirt du club pour les jeunes de
          moins de 18 ans.
        </p>

        <!-- Réductions / paiement -->
        <div class="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto mt-10">
          <div data-reveal class="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
            <h3 class="flex items-center gap-2 text-lg font-bold text-[#0F1729] mb-4">
              <UIcon name="i-heroicons-tag" class="w-5 h-5 text-[#7FD857]" /> Réductions
            </h3>
            <ul class="space-y-3">
              <li v-for="r in reductions" :key="r" class="flex items-start gap-3 text-sm text-gray-600">
                <UIcon name="i-heroicons-check" class="w-5 h-5 text-[#7FD857] flex-shrink-0" />
                {{ r }}
              </li>
            </ul>
          </div>

          <div data-reveal class="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
            <h3 class="flex items-center gap-2 text-lg font-bold text-[#0F1729] mb-4">
              <UIcon name="i-heroicons-credit-card" class="w-5 h-5 text-[#7FD857]" /> Modalités de paiement
            </h3>
            <p class="text-sm text-gray-600 mb-4">
              La cotisation est exigible dès l'inscription. Paiement échelonné possible en 3 fois maximum.
            </p>
            <div class="flex flex-wrap gap-2">
              <span v-for="mode in paiements" :key="mode"
                class="px-3 py-1.5 rounded-full bg-[#7FD857]/10 text-[#0F1729] text-xs font-semibold">
                {{ mode }}
              </span>
            </div>
          </div>
        </div>
      </UContainer>
    </section>

    <!-- ═══════════════════════ CRÉNEAUX & GROUPES ═══════════════════════ -->
    <section class="py-16 md:py-24">
      <UContainer>
        <div class="grid lg:grid-cols-2 gap-6 max-w-5xl mx-auto items-stretch">
          <div data-reveal class="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 flex flex-col">
            <h3 class="text-xl font-bold text-[#0F1729] mb-3">Groupes & créneaux horaires</h3>
            <p class="text-sm text-gray-600 flex-grow">
              Les créneaux des enfants sont établis par groupes de niveaux et peuvent être ajustés au
              moment des inscriptions selon le nombre de nouveaux inscrits par âge. Retrouvez le détail
              de tous les créneaux adultes et enfants sur la page Tarifs & cours.
            </p>
            <UButton
              to="/tarifs#creneaux"
              size="lg"
              trailing-icon="i-heroicons-arrow-right"
              class="mt-6 self-start bg-[#7FD857] hover:bg-[#6bc546] text-[#0F1729] font-bold"
            >
              Voir tous les créneaux
            </UButton>
          </div>

          <div data-reveal class="bg-[#0F1729] rounded-3xl shadow-lg p-8 text-white flex flex-col">
            <h3 class="text-xl font-bold mb-3">Groupes « Entraînement » & compétition</h3>
            <p class="text-sm text-white/80 flex-grow">
              L'objectif de ces groupes est de progresser dans la discipline en suivant un programme
              (physique, technique, tactique, mental) — ce ne sont pas des séances d'escalade libre.
              Le club a passé une convention avec des salles partenaires pour proposer une préparation
              adaptée à la compétition :
            </p>
            <ul class="mt-4 space-y-2">
              <li v-for="s in partenaires" :key="s.name">
                <a :href="s.url" target="_blank" rel="noopener"
                  class="inline-flex items-center gap-1.5 text-sm font-semibold text-[#7FD857] hover:underline">
                  <UIcon name="i-heroicons-arrow-top-right-on-square" class="w-4 h-4" /> {{ s.name }}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </UContainer>
    </section>

    <!-- ═══════════════════════ CTA CONTACT ═══════════════════════ -->
    <section class="pb-20">
      <UContainer>
        <div data-reveal class="max-w-5xl mx-auto bg-[#0F1729] rounded-3xl p-10 md:p-14 text-center">
          <h2 class="text-2xl md:text-3xl font-bold text-white mb-3">Une question sur l'inscription ?</h2>
          <p class="text-white/70 mb-8 max-w-xl mx-auto">
            L'équipe du club vous répond et vous accompagne dans vos démarches.
          </p>
          <UButton
            to="/contact"
            size="xl"
            icon="i-heroicons-envelope"
            class="bg-[#7FD857] hover:bg-[#6bc546] text-[#0F1729] font-bold"
          >
            Nous contacter
          </UButton>
        </div>
      </UContainer>
    </section>

  </div>
</template>
