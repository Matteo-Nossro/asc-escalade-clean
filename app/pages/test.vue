<template>
	<div class="p-8">
		<h1 class="text-3xl font-bold mb-6">Test Nuxt UI</h1>

		<!-- Avant / Après -->
		<before-after :blok="beforeAfterBlok" />

		<!-- Timeline historique -->
		<club-timeline :blok="timelineBlok" />

		Groupe d'accordéon
		<GroupsAccordion/>

		<div class="space-y-4">
			<UButton color="primary" size="lg">
				Bouton Primary
			</UButton>

			<UButton color="black" icon="i-heroicons-user">
				Bouton avec icône
			</UButton>

			<UInput placeholder="Test input" />

			<UCard>
				<template #header>
					<h3 class="font-bold">Test Card</h3>
				</template>
				<p>Si vous voyez cette carte stylisée, Nuxt UI fonctionne !</p>
			</UCard>
		</div>
	</div>
</template>
<script setup lang="ts">
const beforeAfterBlok = {
	_editable: '',
	title: 'Avant / Après — Nouveau mur 2013',
	subtitle: 'Faites glisser pour comparer l\'ancien et le nouveau mur d\'escalade',
	label_before: 'Avant 2013',
	label_after: 'Après 2013',
	aspect_ratio: '16/9',
	image_before: {
		filename: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=1920&q=80',
		alt: 'Ancienne salle d\'escalade'
	},
	image_after: {
		filename: 'https://images.unsplash.com/photo-1522163182402-834f871fd851?w=1920&q=80',
		alt: 'Nouvelle salle d\'escalade'
	}
}

const timelineBlok = {
	_editable: '',
	eyebrow: 'Depuis le début',
	title: 'Notre Histoire',
	steps: [
	 {
            _uid: '1',
            title: 'Naissance de l\'ASC',
            date: '1962',
            annotation: 'les origines...',
            description: 'Création de l\'Association Sportive et Culturelle de Chevigny-Saint-Sauveur sous l\'impulsion de la Mairie. Le terreau de tout ce qui allait suivre.',
            image: { filename: 'https://pplx-res.cloudinary.com/image/upload/pplx_search_images/6e96391ebfa8c5fd5fae0d8460549eb7dc6f3724.jpg', alt: '' }
        },
        {
            _uid: '2',
            title: 'Gymnase Jean-Marc Boivin',
            date: '1992',
            annotation: 'notre terrain de jeu !',
            description: 'Construction du gymnase Boivin avec une SAE d\'origine : prises vissées sur béton banché et structure préfabriquée légèrement déversante.',
            image: { filename: 'https://pplx-res.cloudinary.com/image/upload/pplx_search_images/08b2a945cf114134ea8acfaaf04d030fda9f5249.jpg', alt: '' }
        },
        {
            _uid: '3',
            title: 'Création de l\'ASC Escalade',
            date: '1998',
            annotation: 'les débuts...',
            description: 'La section escalade voit le jour au sein de l\'ASC. Un professionnel Brevet d\'État assure l\'encadrement dès l\'origine à hauteur de 6h30 hebdomadaires.',
            image: { filename: 'https://pplx-res.cloudinary.com/image/upload/pplx_search_images/024d82a4ff18281a48ab4abb0d5642499e740281.jpg', alt: '' }
        },
        {
            _uid: '4',
            title: 'Nouvelle équipe dirigeante',
            date: '2001',
            annotation: '',
            description: 'Patrick Berger prend la présidence du club, accompagné du trésorier Dominique Carillon. Une équipe toujours en place plus de 20 ans après.',
            image: { filename: 'https://pplx-res.cloudinary.com/image/upload/pplx_search_images/9e5500f3c3451e8e8b790721221a724112fe3cbe.jpg', alt: '' }
        },
        {
            _uid: '5',
            title: 'Affiliation FFME',
            date: '2004',
            annotation: 'officiellement reconnus !',
            description: 'Affiliation officielle à la Fédération Française de la Montagne et de l\'Escalade. Tous les adhérents sont désormais licenciés FFME.',
            image: { filename: 'https://pplx-res.cloudinary.com/image/upload/pplx_search_images/f813ddea69a30c655934f8f0bbb071fd43451635.jpg', alt: '' }
        },
        {
            _uid: '6',
            title: 'Accueil dès 5 ans',
            date: '2006',
            annotation: 'les petits grimpeurs !',
            description: 'Le club ouvre ses portes aux enfants dès 5 ans — l\'un des premiers clubs de Côte-d\'Or à le faire. La Mairie finance également la rénovation de l\'inclinaison du mur.',
            image: { filename: 'https://pplx-res.cloudinary.com/image/upload/pplx_search_images/024d82a4ff18281a48ab4abb0d5642499e740281.jpg', alt: '' }
        },
        {
            _uid: '7',
            title: 'Professionnalisation',
            date: '2007',
            annotation: '',
            description: 'Une grimpeure issue du club est accompagnée vers un contrat d\'aide à l\'emploi avec formation diplômante Brevet d\'État, structurant durablement l\'encadrement.',
            image: { filename: 'https://pplx-res.cloudinary.com/image/upload/pplx_search_images/82adb65287ab76236cb45c0e258cd86ed4b12e89.jpg', alt: '' }
        },
        {
            _uid: '8',
            title: 'Groupement GRIMPE 21',
            date: '2008',
            annotation: '',
            description: 'Adhésion au groupement d\'employeurs GRIMPE 21, permettant à l\'encadrante de finaliser sa formation et garantissant une qualité d\'encadrement pérenne.',
            image: { filename: 'https://pplx-res.cloudinary.com/image/upload/pplx_search_images/6e96391ebfa8c5fd5fae0d8460549eb7dc6f3724.jpg', alt: '' }
        },
        {
            _uid: '9',
            title: 'Double label FFME',
            date: '2009',
            annotation: 'la qualité reconnue !',
            description: 'Obtention du double label FFME : club affilié et école d\'escalade. Les bénévoles remplacent aussi les plaques préformées par des panneaux bois plus techniques.',
            image: { filename: 'https://pplx-res.cloudinary.com/image/upload/pplx_search_images/08b2a945cf114134ea8acfaaf04d030fda9f5249.jpg', alt: '' }
        },
        {
            _uid: '10',
            title: 'Ouverture aux scolaires & IME',
            date: '2009',
            annotation: 'l\'escalade pour tous',
            description: 'Conventions signées avec le lycée et le collège de Chevigny, puis avec l\'IME pour l\'accueil de jeunes en situation de handicap sur le site.',
            image: { filename: 'https://pplx-res.cloudinary.com/image/upload/pplx_search_images/f813ddea69a30c655934f8f0bbb071fd43451635.jpg', alt: '' }
        },
        {
            _uid: '11',
            title: 'Remise en conformité',
            date: '2010',
            annotation: '',
            description: 'Remise en conformité des points d\'ancrage et création de deux nouvelles voies, avec le soutien financier du Conseil Régional de Bourgogne.',
            image: { filename: 'https://pplx-res.cloudinary.com/image/upload/pplx_search_images/9e5500f3c3451e8e8b790721221a724112fe3cbe.jpg', alt: '' }
        },
        {
            _uid: '12',
            title: 'Inauguration du nouveau mur',
            date: '2013',
            annotation: 'plus de 10 ans de projet !',
            description: 'Le nouveau mur est inauguré au gymnase Boivin — accessible à tous, valides et non-valides. Financé par le Conseil Régional, la Mairie, la Fondation Prévadies et le club.',
            image: { filename: 'https://pplx-res.cloudinary.com/image/upload/pplx_search_images/acb7ef83d66df75d0f3dba7b77e32dca74b6995a.jpg', alt: '' }
        },
	]
}
</script>