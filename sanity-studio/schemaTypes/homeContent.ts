import { defineField, defineType } from 'sanity'

export default defineType({
    name: 'homeContent',
    title: 'Contenu Page d\'accueil',
    type: 'document',

    // Un seul document
    __experimental_actions: ['update', 'publish'],

    groups: [
        { name: 'hero', title: 'Hero' },
        { name: 'actualites', title: 'Actualités' },
        { name: 'evenements', title: 'Événements' },
        { name: 'cta', title: 'Call to Action' }
    ],

    fields: [
        // HERO
        defineField({
            name: 'hero',
            title: 'Section Hero',
            type: 'object',
            group: 'hero',
            fields: [
                {
                    name: 'surtitle',
                    title: 'Sur-titre',
                    type: 'string',
                    initialValue: 'Club d\'escalade de Chevigny-saint-sauveur'
                },
                {
                    name: 'title',
                    title: 'Titre principal',
                    type: 'string',
                    initialValue: 'GRIMPEZ VERS DE NOUVEAUX SOMMETS'
                },
                {
                    name: 'subtitle',
                    title: 'Sous-titre',
                    type: 'text',
                    rows: 3
                },
                {
                    name: 'backgroundImage',
                    title: 'Image de fond',
                    type: 'image',
                    options: { hotspot: true }
                },
                {
                    name: 'primaryButtonText',
                    title: 'Texte bouton principal',
                    type: 'string',
                    initialValue: 'Rejoindre le club'
                },
                {
                    name: 'primaryButtonLink',
                    title: 'Lien bouton principal',
                    type: 'string',
                    initialValue: '/club'
                },
                {
                    name: 'secondaryButtonText',
                    title: 'Texte bouton secondaire',
                    type: 'string',
                    initialValue: 'Découvrir les sorties'
                },
                {
                    name: 'secondaryButtonLink',
                    title: 'Lien bouton secondaire',
                    type: 'string',
                    initialValue: '/sorties'
                }
            ]
        }),

        // ACTUALITÉS
        defineField({
            name: 'actualites',
            title: 'Section Actualités',
            type: 'object',
            group: 'actualites',
            fields: [
                {
                    name: 'enabled',
                    title: 'Afficher cette section',
                    type: 'boolean',
                    initialValue: true
                },
                {
                    name: 'title',
                    title: 'Titre',
                    type: 'string',
                    initialValue: 'Actualités'
                },
                {
                    name: 'subtitle',
                    title: 'Sous-titre',
                    type: 'string',
                    initialValue: 'Suivez les dernières nouvelles du club'
                },
                {
                    name: 'limit',
                    title: 'Nombre d\'articles affichés',
                    type: 'number',
                    initialValue: 3,
                    validation: Rule => Rule.min(1).max(6)
                }
            ]
        }),

        // ÉVÉNEMENTS
        defineField({
            name: 'evenements',
            title: 'Section Événements',
            type: 'object',
            group: 'evenements',
            fields: [
                {
                    name: 'enabled',
                    title: 'Afficher cette section',
                    type: 'boolean',
                    initialValue: true
                },
                {
                    name: 'title',
                    title: 'Titre',
                    type: 'string',
                    initialValue: 'Prochains Événements'
                },
                {
                    name: 'subtitle',
                    title: 'Sous-titre',
                    type: 'string',
                    initialValue: 'Rejoignez-nous pour nos prochaines aventures'
                },
                {
                    name: 'limit',
                    title: 'Nombre d\'événements affichés',
                    type: 'number',
                    initialValue: 3,
                    validation: Rule => Rule.min(1).max(6)
                }
            ]
        }),

        // CTA
        defineField({
            name: 'cta',
            title: 'Call to Action',
            type: 'object',
            group: 'cta',
            fields: [
                {
                    name: 'enabled',
                    title: 'Afficher cette section',
                    type: 'boolean',
                    initialValue: true
                },
                {
                    name: 'title',
                    title: 'Titre',
                    type: 'string',
                    initialValue: 'Prêt à commencer l\'aventure ?'
                },
                {
                    name: 'subtitle',
                    title: 'Sous-titre',
                    type: 'text',
                    rows: 2,
                    initialValue: 'Rejoignez notre communauté de grimpeurs passionnés'
                },
                {
                    name: 'buttonText',
                    title: 'Texte du bouton',
                    type: 'string',
                    initialValue: 'Nous rejoindre'
                },
                {
                    name: 'buttonLink',
                    title: 'Lien du bouton',
                    type: 'string',
                    initialValue: '/contact'
                },
                {
                    name: 'backgroundImage',
                    title: 'Image de fond',
                    type: 'image',
                    options: { hotspot: true }
                }
            ]
        })
    ],

    preview: {
        prepare() {
            return {
                title: 'Contenu Page d\'accueil'
            }
        }
    }
})
