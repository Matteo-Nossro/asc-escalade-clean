import { onMounted } from 'vue'
import type { Ref } from 'vue'

/**
 * Anime en fondu/glissement les éléments `[data-reveal]` contenus dans `root`
 * au moment où ils entrent dans le viewport (GSAP + ScrollTrigger).
 *
 * - No-op si l'utilisateur préfère les animations réduites.
 * - `gsap.from()` : si la timeline échoue, l'élément revient à son état naturel
 *   (jamais masqué). Voir docs/conventions.md § GSAP.
 *
 * Usage dans un blok Storyblok :
 *   const root = ref(null)
 *   useGsapReveal(root)
 *   → <section ref="root">…<div data-reveal>…</div></section>
 */
export const useGsapReveal = (root: Ref<HTMLElement | null>) => {
  onMounted(async () => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (!root.value) return

    const [{ gsap }, { ScrollTrigger }] = await Promise.all([
      import('gsap'),
      import('gsap/ScrollTrigger'),
    ])
    gsap.registerPlugin(ScrollTrigger)

    root.value.querySelectorAll('[data-reveal]').forEach((el) => {
      gsap.from(el, {
        opacity: 0,
        y: 40,
        duration: 0.7,
        ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 85%' },
      })
    })
  })
}
