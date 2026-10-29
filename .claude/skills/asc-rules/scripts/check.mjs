#!/usr/bin/env node
// Vérifie les règles critiques ASC Escalade (CLAUDE.md) sur des fichiers .vue / .ts.
// Usage : node .claude/skills/asc-rules/scripts/check.mjs [fichiers|dossiers…]
// Sans argument : fichiers .vue/.ts modifiés (git diff HEAD + fichiers non suivis).
// Sortie : `fichier:ligne [ERREUR|AVERT] règle : détail` — rien si conforme. Exit 1 si ≥ 1 erreur.
import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'

const ROOT = (() => {
  try {
    return execSync('git rev-parse --show-toplevel', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
  } catch {
    return process.cwd()
  }
})()
const PLUGIN = 'app/plugins/storyblok.ts'
const STORYBLOK_DIR = 'app/storyblok/'
// Seuls endroits où un hex est permis : fichiers de thème (main.css n'est pas scanné) + tests/e2e
const THEME_FILES = new Set(['app/utils/categoryColors.ts', 'server/utils/email-theme.ts'])
const HEX_FREE_DIR = /^(tests|e2e)\//
const VUE_API = [
  'ref', 'shallowRef', 'computed', 'reactive', 'shallowReactive', 'readonly', 'watch', 'watchEffect',
  'onMounted', 'onBeforeMount', 'onUnmounted', 'onBeforeUnmount', 'onUpdated', 'onBeforeUpdate',
  'onActivated', 'onDeactivated', 'nextTick', 'toRef', 'toRefs', 'unref', 'isRef', 'markRaw',
  'provide', 'inject', 'useSlots', 'useAttrs', 'useTemplateRef', 'useId', 'defineAsyncComponent',
]
const SKIP_DIR = /(^|\/)(node_modules|\.nuxt|\.output|\.netlify|dist|coverage|graphify-out|worktrees)(\/|$)/
const NOM_TIRETS = /^[a-z0-9]+(-[a-z0-9]+)*$/

const rel = (f) => path.relative(ROOT, path.resolve(ROOT, f)).replace(/\\/g, '/')
const lineOf = (src, idx) => src.slice(0, idx).split('\n').length
const problems = []
const report = (file, line, level, rule, detail) => problems.push({ file, line, level, rule, detail })

// ---------- sélection des fichiers ----------
function walk(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) { if (!SKIP_DIR.test(rel(p))) walk(p, out) }
    else if (/\.(vue|ts)$/.test(e.name)) out.push(rel(p))
  }
}
function gitFiles() {
  const run = (c) => { try { return execSync(c, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }) } catch { return '' } }
  return [...run('git diff --name-only HEAD').split('\n'), ...run('git ls-files --others --exclude-standard').split('\n')]
    .map((s) => s.trim()).filter(Boolean)
}
const args = process.argv.slice(2)
const files = new Set()
for (const a of args.length ? args : gitFiles()) {
  const abs = path.resolve(args.length ? process.cwd() : ROOT, a)
  if (!fs.existsSync(abs)) continue
  if (fs.statSync(abs).isDirectory()) { const out = []; walk(abs, out); out.forEach((f) => files.add(f)) }
  else if (/\.(vue|ts)$/.test(abs) && !SKIP_DIR.test(rel(abs))) files.add(rel(abs))
}

// ---------- outils d'analyse ----------
// Masque commentaires (et chaînes si strings=true) en conservant longueur et retours ligne.
function mask(src, strings) {
  let out = '', i = 0
  const blank = (s) => s.replace(/[^\n]/g, ' ')
  while (i < src.length) {
    const c = src[i], n = src[i + 1]
    if (c === '/' && n === '/') { const j = src.indexOf('\n', i); const e = j < 0 ? src.length : j; out += blank(src.slice(i, e)); i = e; continue }
    if (c === '/' && n === '*') { const j = src.indexOf('*/', i + 2); const e = j < 0 ? src.length : j + 2; out += blank(src.slice(i, e)); i = e; continue }
    if (c === '"' || c === "'" || c === '`') {
      let j = i + 1
      while (j < src.length && src[j] !== c) { if (src[j] === '\\') j++; if (c !== '`' && src[j] === '\n') break; j++ }
      const e = Math.min(j + 1, src.length)
      out += strings ? c + blank(src.slice(i + 1, e - 1)) + (src[e - 1] === c ? c : ' ') : src.slice(i, e)
      i = e; continue
    }
    out += c; i++
  }
  return out
}
function sfcBlocks(src) {
  const blocks = []
  const tOpen = /^<template(\s[^>]*)?>/m.exec(src)
  if (tOpen) {
    const end = src.lastIndexOf('</template>')
    blocks.push({ type: 'template', start: tOpen.index + tOpen[0].length, content: src.slice(tOpen.index + tOpen[0].length, end > 0 ? end : src.length) })
  }
  for (const m of src.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
    blocks.push({ type: 'script', attrs: m[1], ts: /lang\s*=\s*["']ts["']/.test(m[1]), start: m.index + m[0].indexOf('>') + 1, content: m[2] })
  }
  return blocks
}
// Premier argument d'un appel, à partir de l'index juste après la parenthèse ouvrante.
function firstArg(code, from) {
  let depth = 0, i = from
  for (; i < code.length; i++) {
    const c = code[i]
    if ('([{'.includes(c)) depth++
    else if (')]}'.includes(c)) { if (depth === 0) break; depth-- }
    else if (c === ',' && depth === 0) break
  }
  return code.slice(from, i).replace(/\s+/g, '')
}

// ---------- registre du plugin Storyblok ----------
let registry = null
function loadRegistry() {
  if (registry) return registry
  registry = { byFile: new Map(), names: [] }
  const p = path.join(ROOT, PLUGIN)
  if (!fs.existsSync(p)) return registry
  const src = fs.readFileSync(p, 'utf8')
  const imports = new Map() // identifiant -> fichier (imports statiques)
  for (const m of src.matchAll(/import\s+(\w+)\s+from\s+['"]([^'"]+\.vue)['"]/g)) imports.set(m[1], resolveImport(m[2]))
  for (const m of src.matchAll(/vueApp\.component\(\s*['"]([^'"]+)['"]\s*,\s*([^\n]*)/g)) {
    const line = lineOf(src, m.index)
    const dyn = /import\(\s*['"]([^'"]+)['"]\s*\)/.exec(m[2])
    const id = /^(\w+)/.exec(m[2])?.[1]
    const file = dyn ? resolveImport(dyn[1]) : imports.get(id)
    registry.names.push({ name: m[1], line, file })
    if (file) registry.byFile.set(file, { name: m[1], line })
  }
  return registry
}
function resolveImport(spec) {
  if (/^~~\//.test(spec)) return rel(spec.slice(3))
  if (/^[~@]\//.test(spec)) return rel(path.join('app', spec.slice(2)))
  return rel(path.join(path.dirname(PLUGIN), spec))
}

// ---------- règles ----------
function checkColors(file, src) {
  if (THEME_FILES.has(file) || HEX_FREE_DIR.test(file)) return
  const fix = '→ token de app/assets/css/main.css (classe vp-*/palette ou var()), catégories : app/utils/categoryColors.ts'
  // `_` autorisé avant le # : valeurs arbitraires Tailwind (shadow-[0_0_20px_#7FD857])
  for (const m of src.matchAll(/(?<![A-Za-z0-9&#/\-])#([0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})(?![\w-])/g)) {
    const before = src.slice(Math.max(0, m.index - 12), m.index)
    if (/(?<![\w-])(href|to|id)\s*=\s*["'`]?$/.test(before)) continue
    report(file, lineOf(src, m.index), 'ERREUR', 'couleur-hors-theme', `${m[0]} ${fix}`)
  }
  // hex encodé dans un data-URI SVG (fill='%23fff')
  for (const m of src.matchAll(/%23([0-9a-fA-F]{6}|[0-9a-fA-F]{3})(?![0-9a-fA-F])/g)) {
    const lineStart = src.lastIndexOf('\n', m.index) + 1
    if (!src.slice(lineStart, m.index).includes('data:')) continue
    report(file, lineOf(src, m.index), 'ERREUR', 'couleur-hors-theme', `%23${m[1]} (data-URI) ${fix}`)
  }
}
function checkGsap(file, code, offset, full) {
  for (const m of code.matchAll(/\bgsap\.set\s*\(/g)) {
    const target = firstArg(code, m.index + m[0].length)
    if (!target) continue
    const rest = code.slice(m.index + m[0].length)
    for (const t of rest.matchAll(/\.to\s*\(/g)) {
      if (firstArg(rest, t.index + t[0].length) === target) {
        report(file, lineOf(full, offset + m.index), 'ERREUR', 'gsap-from', `gsap.set(${target}) suivi de .to() sur la même cible → utiliser gsap.from()`)
        break
      }
    }
  }
}
function checkVueImports(file, script, full) {
  const noComments = mask(script.content, false)
  const code = mask(script.content, true)
  const imported = new Set()
  for (const m of noComments.matchAll(/import\s+(?:type\s+)?\{([^}]*)\}\s*from\s*['"]vue['"]/g)) {
    for (const part of m[1].split(',')) {
      const s = part.trim().replace(/^type\s+/, '')
      if (s) imported.add(s.split(/\s+as\s+/).pop().trim())
    }
  }
  for (const api of VUE_API) {
    if (imported.has(api)) continue
    if (new RegExp(`\\b(const|let|var|function)\\s+${api}\\b`).test(code)) continue
    const use = new RegExp(`(?<![.\\w$])${api}\\s*(<[^()]*?>)?\\s*\\(`).exec(code)
    if (use) report(file, lineOf(full, script.start + use.index), 'ERREUR', 'import-vue-explicite', `${api}() utilisé sans import { ${api} } from 'vue'`)
  }
}
function checkVue(file, src) {
  const blocks = sfcBlocks(src)
  const tpl = blocks.find((b) => b.type === 'template')
  const scripts = blocks.filter((b) => b.type === 'script')
  const scriptCode = scripts.map((s) => mask(s.content, false)).join('\n')
  const isStoryblok = file.startsWith(STORYBLOK_DIR) || /defineProps\s*\(\s*\{\s*blok\b/.test(scriptCode)
  const isSubComponent = path.basename(file).startsWith('_')

  if (tpl) {
    const body = tpl.content.replace(/<!--[\s\S]*?-->/g, (c) => c.replace(/[^\n]/g, ' '))
    // as HTMLElement dans le template
    for (const m of body.matchAll(/\bas\s+HTML\w*Element\b/g)) {
      report(file, lineOf(src, tpl.start + m.index), 'ERREUR', 'ref-sans-as', 'assertion TS dans le template → :ref="el => { if (el) refs[i] = el }"')
    }
    // v-editable sur la racine
    if (isStoryblok && !isSubComponent) {
      const open = /<([A-Za-z][\w-]*)\b/.exec(body)
      if (open) {
        let i = open.index, q = null
        for (; i < body.length; i++) { const c = body[i]; if (q) { if (c === q) q = null } else if (c === '"' || c === "'") q = c; else if (c === '>') break }
        const tag = body.slice(open.index, i)
        if (!/v-editable\s*=\s*["'](props\.)?blok["']/.test(tag)) {
          report(file, lineOf(src, tpl.start + open.index), 'ERREUR', 'v-editable-racine', `<${open[1]}> racine sans v-editable="blok"`)
        }
      }
    }
  }
  for (const s of scripts) {
    const code = mask(s.content, false)
    if (isStoryblok) {
      const g = /defineProps\s*</.exec(code)
      if (g) report(file, lineOf(src, s.start + g.index), 'ERREUR', 'defineProps-generique', 'utiliser defineProps({ blok: Object })')
    }
    // Auto-imports Nuxt KO seulement dans les composants Storyblok en lang="ts" (CLAUDE.md)
    if (s.ts && file.startsWith(STORYBLOK_DIR)) checkVueImports(file, s, src)
    checkGsap(file, code, s.start, src)
  }
  if (file.startsWith(STORYBLOK_DIR) && !isSubComponent) {
    const reg = loadRegistry().byFile.get(file)
    if (!reg) report(file, 1, 'ERREUR', 'enregistrement-plugin', `absent de ${PLUGIN} (sous-composant interne ? préfixer le fichier par _)`)
    else if (!NOM_TIRETS.test(reg.name)) report(file, 1, 'ERREUR', 'nom-tirets', `enregistré sous '${reg.name}' (${PLUGIN}:${reg.line}) → minuscules et tirets`)
  }
  checkColors(file, src)
}
function checkTs(file, src) {
  checkGsap(file, mask(src, false), 0, src)
  if (file === PLUGIN) {
    for (const r of loadRegistry().names) {
      if (!NOM_TIRETS.test(r.name)) report(file, r.line, 'ERREUR', 'nom-tirets', `'${r.name}' → minuscules et tirets uniquement`)
      if (r.file && !fs.existsSync(path.join(ROOT, r.file))) report(file, r.line, 'ERREUR', 'enregistrement-plugin', `'${r.name}' pointe vers ${r.file} (introuvable)`)
    }
  }
  checkColors(file, src)
}

// ---------- exécution ----------
for (const f of [...files].sort()) {
  const src = fs.readFileSync(path.join(ROOT, f), 'utf8').replace(/\r\n/g, '\n')
  if (f.endsWith('.vue')) checkVue(f, src)
  else checkTs(f, src)
}
problems.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line)
for (const p of problems) console.log(`${p.file}:${p.line} [${p.level}] ${p.rule} : ${p.detail}`)
process.exit(problems.some((p) => p.level === 'ERREUR') ? 1 : 0)
