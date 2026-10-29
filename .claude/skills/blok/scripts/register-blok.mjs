#!/usr/bin/env node
// Enregistre un composant Storyblok dans app/plugins/storyblok.ts (chargement lazy, comme les blocs existants).
// Usage : node .claude/skills/blok/scripts/register-blok.mjs <technical-name> <chemin/vers/Composant.vue>
// Idempotent : ne fait rien si le couple nom/fichier est déjà enregistré. Refuse underscores et majuscules.
import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'

const fail = (msg) => { console.error(`register-blok : ${msg}`); process.exit(1) }

const [name, file] = process.argv.slice(2)
if (!name || !file) fail('usage : register-blok.mjs <technical-name> <chemin/Composant.vue>')
if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) fail(`technical name invalide « ${name} » : minuscules, chiffres et tirets uniquement (pas d'underscore ni de majuscule)`)

let root
try {
  root = execSync('git rev-parse --show-toplevel', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
} catch {
  root = process.cwd()
}
const pluginPath = path.join(root, 'app/plugins/storyblok.ts')
const abs = path.resolve(process.cwd(), file)
const relFile = path.relative(root, abs).replace(/\\/g, '/')
if (!relFile.startsWith('app/storyblok/') || !relFile.endsWith('.vue')) fail(`le composant doit être un .vue sous app/storyblok/ (reçu : ${relFile})`)
if (!fs.existsSync(abs)) fail(`fichier introuvable : ${relFile}`)
if (path.basename(relFile).startsWith('_')) fail(`${relFile} est un sous-composant interne (préfixe _) : il ne s'enregistre pas`)

const raw = fs.readFileSync(pluginPath, 'utf8')
const eol = raw.includes('\r\n') ? '\r\n' : '\n'
const lines = raw.split(/\r?\n/)
const importPath = '../' + path.relative('app', relFile).replace(/\\/g, '/') // relatif à app/plugins/
const entry = `  vueApp.component('${name}', lazy(() => import('${importPath}')))`

const byName = lines.findIndex((l) => l.includes(`vueApp.component('${name}'`))
const byFile = lines.findIndex((l) => l.includes(`'${importPath}'`))
if (byName >= 0 && byName === byFile) { console.log(`déjà enregistré : app/plugins/storyblok.ts:${byName + 1}`); process.exit(0) }
if (byName >= 0) fail(`le nom '${name}' est déjà utilisé (app/plugins/storyblok.ts:${byName + 1}) pour un autre fichier`)
if (byFile >= 0) fail(`${relFile} est déjà enregistré sous un autre nom (app/plugins/storyblok.ts:${byFile + 1})`)

// Insertion après le dernier composant du même dossier, sinon nouveau groupe avant la fermeture du plugin.
const folder = path.dirname(importPath) + '/'
let at = -1
lines.forEach((l, i) => {
  const m = /^\s*vueApp\.component\(.*import\(\s*'([^']+)'\s*\)/.exec(l)
  if (m && path.dirname(m[1]) + '/' === folder) at = i
})
if (at >= 0) {
  lines.splice(at + 1, 0, entry)
} else {
  const close = lines.map((l) => /^\}\)\s*$/.test(l)).lastIndexOf(true)
  if (close < 0) fail('fermeture `})` du plugin introuvable')
  const group = path.relative('../storyblok', folder).replace(/\\/g, '/') || 'racine'
  lines.splice(close, 0, '', `  // ${group}`, entry)
  at = close + 1
}
fs.writeFileSync(pluginPath, lines.join(eol))
console.log(`app/plugins/storyblok.ts:${at + 2} + vueApp.component('${name}', lazy(() => import('${importPath}')))`)
