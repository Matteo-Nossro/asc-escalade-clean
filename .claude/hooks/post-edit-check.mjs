// Hook PostToolUse (Edit|Write) : lance asc-rules/check.mjs sur le fichier .vue/.ts modifié.
// Conforme → silence. Erreurs → stderr + exit 2 (renvoyé à Claude). Avertissements seuls → additionalContext.
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

let raw = ''
for await (const chunk of process.stdin) raw += chunk
let input
try {
  input = JSON.parse(raw || '{}')
} catch {
  process.exit(0)
}

const file = String(input.tool_input?.file_path || '')
if (!/\.(vue|ts)$/.test(file) || /[\\/](node_modules|\.nuxt|\.output|dist)[\\/]/.test(file)) process.exit(0)

const root = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd()
const relFile = path.relative(root, path.resolve(root, file))
if (relFile.startsWith('..')) process.exit(0)

const check = path.join(path.dirname(fileURLToPath(import.meta.url)), '../skills/asc-rules/scripts/check.mjs')
const res = spawnSync(process.execPath, [check, relFile], { cwd: root, encoding: 'utf8' })
const out = (res.stdout || '').trim()
if (!out) process.exit(0)

if (res.status !== 0) {
  process.stderr.write(`asc-rules — violations dans ${relFile} :\n${out}\n`)
  process.exit(2)
}
process.stdout.write(JSON.stringify({
  hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: `asc-rules (avertissements) :\n${out}` },
}))
process.exit(0)
