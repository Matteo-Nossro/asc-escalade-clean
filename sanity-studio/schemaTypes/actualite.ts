import { defineField, defineType } from 'sanity'

export default defineType({
    name: 'actualite',
    title: 'Actualités',
    type: 'document',
    fields: [
        defineField({
            name: 'title',
            title: 'Titre',
            type: 'string',
            validation: Rule => Rule.required()
        }),
        defineField({
            name: 'slug',
            title: 'Slug',
            type: 'slug',
            options: {
                source: 'title',
                maxLength: 96
            },
            validation: Rule => Rule.required()
        }),
        defineField({
            name: 'excerpt',
            title: 'Extrait',
            type: 'text',
            rows: 3,
            validation: Rule => Rule.required().max(200)
        }),
        defineField({
            name: 'image',
            title: 'Image de couverture',
            type: 'image',
            options: {
                hotspot: true
            },
            validation: Rule => Rule.required()
        }),
        defineField({
            name: 'category',
            title: 'Catégorie',
            type: 'string',
            options: {
                list: [
                    { title: 'Infrastructure', value: 'Infrastructure' },
                    { title: 'Compétition', value: 'Compétition' },
                    { title: 'Événement', value: 'Événement' },
                    { title: 'Club', value: 'Club' },
                    { title: 'Formation', value: 'Formation' },
                    { title: 'Sortie Falaise', value: 'Sortie Falaise' },
                    { title: 'Partenariat', value: 'Partenariat' }
                ]
            },
            validation: Rule => Rule.required()
        }),
        defineField({
            name: 'content',
            title: 'Contenu',
            type: 'array',
            of: [
                {
                    type: 'block'
                },
                {
                    type: 'image',
                    options: {
                        hotspot: true
                    }
                }
            ]
        }),
        defineField({
            name: 'featured',
            title: 'Article à la une',
            type: 'boolean',
            initialValue: false
        }),
        defineField({
            name: 'published',
            title: 'Publié',
            type: 'boolean',
            initialValue: true
        }),
        defineField({
            name: 'publishedAt',
            title: 'Date de publication',
            type: 'datetime',
            validation: Rule => Rule.required()
        })
    ],
    preview: {
        select: {
            title: 'title',
            media: 'image',
            subtitle: 'category'
        }
    }
})
