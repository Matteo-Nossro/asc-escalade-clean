// Saison au format AAAA-AAAA, coupure au 1er septembre à l'heure de Paris
// (même règle que la migration 20261025_helloasso_socle.sql), quel que soit le fuseau du navigateur.
const parisYearMonth = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Europe/Paris',
  year: 'numeric',
  month: 'numeric',
})

export function currentSeasonStart(date: Date = new Date()): number {
  const parts = parisYearMonth.formatToParts(date)
  const year = Number(parts.find(p => p.type === 'year')?.value)
  const month = Number(parts.find(p => p.type === 'month')?.value)
  return month >= 9 ? year : year - 1
}

export const seasonLabel = (start: number) => `${start}-${start + 1}`
