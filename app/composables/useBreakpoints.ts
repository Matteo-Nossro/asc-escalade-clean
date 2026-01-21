export const useBreakpoints = () => {
    const windowWidth = ref(0)

    const updateWidth = () => {
        windowWidth.value = window.innerWidth
    }

    onMounted(() => {
        windowWidth.value = window.innerWidth
        window.addEventListener('resize', updateWidth)
    })

    onUnmounted(() => {
        window.removeEventListener('resize', updateWidth)
    })

    // Breakpoints Tailwind par défaut
    const isMobile = computed(() => windowWidth.value < 768)
    const isTablet = computed(() => windowWidth.value >= 768 && windowWidth.value < 1024)
    const isDesktop = computed(() => windowWidth.value >= 1024)
    const isLargeDesktop = computed(() => windowWidth.value >= 1280)
    const isXLargeDesktop = computed(() => windowWidth.value >= 1536)

    // Breakpoints nommés
    const breakpoint = computed(() => {
        if (windowWidth.value < 640) return 'xs'
        if (windowWidth.value < 768) return 'sm'
        if (windowWidth.value < 1024) return 'md'
        if (windowWidth.value < 1280) return 'lg'
        if (windowWidth.value < 1536) return 'xl'
        return '2xl'
    })

    // Fonctions utilitaires
    const isSmallerThan = (size: number) => computed(() => windowWidth.value < size)
    const isGreaterThan = (size: number) => computed(() => windowWidth.value >= size)
    const isBetween = (min: number, max: number) => computed(() =>
        windowWidth.value >= min && windowWidth.value < max
    )

    return {
        windowWidth: readonly(windowWidth),
        isMobile,
        isTablet,
        isDesktop,
        isLargeDesktop,
        isXLargeDesktop,
        breakpoint,
        isSmallerThan,
        isGreaterThan,
        isBetween
    }
}
