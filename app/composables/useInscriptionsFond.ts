import { computed } from 'vue'
import type { ComputedRef } from 'vue'

/**
 * Couleur de fond d'un bloc « inscriptions ».
 *
 * Chaque bloc expose un champ Storyblok `fond` (Option) permettant de choisir
 * la couleur de la section — pour alterner les fonds librement quand on
 * réorganise l'ordre des blocs dans la story `inscriptions`.
 *
 * Valeurs acceptées (technical value du champ Option) :
 *   - `blanc`      → fond blanc (défaut)
 *   - `gris`       → fond gris clair
 *   - `vert`       → fond vert très clair (accent club)
 *   - `bleu-nuit`  → fond bleu nuit, textes clairs
 *
 * Usage :
 *   const fond = useInscriptionsFond(() => props.blok.fond)
 *   → <section :class="fond.section">
 *       <h2 :class="fond.titre">…</h2>
 *       <p :class="fond.texte">…</p>
 */
export interface FondClasses {
  /** classe de fond à poser sur le `<section>` */
  section: string
  /** classe de couleur pour les titres (`h2`, `h3` de section) */
  titre: string
  /** classe de couleur pour les textes secondaires (intro, notes) */
  texte: string
  /** `true` pour un fond sombre → adapter les éléments décoratifs si besoin */
  sombre: boolean
}

const MAP: Record<string, FondClasses> = {
  blanc: { section: 'bg-white', titre: 'text-[#0F1729]', texte: 'text-gray-500', sombre: false },
  gris: { section: 'bg-gray-50', titre: 'text-[#0F1729]', texte: 'text-gray-500', sombre: false },
  vert: { section: 'bg-[#7FD857]/10', titre: 'text-[#0F1729]', texte: 'text-gray-600', sombre: false },
  'bleu-nuit': { section: 'bg-[#0F1729]', titre: 'text-white', texte: 'text-white/70', sombre: true },
}

export const useInscriptionsFond = (
  fond: () => string | undefined | null,
): ComputedRef<FondClasses> => computed(() => MAP[fond() || 'blanc'] || MAP.blanc)
