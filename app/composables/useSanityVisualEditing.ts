export const useSanityVisualEditing = (documentId?: string, documentType?: string) => {
    const route = useRoute()
    const previewCookie = useCookie('__sanity_preview')
    const isInIframe = typeof window !== 'undefined' && window.self !== window.top

    const isPreview = computed(() =>
        previewCookie.value === 'true' || route.query.preview === 'true' || isInIframe
    )

    // Fonction pour créer les attributs data-sanity
    const sanityProps = (path: string) => {
        // ⚠️ Important : toujours retourner l'objet, même si pas en preview
        // Visual Editing l'utilisera uniquement quand activé
        return {
            'data-sanity': path
        }
    }

    return {
        isPreview,
        sanityProps
    }
}
