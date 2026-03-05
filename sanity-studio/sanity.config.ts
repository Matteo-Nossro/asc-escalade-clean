import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'
import { presentationTool } from 'sanity/presentation' // ← Import depuis 'sanity/presentation'

export default defineConfig({
    name: 'default',
    title: 'Asc Escalade',

    projectId: 'l2rphl1o',
    dataset: 'production',

    plugins: [
        structureTool(),
        presentationTool({
            previewUrl: 'http://localhost:3000'
        }),
        visionTool({
            defaultApiVersion: '2024-05-15'
        })
    ],

    schema: {
        types: schemaTypes,
    },
})
