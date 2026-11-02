// Backlog Q13 — les hex de la charte sont dupliqués dans les trois fichiers de thème
// (main.css, categoryColors.ts, email-theme.ts) : ce test échoue si l'un dérive.
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect } from 'vitest'
import { DEFAULT_TAG_COLOR, CATEGORY_COLORS } from '../../app/utils/categoryColors'
import { EMAIL_COLORS } from '../../server/utils/email-theme'

const mainCss = readFileSync(resolve(__dirname, '../../app/assets/css/main.css'), 'utf8')

function cssVar(name: string): string {
  const m = new RegExp(`--${name}\\s*:\\s*(#[0-9a-fA-F]{3,8})\\s*;`).exec(mainCss)
  if (!m?.[1]) throw new Error(`--${name} introuvable (ou non hex) dans main.css`)
  return m[1].toUpperCase()
}

describe('cohérence des couleurs de la charte entre fichiers de thème', () => {
  it('main.css garde les valeurs de la charte (#7FD857, #0F1729)', () => {
    expect(cssVar('vp-green')).toBe('#7FD857')
    expect(cssVar('vp-dark')).toBe('#0F1729')
  })

  it('vert : --vp-green = DEFAULT_TAG_COLOR = catégorie Falaise = EMAIL_COLORS.green', () => {
    const green = cssVar('vp-green')
    expect(DEFAULT_TAG_COLOR.toUpperCase()).toBe(green)
    expect(CATEGORY_COLORS['Falaise']?.toUpperCase()).toBe(green)
    expect(EMAIL_COLORS.green.toUpperCase()).toBe(green)
  })

  it('bleu nuit : --vp-dark = EMAIL_COLORS.navy', () => {
    expect(EMAIL_COLORS.navy.toUpperCase()).toBe(cssVar('vp-dark'))
  })
})
