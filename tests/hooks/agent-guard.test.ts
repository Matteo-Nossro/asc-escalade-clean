// @vitest-environment node
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

// Garde-fou Supabase de `.claude/hooks/agent-guard.mjs` (feature securite-bdd, décision du 2026-11-04).
// Boîte noire : le hook est lancé comme par Claude Code (JSON du hook sur stdin, profil « session »),
// `CLAUDE_PROJECT_DIR` pointe un dossier temporaire dont `supabase/.temp/project-ref` désigne le
// projet lié. Exit 0 = accepté, exit 2 = refusé (message sur stderr).
//
// Règle : `supabase db push|reset|query` et `supabase migration repair` ne sont autorisés QUE sur le
// ref du dev. `--remote=<autre ref | URL | branche>` : refus ; `--remote` seul ou `--linked` : refus
// si le projet lié n'est pas le dev ; `--db-url`, `--project-ref`, `--workdir` : refus ; une option
// placée avant la sous-commande ne contourne pas le contrôle ; `supabase link` dans la même commande
// ou une seconde commande chaînée visant un autre ref : refus.

const HOOK = resolve(__dirname, '../../.claude/hooks/agent-guard.mjs')
const DEV = 'ybtnnogxukfldurozqwa'
const AUTRE = 'aaaaaaaaaaaaaaaaaaaa'

type Lien = 'dev' | 'autre' | 'aucun'
const TOOLS = ['Bash', 'PowerShell'] as const

const racines: Record<Lien, string> = { dev: '', autre: '', aucun: '' }
let parent = ''

beforeAll(() => {
  parent = mkdtempSync(join(tmpdir(), 'asc-guard-'))
  for (const lien of ['dev', 'autre', 'aucun'] as const) {
    const racine = join(parent, lien)
    mkdirSync(join(racine, 'supabase', '.temp'), { recursive: true })
    if (lien !== 'aucun') writeFileSync(join(racine, 'supabase', '.temp', 'project-ref'), lien === 'dev' ? DEV : AUTRE)
    racines[lien] = racine
  }
})

afterAll(() => {
  if (parent) rmSync(parent, { recursive: true, force: true })
})

function lancer(tool: string, command: string, lien: Lien) {
  const res = spawnSync(process.execPath, [HOOK, 'session'], {
    input: JSON.stringify({ tool_name: tool, tool_input: { command } }),
    env: { ...process.env, CLAUDE_PROJECT_DIR: racines[lien] },
    encoding: 'utf8',
    timeout: 10000,
  })
  return { code: res.status, stderr: res.stderr ?? '' }
}

// Entrée brute sur stdin (JSON valide mais de forme inattendue, ou JSON invalide)
function lancerBrut(raw: string, lien: Lien = 'dev') {
  const res = spawnSync(process.execPath, [HOOK, 'session'], {
    input: raw,
    env: { ...process.env, CLAUDE_PROJECT_DIR: racines[lien] },
    encoding: 'utf8',
    timeout: 10000,
  })
  return { code: res.status, stderr: res.stderr ?? '' }
}

const S = 'npx supabase'
const SV = 'npx supabase@latest' // paquet versionné
const SV3 = 'npx -y supabase@3.0.0'

// ── Acceptés, projet lié = dev ───────────────────────────────────────────────
const ACCEPTES_DEV = [
  `${S} db push --remote --dry-run`,
  `${S} db push --remote --yes`,
  `${S} db push --remote=${DEV}`,
  `${S} db push --linked --dry-run`,
  `${S} db query --remote --read-only "select 1"`,
  `${S} db query --remote=${DEV} --read-only "select 1"`,
  `${S} db query --linked "select 1"`,
  `${S} migration repair --remote --status applied 20261102`,
  `${S} migration repair --remote=${DEV} --status applied 20261102`,
  `${S} migration list --remote`,
  'git status',
  `${S} db query "select 1"`, // cible locale
  `npx supabase@3.0.0 db push --remote --dry-run`, // paquet versionné
  `${SV} db push --remote=${DEV}`,
  'supabase migration up --remote',
  `${S} migration up --remote`,
]

// ── Refusés, projet lié = dev ────────────────────────────────────────────────
const COMMANDES = [
  ['push', 'db push'],
  ['query', 'db query'],
  ['repair', 'migration repair'],
] as const
const suffixe = (nom: string) => (nom === 'query' ? ' "select 1"' : nom === 'repair' ? ' --status applied 20261102' : '')

const REFUSES_DEV: string[] = []
for (const [nom, sous] of COMMANDES) {
  const fin = suffixe(nom)
  REFUSES_DEV.push(
    `${S} ${sous} --remote=${AUTRE}${fin}`,
    `${S} ${sous} --remote=https://${AUTRE}.supabase.co${fin}`,
    `${S} ${sous} --remote=ma-branche${fin}`,
    `${S} ${sous} --remote --db-url postgresql://postgres:x@db.${AUTRE}.supabase.co:5432/postgres${fin}`,
    `${S} ${sous} --remote --project-ref ${AUTRE}${fin}`,
    `${S} ${sous} --remote --workdir ../x${fin}`,
  )
}
REFUSES_DEV.push(
  // option placée avant la sous-commande
  `${S} --workdir ../x db push --remote`,
  `${S} --debug db push --remote=${AUTRE}`,
  `${S} --workdir ../x db query --remote "select 1"`,
  `${S} --debug migration repair --remote=${AUTRE} --status applied 20261102`,
  // `link` et écriture dans la même commande
  `${S} link && ${S} db push --remote`,
  `${S} link; ${S} db push --remote --dry-run`,
  // seconde commande chaînée visant un autre ref
  `${S} db push --remote --dry-run && ${S} db push --remote=${AUTRE}`,
  `${S} db push --remote --dry-run; ${S} db query --remote=${AUTRE} "select 1"`,
  `git status && ${S} migration repair --remote=${AUTRE} --status applied 20261102`,
  // `--remote <ref>` (espace au lieu de `=`)
  `${S} db push --remote ${AUTRE}`,
  `${S} db query --remote ${AUTRE} "select 1"`,
  `${S} migration repair --remote ${AUTRE} --status applied 20261102`,
  // paquet versionné (`supabase@<version>`)
  `${SV} db push --remote=${AUTRE}`,
  `${SV3} db query --remote=${AUTRE} "select 1"`,
  `${SV} db push --remote --db-url postgresql://postgres:x@db.${AUTRE}.supabase.co:5432/postgres`,
  // migration up|down|squash visent aussi un hébergé
  `${S} migration up --remote=${AUTRE}`,
  `${S} migration down --remote=${AUTRE}`,
  `${S} migration squash --remote=${AUTRE}`,
  `${S} migration up --remote --db-url postgresql://postgres:x@db.${AUTRE}.supabase.co:5432/postgres`,
)

// ── Refusés, projet lié = autre ou aucun ─────────────────────────────────────
const REFUSES_NON_DEV = [
  `${S} db push --remote`,
  `${S} db push --linked`,
  `${S} db query --remote "select 1"`,
  `${S} migration repair --remote --status applied 20261102`,
  // paquet versionné
  `${SV} db push --remote`,
  `${SV3} db push --linked`,
  // migration up|down|squash
  `${S} migration up --remote`,
  `${S} migration up --linked`,
  `${S} migration down --remote`,
  `${S} migration squash --remote`,
  'supabase migration up --remote',
  `${SV} migration up --linked`,
]

// ── Continuation de ligne : l'option interdite arrive après la coupure ───────
// Bash : `\` + retour à la ligne ; PowerShell : accent grave + retour à la ligne. LF et CRLF.
const CONTINUATEUR = { Bash: '\\', PowerShell: '`' } as const
const COUPURES = [['LF', '\n'], ['CRLF', '\r\n']] as const
const OPTIONS_CONTINUES = [
  '--db-url x',
  `--db-url postgresql://postgres:x@db.${AUTRE}.supabase.co:5432/postgres`,
  '--project-ref x',
  `--project-ref ${AUTRE}`,
  '--workdir x',
  `--remote=${AUTRE}`,
  `--remote ${AUTRE}`,
]

// ── Échec fermé : entrée du hook inattendue ⇒ exit 2 (le code 1 ne bloque pas) ─
const ENTREES_INATTENDUES: Array<[string, (tool: string) => string]> = [
  ['null', () => 'null'],
  ['tableau vide', () => '[]'],
  ['tableau contenant une commande', (t) => JSON.stringify([{ tool_name: t, tool_input: { command: 'git status' } }])],
  ['tool_input à null', (t) => JSON.stringify({ tool_name: t, tool_input: null })],
  ['command à null', (t) => JSON.stringify({ tool_name: t, tool_input: { command: null } })],
  ['command nombre', (t) => JSON.stringify({ tool_name: t, tool_input: { command: 42 } })],
  ['command booléen', (t) => JSON.stringify({ tool_name: t, tool_input: { command: true } })],
  ['command objet', (t) => JSON.stringify({ tool_name: t, tool_input: { command: { a: 'supabase db push' } } })],
  ['command tableau', (t) => JSON.stringify({ tool_name: t, tool_input: { command: ['supabase db push --remote'] } })],
]
const JSON_INVALIDE = ['{', 'pas du json', '{"tool_name": "Bash", "tool_input": {"command": ', 'undefined']

// ── Sans lien avec Supabase, ou simple mention du dossier de migrations ──────
const SANS_LIEN = [
  'git status',
  'npm test',
  'ls supabase/migrations',
  'cat supabase/migrations/20261103_fonctions_search_path.sql',
  'git add supabase/migrations/20261105_helloasso_grants_explicites.sql',
  'node scripts/check-securite-bdd.mjs',
]

describe.each(TOOLS)('agent-guard (%s)', (tool) => {
  describe('projet lié = dev : commandes acceptées', () => {
    it.each(ACCEPTES_DEV)('accepte : %s', (commande) => {
      const { code, stderr } = lancer(tool, commande, 'dev')
      expect(code, stderr).toBe(0)
    })
  })

  describe('projet lié = dev : cibles autres que le dev refusées', () => {
    it.each(REFUSES_DEV)('refuse : %s', (commande) => {
      const { code } = lancer(tool, commande, 'dev')
      expect(code).toBe(2)
    })
  })

  describe.each(['autre', 'aucun'] as const)('projet lié = %s', (lien) => {
    it.each(REFUSES_NON_DEV)('refuse : %s', (commande) => {
      const { code } = lancer(tool, commande, lien)
      expect(code).toBe(2)
    })
  })

  describe('projet lié = dev : continuation de ligne', () => {
    const cont = CONTINUATEUR[tool]
    const CAS = COUPURES.flatMap(([nom, saut]) =>
      OPTIONS_CONTINUES.map((opt) => [nom, `${S} db push ${cont}${saut}${opt}`] as const),
    )
    it.each(CAS)('refuse (%s) : %j', (_nom, commande) => {
      const { code } = lancer(tool, commande, 'dev')
      expect(code).toBe(2)
    })

    it.each(COUPURES)('refuse (%s) : option interdite sur db query et migration repair', (_nom, saut) => {
      expect(lancer(tool, `${S} db query ${cont}${saut}--remote ${cont}${saut}--project-ref ${AUTRE} "select 1"`, 'dev').code).toBe(2)
      expect(lancer(tool, `${S} migration repair ${cont}${saut}--remote=${AUTRE} --status applied 20261102`, 'dev').code).toBe(2)
    })

    it.each(COUPURES)('refuse (%s) : continuation dans la sous-commande et dans un paquet versionné', (_nom, saut) => {
      expect(lancer(tool, `${S} db ${cont}${saut}push --remote=${AUTRE}`, 'dev').code).toBe(2)
      expect(lancer(tool, `${SV} db push ${cont}${saut}--db-url x`, 'dev').code).toBe(2)
    })

    it.each(COUPURES)('accepte (%s) : continuation sans option interdite', (_nom, saut) => {
      const { code, stderr } = lancer(tool, `${S} db push ${cont}${saut}--remote --dry-run`, 'dev')
      expect(code, stderr).toBe(0)
    })
  })

  describe.each(['autre', 'aucun'] as const)('projet lié = %s : continuation de ligne', (lien) => {
    const cont = CONTINUATEUR[tool]
    it.each(COUPURES)('refuse (%s) : db push + --remote après la coupure', (_nom, saut) => {
      expect(lancer(tool, `${S} db push ${cont}${saut}--remote`, lien).code).toBe(2)
    })
  })

  describe('échec fermé : entrée du hook inattendue', () => {
    it.each(ENTREES_INATTENDUES)('exit 2 : %s', (_nom, fabrique) => {
      const { code } = lancerBrut(fabrique(tool))
      expect(code).toBe(2)
    })

    it.each(JSON_INVALIDE)('exit 2 : JSON invalide %j', (raw) => {
      const { code } = lancerBrut(raw)
      expect(code).toBe(2)
    })

    it('`{}` sans outil : comportement inchangé (accepté, pas une commande)', () => {
      const { code, stderr } = lancerBrut('{}')
      expect(code, stderr).toBe(0)
    })

    it('jamais le code 1 (non bloquant) quelle que soit l’entrée', () => {
      for (const [, fabrique] of ENTREES_INATTENDUES) expect(lancerBrut(fabrique(tool)).code).not.toBe(1)
      for (const raw of JSON_INVALIDE) expect(lancerBrut(raw).code).not.toBe(1)
    })
  })

  describe.each(['dev', 'autre', 'aucun'] as const)('commande sans lien avec Supabase (lié : %s)', (lien) => {
    it.each(SANS_LIEN)('accepte : %s', (commande) => {
      const { code, stderr } = lancer(tool, commande, lien)
      expect(code, stderr).toBe(0)
    })
  })

  describe('le message d’un refus nomme le projet attendu', () => {
    const CAS: Array<[string, Lien]> = [
      [`${S} db push --remote=${AUTRE}`, 'dev'],
      [`${S} db query --remote=ma-branche "select 1"`, 'dev'],
      [`${S} migration repair --remote=https://${AUTRE}.supabase.co --status applied 20261102`, 'dev'],
      [`${S} db push --remote --db-url postgresql://postgres:x@db.${AUTRE}.supabase.co:5432/postgres`, 'dev'],
      [`${S} db query --remote --project-ref ${AUTRE} "select 1"`, 'dev'],
      [`${S} --workdir ../x db push --remote`, 'dev'],
      [`${S} db push --remote`, 'autre'],
      [`${S} db query --remote "select 1"`, 'autre'],
      [`${S} db push --linked`, 'aucun'],
      [`${S} migration repair --remote --status applied 20261102`, 'aucun'],
    ]
    it.each(CAS)('%s (lié : %s)', (commande, lien) => {
      const { code, stderr } = lancer(tool, commande, lien)
      expect(code).toBe(2)
      expect(stderr).toContain(DEV)
    })
  })
})
