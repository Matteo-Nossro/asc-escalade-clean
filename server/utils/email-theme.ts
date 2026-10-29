/**
 * Couleurs des e-mails HTML envoyés par le serveur.
 * Les clients mail n'interprètent pas les variables CSS : les valeurs sont donc
 * des hex en dur, regroupés ici (fichier de thème, comme app/assets/css/main.css).
 */
export const EMAIL_COLORS = {
  /** Bleu nuit de la charte : fond d'en-tête, texte sur accent, nom du club */
  navy: '#0F1729',
  /** Vert de la charte : accent d'approbation, marque, lien */
  green: '#7FD857',
  /** Orange : accent de refus */
  orange: '#f97316',
  /** Fond de page de l'e-mail */
  pageBg: '#f1f5f9',
  /** Fond des blocs de contenu */
  white: '#ffffff',
  /** Texte principal (salutation) */
  textStrong: '#0f172a',
  /** Texte courant */
  textBody: '#334155',
  /** Texte secondaire */
  textMuted: '#64748b',
  /** Texte discret (localisation) */
  textSubtle: '#94a3b8',
  /** Filets et séparateurs */
  border: '#e2e8f0',
} as const
