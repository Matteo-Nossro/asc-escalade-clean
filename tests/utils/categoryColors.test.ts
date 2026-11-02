// harmonisation-couleurs T10 — module app/utils/categoryColors.ts (source unique des couleurs de catégories).
import { describe, it, expect } from 'vitest'
import {
  CATEGORY_COLORS,
  DEFAULT_TAG_COLOR,
  NEUTRAL_TAG_COLOR,
  TAG_TEXT_DARK,
  TAG_TEXT_LIGHT,
  getCategoryColor,
  getDifficultyColor
} from '../../app/utils/categoryColors'

describe('constantes de Tag', () => {
  it('valeurs figées (Tag.test.ts en dépend)', () => {
    expect(DEFAULT_TAG_COLOR).toBe('#7FD857')
    expect(NEUTRAL_TAG_COLOR).toBe('#6B7280')
    expect(TAG_TEXT_DARK).toBe('#000000')
    expect(TAG_TEXT_LIGHT).toBe('#FFFFFF')
  })
})

describe('getCategoryColor', () => {
  it.each([
    ['Falaise', '#7FD857'],
    ['Sortie Falaise', '#7FD857'],
    ['Infrastructure', '#7FD857'],
    ['Bloc', '#4ECDC4'],
    ['Stage', '#9333EA'],
    ['Climb Up', '#F97316'],
    ['Cime Altitude', '#2563EB'],
    ['Compétition', '#EF4444'],
    ['Événement', '#F59E0B'],
    ['Club', '#3B82F6'],
    ['Vie du club', '#3B82F6'],
    ['Formation', '#8B5CF6'],
    ['Partenariat', '#10B981']
  ])('%s -> %s', (name, hex) => {
    expect(getCategoryColor(name)).toBe(hex)
  })

  it('« Vie du club » a la même couleur que « Club »', () => {
    expect(getCategoryColor('Vie du club')).toBe(getCategoryColor('Club'))
  })

  it('couvre exactement les 13 catégories de la décision n°1', () => {
    expect(Object.keys(CATEGORY_COLORS)).toHaveLength(13)
  })

  it('ignore la casse', () => {
    expect(getCategoryColor('compétition')).toBe('#EF4444')
    expect(getCategoryColor('BLOC')).toBe('#4ECDC4')
    expect(getCategoryColor('cLiMb uP')).toBe('#F97316')
  })

  it('ignore les accents (présents ou absents)', () => {
    expect(getCategoryColor('Competition')).toBe('#EF4444')
    expect(getCategoryColor('Evenement')).toBe('#F59E0B')
    expect(getCategoryColor('événement')).toBe('#F59E0B')
    expect(getCategoryColor('EVENEMENT')).toBe('#F59E0B')
  })

  it('ignore les espaces de bord', () => {
    expect(getCategoryColor('  Stage  ')).toBe('#9333EA')
    expect(getCategoryColor('\tCime Altitude\n')).toBe('#2563EB')
  })

  it('catégorie inconnue, vide, null ou undefined -> défaut #7FD857', () => {
    expect(getCategoryColor('Inconnue')).toBe('#7FD857')
    expect(getCategoryColor('')).toBe('#7FD857')
    expect(getCategoryColor('   ')).toBe('#7FD857')
    expect(getCategoryColor(null)).toBe('#7FD857')
    expect(getCategoryColor(undefined)).toBe('#7FD857')
    expect(getCategoryColor()).toBe(DEFAULT_TAG_COLOR)
  })

  it('catégorie non textuelle (donnée Storyblok inattendue) -> repli, sans exception', () => {
    for (const value of [42, 0, true, {}, { name: 'Bloc' }, ['Bloc'], Symbol('x')]) {
      expect(() => getCategoryColor(value as unknown as string)).not.toThrow()
      expect(getCategoryColor(value as unknown as string)).toBe(DEFAULT_TAG_COLOR)
      expect(getCategoryColor(value as unknown as string, NEUTRAL_TAG_COLOR)).toBe(NEUTRAL_TAG_COLOR)
      expect(getDifficultyColor(value as unknown as string)).toBe(NEUTRAL_TAG_COLOR)
    }
  })

  it('repli personnalisé : remplace le défaut pour inconnu/vide, pas pour une catégorie connue', () => {
    expect(getCategoryColor('Inconnue', NEUTRAL_TAG_COLOR)).toBe('#6B7280')
    expect(getCategoryColor('', NEUTRAL_TAG_COLOR)).toBe('#6B7280')
    expect(getCategoryColor(undefined, NEUTRAL_TAG_COLOR)).toBe('#6B7280')
    expect(getCategoryColor('Compétition', NEUTRAL_TAG_COLOR)).toBe('#EF4444')
  })
})

describe('getDifficultyColor', () => {
  it.each([
    ['Tous niveaux', '#10B981'],
    ['Débutant', '#10B981'],
    ['Intermédiaire', '#F59E0B'],
    ['Confirmé', '#EF4444'],
    ['Expert', '#7C3AED']
  ])('%s -> %s', (name, hex) => {
    expect(getDifficultyColor(name)).toBe(hex)
  })

  it('normalise casse, accents et espaces', () => {
    expect(getDifficultyColor('debutant')).toBe('#10B981')
    expect(getDifficultyColor(' CONFIRME ')).toBe('#EF4444')
    expect(getDifficultyColor('intermediaire')).toBe('#F59E0B')
  })

  it('difficulté inconnue, vide, null ou undefined -> défaut #6B7280', () => {
    expect(getDifficultyColor('Légende')).toBe('#6B7280')
    expect(getDifficultyColor('')).toBe('#6B7280')
    expect(getDifficultyColor(null)).toBe('#6B7280')
    expect(getDifficultyColor(undefined)).toBe('#6B7280')
    expect(getDifficultyColor()).toBe(NEUTRAL_TAG_COLOR)
  })
})
