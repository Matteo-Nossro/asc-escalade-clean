// Garde PreToolUse pour les sous-agents.
// Usage (frontmatter d'agent) : node "${CLAUDE_PROJECT_DIR}/.claude/hooks/agent-guard.mjs" <profil>
// Lit le JSON du hook sur stdin. Exit 2 = refus (le message stderr est renvoyé à l'agent).
// Profil « session » : session principale (settings.json), seule la garde Supabase s'applique.
// Échec fermé : entrée illisible ou de forme inattendue, ou erreur interne ⇒ exit 2 (le code 1 ne bloque pas).
// Limites connues, non couvertes (garde-fou contre l'erreur, pas contre un contournement délibéré) :
//  - la commande construite par variable ou par fragments (`$S db push`, `p''ush`, `$(echo supabase) db push`) ;
//  - les variables d'environnement qui redirigent la CLI (`SUPABASE_DB_URL`, `SUPABASE_PROJECT_ID`, etc.) ;
//  - les faux positifs possibles sur un texte libre qui mentionne ces commandes (message de commit, echo, grep).
import fs from 'node:fs'
import path from 'node:path'

// Garde Supabase (tous profils) : db push|reset|query et migration repair|up|down|squash uniquement sur le projet de DEV
const SUPABASE_DEV_REF = 'ybtnnogxukfldurozqwa'
// Binaire seul ou paquet versionné (`supabase@latest`, `npx -y supabase@3.0.0`)
const SUPABASE_BIN = /^supabase(@\S*)?(\.(exe|cmd|ps1))?$/i
const SUPABASE_FORBIDDEN_OPTS = /^--(db-url|project-ref|workdir)(=|$)/
const unquote = (t) => t.replace(/^[$("'`]+|[)"'`]+$/g, '')
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

// Continuations de ligne rejointes avant la découpe : `\` (bash) et accent grave (PowerShell) suivis d'un retour à la ligne LF ou CRLF
const joinContinuations = (cmd) => cmd.replace(/\\\r?\n/g, '').replace(/`\r?\n/g, ' ')

// Segments d'une commande chaînée (; & | retour à la ligne) : une découpe qui respecte les guillemets,
// une autre qui les ignore (bash -c "a; b"), pour qu'aucune invocation de supabase n'échappe au contrôle.
function splitSegments(cmd) {
  const segments = []
  let cur = ''
  let quote = ''
  for (const c of cmd) {
    if (quote) {
      if (c === quote) quote = ''
      cur += c
    } else if (c === '"' || c === "'") {
      quote = c
      cur += c
    } else if (/[;&|\r\n]/.test(c)) {
      segments.push(cur)
      cur = ''
    } else cur += c
  }
  segments.push(cur)
  return [...segments, ...cmd.split(/[;&|\r\n]+/)]
}

// Chaque invocation de supabase : options et arguments qui suivent, arguments positionnels, commande gardée
function supabaseCalls(cmd) {
  const calls = []
  for (const segment of splitSegments(joinContinuations(cmd))) {
    const raw = segment.split(/\s+/).filter(Boolean)
    const tokens = raw.map(unquote)
    tokens.forEach((t, i) => {
      if (!SUPABASE_BIN.test(t.split(/[\\/]/).pop())) return
      const rest = tokens.slice(i + 1)
      const restRaw = raw.slice(i + 1)
      const pos = rest.filter((x) => !x.startsWith('-'))
      let kind = ''
      pos.forEach((p, j) => {
        if (p === 'db' && /^(push|reset|query)$/.test(pos[j + 1] || '')) kind = `db ${pos[j + 1]}`
        if (p === 'migration' && /^(repair|up|down|squash)$/.test(pos[j + 1] || '')) kind = `migration ${pos[j + 1]}`
      })
      calls.push({ rest, restRaw, pos, kind })
    })
  }
  return calls
}

const isObject = (v) => typeof v === 'object' && v !== null && !Array.isArray(v)

// Échec fermé : toute erreur interne est un refus (exit 2), jamais un exit 1 non bloquant
try {
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
if (!isObject(input)) deny('entrée du hook inattendue : un objet JSON est attendu')
const tool = input.tool_name
if (input.tool_input !== undefined && !isObject(input.tool_input)) deny('entrée du hook inattendue : tool_input doit être un objet')
const args = input.tool_input || {}

if (tool === 'Bash' || tool === 'PowerShell') {
  if (typeof args.command !== 'string') deny('entrée du hook inattendue : command doit être une chaîne')
  const cmd = args.command.trim()
  if (SEED_TEST_USERS.test(cmd) && process.argv[2] !== 'session') deny('seed-test-users.mjs est réservé à la session principale.')
  const calls = supabaseCalls(cmd)
  const guarded = calls.filter((c) => c.kind)
  if (guarded.length) {
    const dev = `projet de DEV « ${SUPABASE_DEV_REF} »`
    // Le lien est lu avant l'exécution : un « supabase link » dans la même commande le contournerait
    if (calls.some((c) => c.pos[0] === 'link')) deny(`supabase link et ${guarded[0].kind} dans la même commande : interdit, seul le ${dev} est accepté.`)
    const root = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd()
    let ref = ''
    try {
      ref = fs.readFileSync(path.join(root, 'supabase', '.temp', 'project-ref'), 'utf8').trim()
    } catch {}
    for (const { rest, restRaw, kind } of guarded) {
      const forbidden = rest.find((t) => SUPABASE_FORBIDDEN_OPTS.test(t))
      if (forbidden) deny(`supabase ${kind} avec ${forbidden.split('=')[0]} : interdit, seul le ${dev} est accepté.`)
      // Valeurs de --remote : `--remote=<v>` ou `--remote <v>` ; null = sans valeur (projet lié).
      // Le mot suivant n'est pas une valeur s'il commence par « - » ou ouvre une chaîne non fermée (requête SQL).
      const remotes = []
      rest.forEach((t, i) => {
        if (t.startsWith('--remote=')) remotes.push(t.slice(9).replace(/["'`]/g, ''))
        else if (t === '--remote') {
          const next = rest[i + 1]
          const nextRaw = restRaw[i + 1] || ''
          const freeText = /^["'`]/.test(nextRaw) && !/["'`]$/.test(nextRaw)
          remotes.push(next && !next.startsWith('-') && !freeText ? next : null)
        }
      })
      const badRemote = remotes.find((v) => v !== null && v !== SUPABASE_DEV_REF)
      if (badRemote !== undefined) deny(`supabase ${kind} refusé : cible « --remote=${badRemote} » ≠ ${dev}.`)
      const linked = remotes.includes(null) || rest.some((t) => /^--linked(=|$)/.test(t))
      // Sans --remote ni --linked : db query vise le local ; les autres commandes visent le projet lié
      const targetsLinked = linked || (!remotes.length && kind !== 'db query')
      if (targetsLinked && ref !== SUPABASE_DEV_REF) deny(`supabase ${kind} refusé : projet lié « ${ref || 'aucun'} » ≠ ${dev}.`)
    }
  }
}

if (tool === 'Bash') {
  const cmd = args.command.trim()
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
} catch (e) {
  deny(`erreur interne, refus par défaut : ${e && e.message ? e.message : e}`)
}

process.exit(0)
