---
name: gsap-patterns
description: Patterns GSAP validés d'ASC Escalade (animations d'entrée gsap.from, import dynamique dans onMounted, prefers-reduced-motion, useGsapReveal + data-reveal, ScrollTrigger, LCP). À utiliser avant d'écrire ou de modifier une animation GSAP.
---

# GSAP — patterns du projet

Source : `docs/conventions.md` § 2. Vérification automatique de la règle `gsap-from` : skill `asc-rules`.

## 1. Le plus simple : `useGsapReveal` + `data-reveal`
```vue
<section ref="root" v-editable="blok"> <h2 data-reveal>…</h2> </section>
<script setup lang="ts">
import { ref } from 'vue'
import { useGsapReveal } from '~/composables/useGsapReveal'
const root = ref(null)
useGsapReveal(root)   // gsap.from opacity/y, ScrollTrigger 'top 85%', reduced-motion géré
</script>
```

## 2. Animation sur mesure (pattern standard d'un blok)
```ts
onMounted(async () => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const [{ gsap }, { ScrollTrigger }] = await Promise.all([import('gsap'), import('gsap/ScrollTrigger')])
  gsap.registerPlugin(ScrollTrigger)
  gsap.from(title.value, { opacity: 0, y: 30, duration: 1, delay: 0.3 })
})
```
Exemples dans le dépôt : `Home/Hero.vue`, `*/Header.vue`, bloks `inscriptions-*`.

## Règles
- **Entrée = `gsap.from()`**. Sinon l'élément reste invisible si la timeline échoue.
  - ❌ `gsap.set(el, { opacity: 0 })` suivi de `gsap.to(el, { opacity: 1 })`
  - ❌ `class="opacity-0"` dans le template suivi de `gsap.to({ opacity: 1 })`
- **Import dynamique** dans `onMounted`, jamais `import { gsap } from 'gsap'` au niveau du module : GSAP doit rester dans le chunk lazy du blok.
- **`prefers-reduced-motion`** : la garde est la première ligne.
- **`<h1>` candidat LCP** : `gsap.from({ y })` sans `opacity`, jamais masqué.
- **Refs en `v-for`** : `:ref="el => { if (el) refs[i] = el }"`, sans `as HTMLElement`.
- Imports `'vue'` explicites (`ref`, `onMounted`…) en `lang="ts"`.
