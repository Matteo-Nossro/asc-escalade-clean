import { defineField, defineType } from 'sanity'

export default defineType({
    name: 'tarif',
    title: 'Tarifs',
    type: 'document',
    fields: [
        defineField({
            name: 'name',
            title: 'Nom de la formule',
            type: 'string',
            validation: Rule => Rule.required()
        }),
        defineField({
            name: 'price',
            title: 'Prix (€)',
            type: 'number',
            validation: Rule => Rule.required().min(0)
        }),
        defineField({
            name: 'period',
            title: 'Période',
            type: 'string',
            options: {
                list: [
                    { title: 'Par an', value: 'par an' },
                    { title: 'Par mois', value: 'par mois' },
                    { title: 'Par trimestre', value: 'par trimestre' },
                    { title: 'Unique', value: 'unique' }
                ]
            }
        }),
        defineField({
            name: 'description',
            title: 'Description',
            type: 'text',
            rows: 3
        }),
        defineField({
            name: 'features',
            title: 'Avantages inclus',
            type: 'array',
            of: [{ type: 'string' }]
        }),
        defineField({
            name: 'popular',
            title: 'Formule populaire',
            type: 'boolean',
            initialValue: false
        }),
        defineField({
            name: 'order',
            title: 'Ordre d\'affichage',
            type: 'number',
            validation: Rule => Rule.required()
        })
    ],
    orderings: [
        {
            title: 'Ordre',
            name: 'orderAsc',
            by: [{ field: 'order', direction: 'asc' }]
        }
    ]
})
