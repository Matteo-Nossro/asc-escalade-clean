// Régénère tables/*.md à partir de docs/database.md (source de vérité).
// Usage : node .claude/skills/supabase-db/scripts/split-tables.mjs
import fs from 'node:fs'
import path from 'node:path'
const root = process.argv[2] || '.'
const src = fs.readFileSync(path.join(root, 'docs/database.md'), 'utf8').replace(/\r\n/g, '\n')
const tables = src.split('## Types personnalisés')[0].split('\n### ').slice(1)
const dir = path.join(root, '.claude/skills/supabase-db/tables')
fs.mkdirSync(dir, { recursive: true })
for (const t of tables) {
  const head = t.split('\n')[0]
  const name = head.match(/`([^`]+)`/)[1]
  const body = t.split('\n').slice(1).join('\n').replace(/\n-{3,}\s*$/, '').trim()
  const file = name === 'User' ? 'user-legacy' : name
  const title = `# Table \`${name}\`${head.includes('legacy') ? ' (legacy)' : ''}`
  fs.writeFileSync(path.join(dir, `${file}.md`), `${title}\n\n> Extrait de docs/database.md, qui fait foi en cas d'écart.\n\n${body}\n`)
  console.log(`${file}.md — ${body.split('\n')[0]}`)
}
