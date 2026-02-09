import { createClient } from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'
import type { SanityImageSource } from '@sanity/image-url/lib/types/types'

export const useSanity = () => {
    const config = useRuntimeConfig()

    const client = createClient({
        projectId: config.public.sanityProjectId,
        dataset: config.public.sanityDataset,
        apiVersion: config.public.sanityApiVersion,
        useCdn: true,
    })

    const builder = imageUrlBuilder(client)

    const urlFor = (source: SanityImageSource) => {
        return builder.image(source)
    }

    const fetch = async (query: string, params = {}) => {
        return await client.fetch(query, params)
    }

    return {
        client,
        fetch,
        urlFor
    }
}
