// Garde PreToolUse pour les sous-agents.
// Usage (frontmatter d'agent) : node "${CLAUDE_PROJECT_DIR}/.claude/hooks/agent-guard.mjs" <profil>
// Lit le JSON du hook sur stdin. Exit 2 = refus (le message stderr est renvoyé à l'agent).
// Profil « session » : session principale (settings.json), seule la garde Supabase s'applique.
import fs from 'node:fs'
import path from 'node:path'

// Garde Supabase (tous profils) : db push / db reset uniquement sur le projet de DEV lié
const SUPABASE_DEV_REF = 'ybtnnogxukfldurozqwa'
const SUPABASE_DB_WRITE = /\bsupabase\s+db\s+(push|reset)\b/
// Création des comptes de test (service role) : session principale uniquement
const SEED_TEST_USERS = /seed-test-users\.mjs/

const GRAPHIFY_READ = /^graphify (query|path|explain)\s/
const GRAPHIFY_UPDATE = /^graphify update \.\s*$/
const GIT_READ = /^git (diff|log|status|show)(\s|$)/
const CHECK = /^node\s+"?(?:[^"\s]*[\\/])?\.claude[\\/]skills[\\/]asc-rules[\\/]scripts[\\/]check\.mjs"?(\s|$)/
const TYPECHECK = /^npm run typecheck\s*$/
// Playwright : réservé à l'agent e2e (préfixe E2E_SKIP_BUILD=1 toléré)
const E2E_RUN = /^(E2E_SKIP_BUILD=1\s+)?(npm run test:e2e|npx playwright (test|show-report))(\s|$)/
const E2E_INSTALL = /^npx playwright install chromium\s*$/
const E2E_ANY = /playwright|test:e2e/
const E2E_ONLY = [E2E_ANY, 'Playwright / test:e2e est réservé à l\'agent e2e']
const REGISTER = /register-blok\.mjs/
const SPLIT_TABLES = /^node\s+"?(?:[^"\s]*[\\/])?\.claude[\\/]skills[\\/]supabase-db[\\/]scripts[\\/]split-tables\.mjs"?\s*$/

const PROFILES = {
  // explorer : lecture du graphe uniquement
  explore: { only: [GRAPHIFY_READ] },
  // doc-writer : graphe (lecture + update), git en lecture, régénération des fiches supabase-db
  doc: { only: [GRAPHIFY_READ, GRAPHIFY_UPDATE, GIT_READ, SPLIT_TABLES] },
  // reviewer : diff git + graphe + check.mjs + typecheck, écriture limitée à docs/features/
  review: { only: [GIT_READ, GRAPHIFY_READ, CHECK, TYPECHECK], write: ['docs/features/'] },
  // e2e : Playwright + graphe + git en lecture ; écriture limitée aux tests e2e, à sa config et au suivi de feature
  e2e: { only: [E2E_RUN, E2E_INSTALL, GRAPHIFY_READ, GIT_READ], write: ['e2e/', 'playwright.config.ts', 'docs/features/'] },
  // api-dev : Bash libre (check.mjs compris), sauf register-blok et Playwright
  dev: { forbid: [[REGISTER, 'register-blok.mjs est réservé à storyblok-dev'], E2E_ONLY] },
  // qa : Vitest et typecheck libres, sauf register-blok et Playwright (agent e2e)
  qa: { forbid: [[REGISTER, 'register-blok.mjs est réservé à storyblok-dev'], E2E_ONLY] },
  // ui-dev : idem dev (profil séparé pour l'accès aux skills)
  ui: { forbid: [[REGISTER, 'register-blok.mjs est réservé à storyblok-dev'], E2E_ONLY] },
  // storyblok-dev : Bash libre, register-blok compris, sauf Playwright
  storyblok: { forbid: [E2E_ONLY] },
  // planner : pas de Bash, seulement le contrôle des skills
  plan: {},
  // session principale : aucune restriction propre (garde Supabase seulement)
  session: {},
}

// Skills réservées : nom -> profils autorisés (les skills absentes de cette table sont libres)
const SKILL_ACCESS = {
  'helloasso-api': ['plan', 'dev', 'review'],
}

const deny = (msg) => {
  process.stderr.write(`agent-guard: ${msg}\n`)
  process.exit(2)
}

const profile = PROFILES[process.argv[2]]
if (!profile) deny(`profil inconnu "${process.argv[2]}"`)

let raw = ''
for await (const chunk of process.stdin) raw += chunk
let input
try {
  input = JSON.parse(raw || '{}')
} catch {
  deny('entrée du hook illisible')
}
const tool = input.tool_name
const args = input.tool_input || {}

if (tool === 'Bash' || tool === 'PowerShell') {
  const cmd = String(args.command || '').trim()
  if (SEED_TEST_USERS.test(cmd) && process.argv[2] !== 'session') deny('seed-test-users.mjs est réservé à la session principale.')
  if (SUPABASE_DB_WRITE.test(cmd)) {
    // Le lien est lu avant l'exécution : un « supabase link » ou une cible explicite dans la même commande le contournerait
    if (/\bsupabase\s+link\b/.test(cmd)) deny('supabase link et db push/reset dans la même commande : interdit.')
    if (/--db-url\b|--project-ref\b/.test(cmd)) deny('db push/reset avec --db-url ou --project-ref : interdit, seul le projet lié est accepté.')
    const root = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd()
    let ref = ''
    try {
      ref = fs.readFileSync(path.join(root, 'supabase', '.temp', 'project-ref'), 'utf8').trim()
    } catch {}
    if (ref !== SUPABASE_DEV_REF) deny(`supabase db push/reset refusé : projet lié « ${ref || 'aucun'} » ≠ projet de DEV « ${SUPABASE_DEV_REF} ».`)
  }
}

if (tool === 'Bash') {
  const cmd = String(args.command || '').trim()
  for (const [re, msg] of profile.forbid || []) if (re.test(cmd)) deny(msg)
  if (profile.only) {
    if (/[;&|`<>\n]|\$\(/.test(cmd)) deny('chaînage, pipe et redirection interdits : une seule commande simple.')
    if (!profile.only.some((re) => re.test(cmd + ' '))) {
      deny(`commande non autorisée pour ce rôle : "${cmd}". Autorisées : ${profile.only.map(String).join(', ')}`)
    }
  }
} else if (tool === 'Skill') {
  const skill = String(args.skill || '').split(':').pop()
  const allowed = SKILL_ACCESS[skill]
  if (allowed && !allowed.includes(process.argv[2])) deny(`skill « ${skill} » non autorisée pour ce rôle (réservée à : ${allowed.join(', ')})`)
} else if (tool === 'Edit' || tool === 'Write') {
  if (profile.write) {
    const root = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd()
    const rel = path.relative(root, path.resolve(root, String(args.file_path || ''))).replace(/\\/g, '/')
    if (!profile.write.some((p) => rel.startsWith(p))) deny(`écriture limitée à ${profile.write.join(', ')} (reçu : ${rel})`)
  }
}

process.exit(0)
