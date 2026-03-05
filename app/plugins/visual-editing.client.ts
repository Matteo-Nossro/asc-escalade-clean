import { enableVisualEditing } from '@sanity/visual-editing'

export default defineNuxtPlugin(() => {
    const route = useRoute()
    const isInIframe = typeof window !== 'undefined' && window.self !== window.top

    // Activer uniquement dans l'iframe
    if (isInIframe) {
        console.log('🚀 Activation Visual Editing dans iframe...')

        const disable = enableVisualEditing()

        console.log('✅ Visual Editing activé')

        // Debug : afficher les éléments avec data-sanity après 2 secondes
        setTimeout(() => {
            const elements = document.querySelectorAll('[data-sanity]')
            console.log(`📝 Éléments avec data-sanity: ${elements.length}`)

            elements.forEach((el, i) => {
                if (i < 5) {
                    console.log(`  ${i+1}.`, {
                        tag: el.tagName,
                        attr: el.getAttribute('data-sanity'),
                        text: el.textContent?.slice(0, 30)
                    })
                }
            })
        }, 2000)
    }
})
