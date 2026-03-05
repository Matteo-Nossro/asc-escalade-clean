export const useSanityPreview = () => {
    const route = useRoute()
    const previewCookie = useCookie('__sanity_preview')

    const isPreview = computed(() =>
        previewCookie.value === 'true' || route.query.preview === 'true'
    )

    const perspective = computed(() =>
        isPreview.value ? 'previewDrafts' : 'published'
    )

    return {
        isPreview,
        perspective
    }
}
