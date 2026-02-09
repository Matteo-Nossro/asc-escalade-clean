import { defineField, defineType } from 'sanity'

export default defineType({
    name: 'sortie',
    title: 'Sorties',
    type: 'document',
    groups: [
        { name: 'info', title: 'Informations' },
        { name: 'details', title: 'Détails' },
        { name: 'logistique', title: 'Logistique' }
    ],
    fields: [
        defineField({
            name: 'title',
            title: 'Titre de la sortie',
            type: 'string',
            group: 'info',
            validation: (Rule) => Rule.required()
        }),
        defineField({
            name: 'slug',
            title: 'Slug',
            type: 'slug',
            group: 'info',
            options: {
                source: 'title',
                maxLength: 96
            },
            validation: (Rule) => Rule.required()
        }),
        defineField({
            name: 'description',
            title: 'Description',
            type: 'text',
            rows: 4,
            group: 'info',
            validation: (Rule) => Rule.required()
        }),
        defineField({
            name: 'image',
            title: 'Image principale',
            type: 'image',
            group: 'info',
            options: {
                hotspot: true
            },
            fields: [
                {
                    name: 'alt',
                    title: 'Texte alternatif',
                    type: 'string'
                }
            ],
            validation: (Rule) => Rule.required()
        }),
        defineField({
            name: 'date',
            title: 'Date et heure de la sortie',
            type: 'datetime',
            group: 'logistique',
            validation: (Rule) => Rule.required()
        }),
        defineField({
            name: 'location',
            title: 'Lieu',
            type: 'string',
            group: 'logistique',
            placeholder: 'Ex: Falaise de Saffres',
            validation: (Rule) => Rule.required()
        }),
        defineField({
            name: 'meetingPoint',
            title: 'Point de rendez-vous',
            type: 'string',
            group: 'logistique',
            placeholder: 'Ex: Parking du gymnase',
            validation: (Rule) => Rule.required()
        }),
        defineField({
            name: 'meetingTime',
            title: 'Heure de rendez-vous',
            type: 'string',
            group: 'logistique',
            placeholder: 'Ex: 08h00',
            validation: (Rule) => Rule.required()
        }),
        defineField({
            name: 'difficulty',
            title: 'Niveau requis',
            type: 'string',
            group: 'details',
            options: {
                list: [
                    { title: '🟢 Débutant', value: 'Débutant' },
                    { title: '🔵 Intermédiaire', value: 'Intermédiaire' },
                    { title: '🔴 Avancé', value: 'Avancé' },
                    { title: '⚫ Expert', value: 'Expert' }
                ],
                layout: 'radio'
            },
            validation: (Rule) => Rule.required()
        }),
        defineField({
            name: 'duration',
            title: 'Durée',
            type: 'string',
            group: 'details',
            placeholder: 'Ex: Journée complète',
            validation: (Rule) => Rule.required()
        }),
        defineField({
            name: 'maxParticipants',
            title: 'Nombre max de participants',
            type: 'number',
            group: 'details',
            validation: (Rule) => Rule.required().min(1).max(50)
        }),
        defineField({
            name: 'price',
            title: 'Prix (€)',
            type: 'number',
            group: 'details',
            validation: (Rule) => Rule.required().min(0)
        }),
        defineField({
            name: 'equipment',
            title: 'Équipement nécessaire',
            type: 'array',
            group: 'details',
            of: [{ type: 'string' }],
            description: 'Liste de l\'équipement à prévoir'
        }),
        defineField({
            name: 'program',
            title: 'Programme détaillé',
            type: 'array',
            group: 'details',
            of: [
                { type: 'block' },
                {
                    type: 'image',
                    options: { hotspot: true }
                }
            ]
        }),
        defineField({
            name: 'published',
            title: 'Publié',
            type: 'boolean',
            description: 'Visible sur le site',
            initialValue: true
        }),
        defineField({
            name: 'featured',
            title: 'Sortie à la une',
            type: 'boolean',
            description: 'Mise en avant sur la page d\'accueil',
            initialValue: false
        })
    ],
    preview: {
        select: {
            title: 'title',
            subtitle: 'location',
            media: 'image',
            date: 'date'
        },
        prepare({ title, subtitle, media, date }) {
            return {
                title,
                subtitle: `${subtitle} • ${new Date(date).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                })}`,
                media
            }
        }
    },
    orderings: [
        {
            title: 'Date (plus proche)',
            name: 'dateAsc',
            by: [{ field: 'date', direction: 'asc' }]
        },
        {
            title: 'Date (plus éloignée)',
            name: 'dateDesc',
            by: [{ field: 'date', direction: 'desc' }]
        }
    ]
})
