import { describe, it, expect } from 'vitest'
import { currentSeasonStart, seasonLabel } from '../../app/utils/season'

describe('currentSeasonStart (Europe/Paris)', () => {
  it('31 août 23:59 à Paris : saison précédente', () => {
    // 21:59 UTC = 23:59 CEST
    expect(currentSeasonStart(new Date('2026-08-31T21:59:00Z'))).toBe(2025)
  })

  it('1er septembre 00:00 à Paris : nouvelle saison, même si UTC est encore le 31 août', () => {
    // 22:00 UTC le 31 août = 00:00 CEST le 1er septembre
    expect(currentSeasonStart(new Date('2026-08-31T22:00:00Z'))).toBe(2026)
  })

  it('milieu de saison (janvier) : saison commencée l\'année précédente', () => {
    expect(currentSeasonStart(new Date('2027-01-15T12:00:00Z'))).toBe(2026)
  })

  it('formate la saison en AAAA-AAAA', () => {
    expect(seasonLabel(2026)).toBe('2026-2027')
  })
})
