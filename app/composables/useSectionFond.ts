import { computed } from 'vue'
import type { ComputedRef } from 'vue'

/**
 * Couleur de fond d'une section (bloc réutilisable).
 *
 * Tous les blocs `bloc-*` exposent un champ Storyblok `fond` (Option) — permet
 * d'alterner les couleurs de section quand on compose une page, sans code.
 *
 * Valeurs (technical value du champ Option) :
 *   - `blanc`      → fond blanc (défaut)
 *   - `gris`       → fond gris clair
 *   - `vert`       → fond vert très clair (accent club)
 *   - `bleu-nuit`  → fond bleu nuit, textes clairs
 *
 * Usage :
 *   const fond = useSectionFond(() => props.blok.fond)
 *   → <section :class="fond.section"><h2 :class="fond.titre">…
 */
export interface FondClasses {
  section: string
  titre: string
  texte: string
  sombre: boolean
}

const MAP: Record<string, FondClasses> = {
  blanc: { section: 'bg-white', titre: 'text-[#0F1729]', texte: 'text-gray-500', sombre: false },
  gris: { section: 'bg-gray-50', titre: 'text-[#0F1729]', texte: 'text-gray-500', sombre: false },
  vert: { section: 'bg-[#7FD857]/10', titre: 'text-[#0F1729]', texte: 'text-gray-600', sombre: false },
  'bleu-nuit': { section: 'bg-[#0F1729]', titre: 'text-white', texte: 'text-white/70', sombre: true },
}

export const useSectionFond = (
  fond: () => string | undefined | null,
): ComputedRef<FondClasses> => computed(() => MAP[fond() || 'blanc'] || MAP.blanc)
