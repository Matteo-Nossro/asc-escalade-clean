// Couleurs des catégories de posts, des difficultés et constantes de <Tag>.
// SOURCE UNIQUE (fichier de thème, avec app/assets/css/main.css et server/utils/email-theme.ts).
// Les valeurs sont en HEX et non en var(--…) : Tag.vue calcule le contraste du texte à partir de
// #RRGGBB et dérive les variantes soft/subtle par suffixe alpha hex (`${hex}15`, `${hex}40`).
// Ajouter une catégorie = ajouter une ligne à CATEGORY_COLORS.

/** Vert de la charte (= --vp-green) : couleur par défaut d'un tag et d'une catégorie inconnue. */
export const DEFAULT_TAG_COLOR = '#7FD857'
/** Gris neutre : difficulté absente ou inconnue, tag sans catégorie. */
export const NEUTRAL_TAG_COLOR = '#6B7280'
/** Texte de Tag sur fond clair. */
export const TAG_TEXT_DARK = '#000000'
/** Texte de Tag sur fond sombre. */
export const TAG_TEXT_LIGHT = '#FFFFFF'

export const CATEGORY_COLORS: Record<string, string> = {
  'Falaise': '#7FD857',
  'Sortie Falaise': '#7FD857',
  'Infrastructure': '#7FD857',
  'Bloc': '#4ECDC4',
  'Stage': '#9333EA',
  'Climb Up': '#F97316',
  'Cime Altitude': '#2563EB',
  'Compétition': '#EF4444',
  'Événement': '#F59E0B',
  'Club': '#3B82F6',
  'Vie du club': '#3B82F6',
  'Formation': '#8B5CF6',
  'Partenariat': '#10B981'
}

export const DIFFICULTY_COLORS: Record<string, string> = {
  'Tous niveaux': '#10B981',
  'Débutant': '#10B981',
  'Intermédiaire': '#F59E0B',
  'Confirmé': '#EF4444',
  'Expert': '#7C3AED'
}

// Clé de recherche : sans accents, en minuscules, espaces de bord retirés.
function normalizeKey(value: string): string {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase()
}

function indexByNormalizedKey(table: Record<string, string>): Map<string, string> {
  return new Map(Object.entries(table).map(([name, hex]) => [normalizeKey(name), hex]))
}

const categoryIndex = indexByNormalizedKey(CATEGORY_COLORS)
const difficultyIndex = indexByNormalizedKey(DIFFICULTY_COLORS)

export function getCategoryColor(category?: string | null, fallback: string = DEFAULT_TAG_COLOR): string {
  if (!category) return fallback
  return categoryIndex.get(normalizeKey(category)) ?? fallback
}

export function getDifficultyColor(difficulty?: string | null): string {
  if (!difficulty) return NEUTRAL_TAG_COLOR
  return difficultyIndex.get(normalizeKey(difficulty)) ?? NEUTRAL_TAG_COLOR
}
