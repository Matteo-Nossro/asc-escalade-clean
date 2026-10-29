---
name: storyblok-images
description: Patterns d'images Storyblok d'ASC Escalade (champ Asset → NuxtImg provider storyblok ; Multi-Asset / galerie / lightbox → URL de transformation /m/…/filters). À utiliser avant d'afficher une image issue de Storyblok.
---

# Images Storyblok — patterns du projet

Source : `docs/conventions.md` § 4.

## Champ Asset unique → `NuxtImg`
```vue
<NuxtImg
  v-if="blok.image?.filename"
  provider="storyblok"
  :src="blok.image.filename"
  :alt="blok.image.alt || blok.titre || ''"
  format="webp"
  :quality="80"
/>
```

## Champ Multi-Asset (galerie) → URL de transformation directe
```vue
<img
  v-for="photo in blok.photos"
  :key="photo.id"
  :src="`${photo.filename}/m/800x0/filters:quality(75):format(webp)`"
  :alt="photo.alt || ''"
  loading="lazy"
/>
<!-- Lightbox : -->
<img :src="`${photo.filename}/m/1600x0/filters:quality(80):format(webp)`" />
```

## Règles
- Garde `v-if="….filename"` : un champ Asset vide renvoie un objet sans `filename`.
- Toujours un `alt` : le champ `alt` de l'asset, sinon le titre du blok, sinon `''`.
- Asset unique : `NuxtImg provider="storyblok"`, pas de `<img>` brut.
- Multi-Asset / galerie / lightbox : URL de transformation `/m/<largeur>x0/filters:…` directe (convention du projet).
