import { defineField, defineType } from 'sanity'

export default defineType({
    name: 'homePage',
    title: 'Page d\'accueil',
    type: 'document',

    // Important : un seul document pour cette page
    __experimental_actions: ['update', 'publish'],

    fields: [
        // SECTION HERO
        defineField({
            name: 'hero',
            title: 'Section Hero',
            type: 'object',
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
                    rows: 3,
                    initialValue: 'Rejoignez une communauté passionnée. Mur, falaise, bloc - quel que soit votre niveau, l\'ASC Escalade est votre point de départ.'
                },
                {
                    name: 'backgroundImage',
                    title: 'Image de fond',
                    type: 'image',
                    options: {
                        hotspot: true
                    }
                }
            ]
        }),

        // SECTION À PROPOS
        defineField({
            name: 'about',
            title: 'Section À propos',
            type: 'object',
            fields: [
                {
                    name: 'title',
                    title: 'Titre',
                    type: 'string',
                    initialValue: 'Vertical Pulse'
                },
                {
                    name: 'subtitle',
                    title: 'Sous-titre',
                    type: 'string',
                    initialValue: 'Votre club d\'escalade à Dijon'
                },
                {
                    name: 'description',
                    title: 'Description',
                    type: 'array',
                    of: [{ type: 'block' }]
                },
                {
                    name: 'image',
                    title: 'Image',
                    type: 'image',
                    options: {
                        hotspot: true
                    }
                },
                {
                    name: 'stats',
                    title: 'Statistiques',
                    type: 'array',
                    of: [{
                        type: 'object',
                        fields: [
                            { name: 'number', title: 'Nombre', type: 'string' },
                            { name: 'label', title: 'Label', type: 'string' }
                        ]
                    }]
                }
            ]
        }),

        // SECTION VALEURS
        defineField({
            name: 'values',
            title: 'Nos valeurs',
            type: 'object',
            fields: [
                {
                    name: 'title',
                    title: 'Titre',
                    type: 'string',
                    initialValue: 'Nos Valeurs'
                },
                {
                    name: 'items',
                    title: 'Valeurs',
                    type: 'array',
                    of: [{
                        type: 'object',
                        fields: [
                            {
                                name: 'icon',
                                title: 'Icône',
                                type: 'string',
                                description: 'Ex: i-heroicons-users, i-heroicons-heart'
                            },
                            { name: 'title', title: 'Titre', type: 'string' },
                            { name: 'description', title: 'Description', type: 'text', rows: 3 }
                        ],
                        preview: {
                            select: {
                                title: 'title',
                                subtitle: 'description'
                            }
                        }
                    }]
                }
            ]
        }),

        // SECTION PROCHAINES SORTIES
        defineField({
            name: 'upcomingSorties',
            title: 'Prochaines sorties',
            type: 'object',
            fields: [
                {
                    name: 'title',
                    title: 'Titre',
                    type: 'string',
                    initialValue: 'Prochaines Sorties'
                },
                {
                    name: 'subtitle',
                    title: 'Sous-titre',
                    type: 'string',
                    initialValue: 'Rejoignez-nous pour nos prochaines aventures'
                },
                {
                    name: 'limit',
                    title: 'Nombre de sorties affichées',
                    type: 'number',
                    initialValue: 3,
                    validation: Rule => Rule.min(1).max(6)
                }
            ]
        }),

        // SECTION ACTUALITÉS
        defineField({
            name: 'actualites',
            title: 'Actualités',
            type: 'object',
            fields: [
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
                }
            ]
        }),

        // SECTION TARIFS
        defineField({
            name: 'pricing',
            title: 'Section Tarifs',
            type: 'object',
            fields: [
                {
                    name: 'title',
                    title: 'Titre',
                    type: 'string',
                    initialValue: 'Nos Tarifs'
                },
                {
                    name: 'subtitle',
                    title: 'Sous-titre',
                    type: 'string',
                    initialValue: 'Des formules adaptées à tous'
                }
            ]
        }),

        // SECTION CTA
        defineField({
            name: 'cta',
            title: 'Call to Action',
            type: 'object',
            fields: [
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
                }
            ]
        })
    ],

    preview: {
        prepare() {
            return {
                title: 'Page d\'accueil'
            }
        }
    }
})
