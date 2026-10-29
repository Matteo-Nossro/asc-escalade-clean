#!/usr/bin/env node
// Typecheck avec baseline : échoue seulement sur les erreurs NOUVELLES.
//
//   node scripts/typecheck-baseline.mjs            vérifie contre tests/typecheck-baseline.json
//   node scripts/typecheck-baseline.mjs --update   régénère la baseline (usage volontaire)
//
// Clé d'erreur = fichier + code TS + message (sans numéro de ligne/colonne),
// avec comptage des occurrences par clé. Une erreur est « nouvelle » si sa clé
// est absente de la baseline ou si son nombre d'occurrences augmente.
// Codes de sortie : 0 ok · 1 erreur(s) nouvelle(s) · 2 problème d'outillage.

import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const baselinePath = resolve(root, 'tests/typecheck-baseline.json')
const update = process.argv.includes('--update')

const run = spawnSync('npx nuxi typecheck', {
  cwd: root,
  shell: true,
  encoding: 'utf8',
  maxBuffer: 64 * 1024 * 1024,
})

if (run.error) {
  console.error('[typecheck] impossible de lancer nuxi typecheck :', run.error.message)
  process.exit(2)
}

// eslint-disable-next-line no-control-regex
const output = `${run.stdout ?? ''}\n${run.stderr ?? ''}`.replace(/\x1b\[[0-9;]*m/g, '')
const rootFwd = root.replace(/\\/g, '/')

// "chemin(ligne,col): error TS1234: message"
const lineRe = /^(.+?)\(\d+,\d+\): error (TS\d+): (.*)$/
const current = {}
let total = 0
for (const raw of output.split(/\r?\n/)) {
  const m = lineRe.exec(raw.trim())
  if (!m) continue
  let file = m[1].replace(/\\/g, '/')
  // Préfixe racine retiré sans tenir compte de la casse (lettre de lecteur Windows).
  if (file.toLowerCase().startsWith(`${rootFwd.toLowerCase()}/`)) file = file.slice(rootFwd.length + 1)
  const key = `${file} | ${m[2]} | ${m[3].trim()}`
  current[key] = (current[key] ?? 0) + 1
  total++
}

// Sortie non nulle sans aucune erreur de type parsée : problème d'outillage, pas de types.
if (run.status !== 0 && total === 0) {
  console.error('[typecheck] nuxi typecheck a échoué sans erreur de type reconnue (outillage) :')
  console.error(output.split(/\r?\n/).slice(-25).join('\n'))
  process.exit(2)
}

// Toute occurrence « error TSxxxx » de la sortie brute doit avoir été analysée : sinon (crash partiel,
// erreur globale sans fichier, format inattendu) le résultat serait faussement rassurant.
const rawCount = (output.match(/error TS\d+/g) ?? []).length
if (rawCount !== total) {
  console.error(`[typecheck] écart d'outillage : ${rawCount} « error TS » dans la sortie brute, ${total} analysées (écart ${rawCount - total}).`)
  console.error('Lancer `npm run typecheck:strict` pour voir la sortie complète.')
  process.exit(2)
}

// Tri indépendant de la locale (diffs stables d'un poste à l'autre).
const byCodeUnit = ([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)
const sorted = (obj) => Object.fromEntries(Object.entries(obj).sort(byCodeUnit))

if (update) {
  mkdirSync(dirname(baselinePath), { recursive: true })
  writeFileSync(baselinePath, `${JSON.stringify({ total, errors: sorted(current) }, null, 2)}\n`)
  console.log(`[typecheck] baseline régénérée : ${total} erreurs, ${Object.keys(current).length} clés (${baselinePath})`)
  process.exit(0)
}

if (!existsSync(baselinePath)) {
  console.error('[typecheck] baseline absente. Lancer : npm run typecheck:baseline')
  process.exit(2)
}

let baseline
try {
  baseline = JSON.parse(readFileSync(baselinePath, 'utf8')).errors ?? {}
} catch (e) {
  console.error(`[typecheck] baseline illisible ou corrompue (${baselinePath}) : ${e.message}`)
  console.error('Restaurer le fichier (git checkout) ; ne régénérer qu\'avec validation de l\'utilisateur.')
  process.exit(2)
}

const added = []
let fixed = 0
for (const [key, count] of Object.entries(current)) {
  const before = baseline[key] ?? 0
  if (count > before) added.push([key, count - before])
}
for (const [key, before] of Object.entries(baseline)) {
  const now = current[key] ?? 0
  if (now < before) fixed += before - now
}

const newCount = added.reduce((n, [, c]) => n + c, 0)
console.log(`[typecheck] ${total} erreurs (baseline ${Object.values(baseline).reduce((a, b) => a + b, 0)}) · nouvelles : ${newCount} · corrigées : ${fixed}`)

if (newCount > 0) {
  console.error('\n[typecheck] NOUVELLES erreurs de type :')
  for (const [key, c] of added) console.error(`  ${c > 1 ? `(+${c}) ` : ''}${key}`)
  console.error('\nCorriger ces erreurs. Pour `npm run typecheck:strict` voir la liste complète.')
  process.exit(1)
}

if (fixed > 0) {
  console.log('[typecheck] des erreurs ont été corrigées : `npm run typecheck:baseline` pour resserrer la baseline.')
}
process.exit(0)
