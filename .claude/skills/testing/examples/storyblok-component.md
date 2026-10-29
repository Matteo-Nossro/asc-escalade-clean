# Tester un composant (dont un composant Storyblok)

Modèle de base : `tests/components/Tag.test.ts` (`mountSuspended`). Fichier : `tests/components/<Nom>.test.ts`.

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import BlocAlerte from '~/storyblok/blocs/BlocAlerte.vue'

// Un blok minimal, avec les seuls champs utiles au test (forme Storyblok : _uid + component)
const blok = { _uid: 'b1', component: 'bloc-alerte', titre: 'Info', message: 'Fermeture le 14 juillet', fermable: false }

describe('bloc-alerte — critère : le texte saisi dans Storyblok est affiché', () => {
  beforeEach(() => {
    // GSAP : forcer « reduced motion » pour que onMounted ne lance aucune animation
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true, addEventListener() {}, removeEventListener() {} })))
  })

  it('affiche le texte', async () => {
    const wrapper = await mountSuspended(BlocAlerte, {
      props: { blok },
      global: {
        directives: { editable: {} },          // si v-editable n'est pas enregistré dans l'environnement de test
        stubs: { NuxtImg: { template: '<img />' } },
      },
    })
    expect(wrapper.text()).toContain('Fermeture le 14 juillet')
  })
})
```

- Tester le **rendu des champs du blok** et les cas vides : champ absent, asset sans `filename`, liste vide. Ne pas tester GSAP.
- `blok` est un objet simple : pas de générique TypeScript, comme dans le composant.
- Les sous-composants `_Nom.vue` se testent comme des composants normaux.
- Le rich-text Storyblok : passer une structure `{ type: 'doc', content: [...] }` minimale, ou tester seulement la présence du conteneur.
