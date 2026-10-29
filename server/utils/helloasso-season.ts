/** Saison `AAAA-AAAA` à années consécutives (ex. 2026-2027). */
export function isValidSeason(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const match = /^(\d{4})-(\d{4})$/.exec(value)
  return !!match && Number(match[2]) === Number(match[1]) + 1
}
